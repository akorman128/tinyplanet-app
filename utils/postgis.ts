/**
 * PostGIS coordinate utilities for parsing and working with POINT geometry
 */

import { logger } from "@/utils/logger";

/**
 * Parse PostGIS POINT format: "POINT(lng lat)" → { latitude, longitude }
 * Returns null if format is invalid
 *
 * @example
 * parsePostGISPoint("POINT(-122.4194 37.7749)") // { latitude: 37.7749, longitude: -122.4194 }
 * parsePostGISPoint("invalid") // null
 */
export function parsePostGISPoint(pointString: string): {
  latitude: number;
  longitude: number;
} | null {
  const match = pointString.match(/POINT\(([^ ]+) ([^ ]+)\)/);
  if (!match?.[1] || !match?.[2]) return null;

  const longitude = parseFloat(match[1]);
  const latitude = parseFloat(match[2]);

  if (isNaN(longitude) || isNaN(latitude)) return null;

  return { latitude, longitude };
}

/**
 * Validate coordinates exist and are valid numbers
 * Type guard that narrows the type to valid coordinates
 *
 * @example
 * if (isValidCoordinate(coords)) {
 *   // coords is now { latitude: number; longitude: number }
 *   logger.log(coords.latitude, coords.longitude);
 * }
 */
export function isValidCoordinate(
  coord: { latitude?: number; longitude?: number } | null
): coord is { latitude: number; longitude: number } {
  return (
    coord !== null &&
    typeof coord.latitude === "number" &&
    typeof coord.longitude === "number" &&
    !isNaN(coord.latitude) &&
    !isNaN(coord.longitude)
  );
}

/**
 * Create PostGIS POINT format from coordinates
 * Note: PostGIS uses (longitude, latitude) order
 *
 * @example
 * createPostGISPoint(37.7749, -122.4194) // "POINT(-122.4194 37.7749)"
 */
export function createPostGISPoint(
  latitude: number,
  longitude: number
): string {
  return `POINT(${longitude} ${latitude})`;
}
