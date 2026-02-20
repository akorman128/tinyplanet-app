import { ListPlace } from "@/types/list";
import {
  GeoJSONFeatureCollection,
  ConnectionLine,
  ConnectionData,
} from "@/types/friendship";
import { TravelPlanMapLocation } from "@/types/travelPlan";
import { getDurationInDays } from "./durationInDays";

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

/**
 * Builds connection lines between the user, their friends, and mutuals
 */
export function buildConnectionLines(
  friendLocations: GeoJSONFeatureCollection,
  userLocation: [number, number]
): ConnectionData {
  const userToFriendLines: ConnectionLine[] = [];
  const friendToMutualLines: ConnectionLine[] = [];

  const friendCoordinatesMap = new Map<string, [number, number]>();

  friendLocations.features.forEach((feature) => {
    const { id, type, connecting_friend_id } = feature.properties;
    const coordinates = feature.geometry.coordinates as [number, number];

    if (type === "friend") {
      friendCoordinatesMap.set(id, coordinates);
      userToFriendLines.push({
        from: { id: "user", coordinates: userLocation },
        to: { id, coordinates },
        type: "user-to-friend",
      });
    } else if (type === "mutual" && connecting_friend_id) {
      const friendCoords = friendCoordinatesMap.get(connecting_friend_id);
      if (friendCoords) {
        friendToMutualLines.push({
          from: { id: connecting_friend_id, coordinates: friendCoords },
          to: { id, coordinates },
          type: "friend-to-mutual",
        });
      }
    }
  });

  return { userToFriendLines, friendToMutualLines };
}

/**
 * Converts connection lines to a GeoJSON FeatureCollection of LineStrings
 */
export function connectionLinesToGeoJSON(lines: ConnectionLine[]) {
  return {
    type: "FeatureCollection" as const,
    features: lines.map((line) => ({
      type: "Feature" as const,
      geometry: {
        type: "LineString" as const,
        coordinates: [line.from.coordinates, line.to.coordinates],
      },
      properties: {},
    })),
  };
}

/**
 * Converts travel plan locations to a GeoJSON FeatureCollection with rocket marker properties
 */
export function travelPlansToGeoJSON(travelPlans: TravelPlanMapLocation[]) {
  return {
    type: "FeatureCollection" as const,
    features: travelPlans.map((tp) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [tp.longitude, tp.latitude] as [number, number],
      },
      properties: {
        id: tp.id,
        user_id: tp.user_id,
        name: tp.full_name,
        destination_name: tp.destination_name,
        start_date: tp.start_date,
        end_date: tp.end_date,
        type: tp.type,
        title: `${tp.full_name} - ${getDurationInDays(tp.start_date, tp.end_date)} days`,
      },
    })),
  };
}
