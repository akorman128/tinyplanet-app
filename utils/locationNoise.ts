import { LocationCoordinates } from "@/stores/locationStore";

const EARTH_RADIUS_METERS = 6_371_000;
const MILES_TO_METERS = 1_609.344;

/**
 * Apply random noise to coordinates within a given radius.
 * Uses sqrt(random) for uniform area distribution.
 */
export function applyLocationNoise(
  coords: LocationCoordinates,
  radiusMiles: number
): LocationCoordinates {
  if (radiusMiles <= 0) {
    return { latitude: coords.latitude, longitude: coords.longitude };
  }

  const radiusMeters = radiusMiles * MILES_TO_METERS;
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.sqrt(Math.random()) * radiusMeters;

  // Offset in radians
  const dLat = (distance * Math.cos(angle)) / EARTH_RADIUS_METERS;
  const dLng =
    (distance * Math.sin(angle)) /
    (EARTH_RADIUS_METERS * Math.cos((coords.latitude * Math.PI) / 180));

  return {
    latitude: coords.latitude + (dLat * 180) / Math.PI,
    longitude: coords.longitude + (dLng * 180) / Math.PI,
  };
}
