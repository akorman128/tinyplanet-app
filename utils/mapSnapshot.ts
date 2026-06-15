/**
 * Build a Mapbox Static Images API URL for a single location, with a coral pin.
 * Used by the Hang feed card banner and the Hang detail hero.
 *
 * https://docs.mapbox.com/api/maps/static-images/
 */
const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

// Coral pin (hex without leading '#', per the Static Images API marker syntax).
const CORAL = "ff6b6b";
// Match the app's default Mapbox style.
const STYLE = "mapbox/streets-v12";

export interface StaticMapOptions {
  width?: number;
  height?: number;
  zoom?: number;
  /** Retina output (doubles the rendered resolution). Defaults to true. */
  retina?: boolean;
}

export function buildStaticMapUrl(
  longitude: number,
  latitude: number,
  { width = 780, height = 304, zoom = 14, retina = true }: StaticMapOptions = {}
): string | null {
  if (
    !MAPBOX_ACCESS_TOKEN ||
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude)
  ) {
    return null;
  }

  const marker = `pin-s+${CORAL}(${longitude},${latitude})`;
  const center = `${longitude},${latitude},${zoom}`;
  const size = `${Math.round(width)}x${Math.round(height)}${retina ? "@2x" : ""}`;

  return `https://api.mapbox.com/styles/v1/${STYLE}/static/${marker}/${center}/${size}?access_token=${MAPBOX_ACCESS_TOKEN}`;
}
