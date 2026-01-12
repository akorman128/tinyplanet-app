import { ListPlace } from "@/types/list";

interface Coordinates {
  latitude: number | null;
  longitude: number | null;
}

interface ValidCoordinates {
  latitude: number;
  longitude: number;
}

export interface MapBounds {
  ne: [number, number];
  sw: [number, number];
}

/**
 * Filters places to only those with valid coordinates (non-null, non-NaN)
 */
export function filterValidPlaces<T extends Coordinates>(places: T[]): T[] {
  return places.filter(
    (place) =>
      place.latitude !== null &&
      place.longitude !== null &&
      !isNaN(place.latitude) &&
      !isNaN(place.longitude)
  );
}

/**
 * Calculates map bounds from an array of places with coordinates
 */
export function calculateMapBounds(
  places: ValidCoordinates[]
): MapBounds | null {
  if (places.length === 0) return null;

  const lats = places.map((p) => p.latitude);
  const lngs = places.map((p) => p.longitude);

  return {
    ne: [Math.max(...lngs), Math.max(...lats)],
    sw: [Math.min(...lngs), Math.min(...lats)],
  };
}

interface PlacesToGeoJSONOptions {
  truncateName?: number;
}

/**
 * Converts list places to a GeoJSON FeatureCollection for Mapbox
 */
export function placesToGeoJSON(
  places: ListPlace[],
  options: PlacesToGeoJSONOptions = {}
): GeoJSON.FeatureCollection {
  const { truncateName } = options;

  return {
    type: "FeatureCollection",
    features: places
      .filter(
        (place) =>
          place.latitude !== null &&
          place.longitude !== null &&
          !isNaN(place.latitude) &&
          !isNaN(place.longitude)
      )
      .map((place) => {
        let name = place.resolved_name;
        if (truncateName && name.length > truncateName) {
          name = name.slice(0, truncateName) + "...";
        }

        return {
          type: "Feature" as const,
          properties: {
            id: place.id,
            name,
            isAmbiguous: place.status === "ambiguous",
          },
          geometry: {
            type: "Point" as const,
            coordinates: [place.longitude!, place.latitude!],
          },
        };
      }),
  };
}
