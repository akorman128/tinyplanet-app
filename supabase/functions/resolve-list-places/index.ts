import { corsHeaders, json } from "../_shared/http.ts";
import { requireUser } from "../_shared/auth.ts";

const MAPBOX_ACCESS_TOKEN = Deno.env.get("MAPBOX_ACCESS_TOKEN");
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

// Generate session token for Mapbox Search Box API billing
function generateSessionToken(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Delay helper for rate limiting
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Geocode location name to get proximity coordinates
async function getLocationCoordinates(
  locationName: string
): Promise<{ lat: number; lng: number } | null> {
  const params = new URLSearchParams({
    q: locationName,
    access_token: MAPBOX_ACCESS_TOKEN || "",
    limit: "1",
    language: "en",
    types: "place,region,locality",
  });

  const url = `https://api.mapbox.com/search/searchbox/v1/suggest?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    console.error("[Location Geocode] Suggest failed:", await response.text());
    return null;
  }

  const data = await response.json();
  const suggestion = data.suggestions?.[0];

  if (!suggestion?.mapbox_id) {
    console.log("[Location Geocode] No suggestion found for:", locationName);
    return null;
  }

  // Retrieve coordinates
  const retrieveUrl = `https://api.mapbox.com/search/searchbox/v1/retrieve/${suggestion.mapbox_id}?access_token=${MAPBOX_ACCESS_TOKEN}`;
  const retrieveResponse = await fetch(retrieveUrl);

  if (!retrieveResponse.ok) {
    console.error(
      "[Location Geocode] Retrieve failed:",
      await retrieveResponse.text()
    );
    return null;
  }

  const retrieveData = await retrieveResponse.json();
  const feature = retrieveData.features?.[0];
  const coords = feature?.geometry?.coordinates;

  if (coords) {
    console.log(
      `[Location Geocode] Found coordinates for "${locationName}":`,
      coords
    );
    return { lng: coords[0], lat: coords[1] };
  }

  return null;
}

// Search for place using Mapbox Search Box API
async function searchPlace(
  placeName: string,
  proximityCoords: { lat: number; lng: number } | null,
  sessionToken: string
): Promise<{
  original_text: string;
  resolved_name: string;
  latitude: number | null;
  longitude: number | null;
  confidence: number;
  status: "resolved" | "ambiguous";
  alternatives: { name: string; full_address: string }[];
}> {
  // Use just the place name - proximity bias handles location context
  const searchQuery = placeName;

  const params = new URLSearchParams({
    q: searchQuery,
    access_token: MAPBOX_ACCESS_TOKEN || "",
    session_token: sessionToken,
    limit: "5",
    language: "en",
    types: "poi",
  });

  // Add proximity bias if we have coordinates
  if (proximityCoords) {
    params.append("proximity", `${proximityCoords.lng},${proximityCoords.lat}`);
  }

  const suggestUrl = `https://api.mapbox.com/search/searchbox/v1/suggest?${params.toString()}`;
  console.log(`[Search] Searching for: "${searchQuery}"`);

  const suggestResponse = await fetch(suggestUrl);

  if (!suggestResponse.ok) {
    console.error("[Search] Suggest API error:", await suggestResponse.text());
    return {
      original_text: placeName,
      resolved_name: placeName,
      latitude: null,
      longitude: null,
      confidence: 0,
      status: "ambiguous",
      alternatives: [],
    };
  }

  const suggestData = await suggestResponse.json();
  const suggestions =
    suggestData.suggestions?.filter((s: any) => s.mapbox_id) || [];

  if (suggestions.length === 0) {
    console.log(`[Search] No suggestions found for: "${searchQuery}"`);
    return {
      original_text: placeName,
      resolved_name: placeName,
      latitude: null,
      longitude: null,
      confidence: 0,
      status: "ambiguous",
      alternatives: [],
    };
  }

  // Use the best (first) suggestion
  const bestSuggestion = suggestions[0];
  console.log(
    `[Search] Best suggestion: "${bestSuggestion.name}" (${bestSuggestion.place_formatted || bestSuggestion.full_address || ""})`
  );

  // Retrieve coordinates for the best suggestion
  const retrieveParams = new URLSearchParams({
    access_token: MAPBOX_ACCESS_TOKEN || "",
    session_token: sessionToken,
  });
  const retrieveUrl = `https://api.mapbox.com/search/searchbox/v1/retrieve/${bestSuggestion.mapbox_id}?${retrieveParams.toString()}`;

  const retrieveResponse = await fetch(retrieveUrl);

  if (!retrieveResponse.ok) {
    console.error(
      "[Search] Retrieve API error:",
      await retrieveResponse.text()
    );
    return {
      original_text: placeName,
      resolved_name: bestSuggestion.name || placeName,
      latitude: null,
      longitude: null,
      confidence: 0.5,
      status: "ambiguous",
      alternatives: [],
    };
  }

  const retrieveData = await retrieveResponse.json();
  const feature = retrieveData.features?.[0];

  if (!feature?.geometry?.coordinates) {
    console.log(
      `[Search] No coordinates in retrieve response for: "${searchQuery}"`
    );
    return {
      original_text: placeName,
      resolved_name: bestSuggestion.name || placeName,
      latitude: null,
      longitude: null,
      confidence: 0.5,
      status: "ambiguous",
      alternatives: [],
    };
  }

  const [lng, lat] = feature.geometry.coordinates;
  const isPoi = feature.properties?.feature_type === "poi";

  console.log(
    `[Search] Resolved "${placeName}" -> "${bestSuggestion.name}" at [${lat}, ${lng}]`
  );

  // Build alternatives from other suggestions
  const alternatives = suggestions.slice(1).map((s: any) => ({
    name: s.name,
    full_address: s.full_address || s.place_formatted || "",
  }));

  const confidence = isPoi ? 0.9 : 0.7;

  return {
    original_text: placeName,
    resolved_name: bestSuggestion.name,
    latitude: lat,
    longitude: lng,
    confidence,
    status: confidence >= 0.85 ? "resolved" : "ambiguous",
    alternatives,
  };
}

// Extract place names from freeform text using Claude
async function extractPlacesFromText(
  text: string,
  locationName: string,
  title: string,
  category: string
): Promise<string[]> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: `You extract named places from text and return them as a JSON array of strings.
  
    Rules:
    - Include: specific named venues (restaurants, bars, cafes, shops, landmarks, parks, museums, hotels)
    - Exclude: city names, neighbourhoods, regions, vague references ("a great spot", "the Italian place")
    - Clean names lightly if needed (fix obvious typos, remove "the" prefix where unnatural)
    - No duplicates
    - If nothing qualifies, return []
    
    Return ONLY the JSON array. No explanation, no markdown.
    
    Example output: ["Blue Bottle Coffee", "Tartine Bakery", "Dolores Park"]`,
      messages: [
        {
          role: "user",
          content: `List Title: ${title}\nCategory: ${category}\nLocation: ${locationName}\n\n${text}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[AI Extract] Anthropic API error:", errorText);
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text ?? "";

  // Strip markdown fences if present
  const cleaned = content.replace(/```(?:json)?\s*|\s*```/g, "").trim();

  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) {
    throw new Error("AI response is not an array");
  }

  console.log(`[AI Extract] Extracted ${parsed.length} places:`, parsed);
  return parsed.filter((p: unknown) => typeof p === "string" && p.length > 0);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!MAPBOX_ACCESS_TOKEN) {
      return json({ error: "Mapbox access token not configured" }, 500);
    }

    const auth = await requireUser(req);
    if (auth instanceof Response) return auth;

    const body = await req.json();
    const {
      location_name,
      places,
      freeform_text,
      latitude,
      longitude,
      title,
      category,
    } = body;

    if (!location_name || !title || !category) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: location_name, title, category",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Determine places to resolve: freeform_text takes precedence
    let placesToResolve: string[];

    if (typeof freeform_text === "string" && freeform_text.trim().length > 0) {
      try {
        placesToResolve = await extractPlacesFromText(
          freeform_text,
          location_name,
          title,
          category
        );
      } catch (err) {
        console.error("[Main] AI extraction failed:", err);
        const isKeyMissing =
          err instanceof Error && err.message.includes("ANTHROPIC_API_KEY");
        return new Response(
          JSON.stringify({
            error: "Failed to extract places from text",
            details: err instanceof Error ? err.message : String(err),
          }),
          {
            status: isKeyMissing ? 500 : 422,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } else if (Array.isArray(places) && places.length > 0) {
      placesToResolve = places;
    } else {
      return new Response(
        JSON.stringify({
          error: "Missing required field: freeform_text or places",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Use passed coordinates directly if available, otherwise geocode location name
    const proximityCoords =
      latitude && longitude
        ? { lat: latitude, lng: longitude }
        : await getLocationCoordinates(location_name);
    console.log(
      `[Main] Proximity coordinates for "${location_name}":`,
      proximityCoords
    );

    const sessionToken = generateSessionToken();

    // Process places sequentially to avoid Mapbox rate limiting
    const resolvedPlaces = [];
    for (let i = 0; i < placesToResolve.length; i++) {
      const result = await searchPlace(
        placesToResolve[i],
        proximityCoords,
        sessionToken
      );
      resolvedPlaces.push(result);
      // Small delay between requests to respect rate limits
      if (i < placesToResolve.length - 1) {
        await delay(100);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        resolved_places: resolvedPlaces,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
