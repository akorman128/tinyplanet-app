import React, { useState, useEffect, useRef } from "react";
import { View, TextInput, Pressable, ScrollView } from "react-native";
import { colors, Label, Body, Caption, Text } from "@/design-system";
import { useLocationStore } from "@/stores/locationStore";
import { logger } from "@/utils/logger";

const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

// Generate a simple session token for Mapbox Search API billing
function generateSessionToken() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface LocationResult {
  id: string;
  name: string;
  full_address: string;
  place_formatted: string;
}

export interface LocationSearchValue {
  name: string;
  latitude: number;
  longitude: number;
}

interface LocationSearchInputProps {
  label?: string;
  value?: LocationSearchValue | null;
  onChange: (value: LocationSearchValue | null) => void;
  onTextOnly?: (text: string) => void;
  allowTextOnly?: boolean;
  error?: string;
  placeholder?: string;
  inputClassName?: string;
}

export function LocationSearchInput({
  label,
  value,
  onChange,
  onTextOnly,
  allowTextOnly = false,
  error,
  placeholder = "Search for a place...",
  inputClassName = "",
}: LocationSearchInputProps) {
  const { currentLocation } = useLocationStore();
  const [query, setQuery] = useState(value?.name || "");
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionTokenRef = useRef(generateSessionToken());

  const hasQuery = query.trim().length > 0 && query !== value?.name;
  const showTextOnlyOption = allowTextOnly && hasQuery && onTextOnly;
  const showDropdown = results.length > 0 || showTextOnlyOption;

  // Sync query with value prop (for form reset scenarios)
  useEffect(() => {
    const newQuery = value?.name || "";
    if (newQuery !== query) {
      setQuery(newQuery);
    }
  }, [value?.name]); // Remove query from deps to prevent loops

  // Debounced search
  useEffect(() => {
    // Don't search if query is empty or matches the selected value
    if (!query.trim() || query === value?.name) {
      setResults([]);
      return;
    }

    // Clear previous timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Set new debounce timeout
    debounceTimeout.current = setTimeout(() => {
      searchLocations(query);
    }, 400);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [query, value?.name]);

  const searchLocations = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      // Use Mapbox Search Box API for POI/place/address search
      const params = new URLSearchParams({
        q: searchQuery,
        access_token: MAPBOX_ACCESS_TOKEN || "",
        session_token: sessionTokenRef.current,
        limit: "5",
        language: "en",
      });

      // Bias results toward user's current location if available
      if (currentLocation?.latitude && currentLocation?.longitude) {
        params.append(
          "proximity",
          `${currentLocation.longitude},${currentLocation.latitude}`
        );
      }

      const url = `https://api.mapbox.com/search/searchbox/v1/suggest?${params.toString()}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        logger.error("Search API error:", response.status, data);
        throw new Error(
          `Search API error: ${response.status} - ${data?.message || "Unknown error"}`
        );
      }

      interface MapboxSuggestion {
        mapbox_id: string;
        name: string;
        full_address?: string;
        place_formatted?: string;
      }

      const locations: LocationResult[] =
        data.suggestions
          ?.filter((s: MapboxSuggestion) => s.mapbox_id)
          .map((s: MapboxSuggestion) => ({
            id: s.mapbox_id,
            name: s.name,
            full_address: s.full_address || "",
            place_formatted: s.place_formatted || "",
          })) || [];

      setResults(locations);
    } catch (err) {
      logger.error("Error searching locations:", err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectLocation = async (result: LocationResult) => {
    const displayName =
      result.full_address || result.place_formatted
        ? `${result.name}, ${result.full_address || result.place_formatted}`
        : result.name;
    setQuery(displayName);
    setResults([]);

    // Call retrieve endpoint to get coordinates
    try {
      const params = new URLSearchParams({
        access_token: MAPBOX_ACCESS_TOKEN || "",
        session_token: sessionTokenRef.current,
      });
      const url = `https://api.mapbox.com/search/searchbox/v1/retrieve/${result.id}?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        logger.error("Retrieve API error:", response.status, errorData);
        throw new Error(`Retrieve API error: ${response.status}`);
      }

      const data = await response.json();
      const feature = data.features?.[0];

      if (feature?.geometry?.coordinates) {
        onChange({
          name: displayName,
          longitude: feature.geometry.coordinates[0],
          latitude: feature.geometry.coordinates[1],
        });
        // Generate new session token after successful retrieval
        sessionTokenRef.current = generateSessionToken();
      }
    } catch (err) {
      logger.error("Error retrieving location details:", err);
    }
  };

  const handleChangeText = (text: string) => {
    setQuery(text);
    if (!text.trim()) {
      onChange(null);
      setResults([]);
    }
  };

  const handleTextOnly = () => {
    if (query.trim() && onTextOnly) {
      onTextOnly(query.trim());
      setResults([]);
    }
  };

  return (
    <View className="mb-4">
      <Label className="mb-2 font-semibold">{label}</Label>

      <View className="relative">
        <TextInput
          value={query}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          className={`py-3 px-4 rounded-xl bg-white text-base text-gray-900 leading-5 shadow-xs ${inputClassName}`}
          placeholderTextColor={colors.hex.placeholder}
          autoCapitalize="words"
          autoCorrect={false}
        />

        {isLoading && (
          <View className="absolute right-4 top-3">
            <Text className="text-gray-500 text-sm">Searching...</Text>
          </View>
        )}

        {/* Dropdown results */}
        {showDropdown && (
          <View className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
            <ScrollView
              style={{ maxHeight: 200 }}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
            >
              {results.map((item) => (
                <Pressable
                  key={item.id}
                  className="px-4 py-3 border-b border-gray-100"
                  onPress={() => handleSelectLocation(item)}
                >
                  <Body>{item.name}</Body>
                  {(item.full_address || item.place_formatted) && (
                    <Caption numberOfLines={1}>
                      {item.full_address || item.place_formatted}
                    </Caption>
                  )}
                </Pressable>
              ))}
              {showTextOnlyOption && (
                <Pressable
                  className="px-4 py-3 bg-gray-50"
                  onPress={handleTextOnly}
                >
                  <Text className="text-base text-gray-600">
                    Use "{query.trim()}" as text only
                  </Text>
                  <Text className="text-sm text-gray-400">No map location</Text>
                </Pressable>
              )}
            </ScrollView>
          </View>
        )}
      </View>

      {error && <Caption className="text-red-500 mt-1">{error}</Caption>}
    </View>
  );
}
