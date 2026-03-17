import { applyLocationNoise } from "@/utils/locationNoise";
import { LocationCoordinates } from "@/stores/locationStore";

const NYC: LocationCoordinates = { latitude: 40.7128, longitude: -74.006 };
const MILES_TO_METERS = 1_609.344;
const EARTH_RADIUS_METERS = 6_371_000;

/** Haversine distance in meters between two coordinates */
function haversineMeters(
  a: LocationCoordinates,
  b: LocationCoordinates
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

describe("applyLocationNoise", () => {
  it("returns exact copy when radiusMiles = 0", () => {
    const result = applyLocationNoise(NYC, 0);
    expect(result.latitude).toBe(NYC.latitude);
    expect(result.longitude).toBe(NYC.longitude);
    // Should be a new object, not the same reference
    expect(result).not.toBe(NYC);
  });

  it("returns different coordinates when radiusMiles > 0", () => {
    const result = applyLocationNoise(NYC, 0.5);
    const moved =
      result.latitude !== NYC.latitude || result.longitude !== NYC.longitude;
    expect(moved).toBe(true);
  });

  it("all offsets stay within the specified radius (100 iterations)", () => {
    const radiusMiles = 0.5;
    const maxMeters = radiusMiles * MILES_TO_METERS;

    for (let i = 0; i < 100; i++) {
      const result = applyLocationNoise(NYC, radiusMiles);
      const distance = haversineMeters(NYC, result);
      expect(distance).toBeLessThanOrEqual(maxMeters * 1.01); // 1% tolerance for float math
    }
  });

  it("produces varying results across multiple calls", () => {
    const results = Array.from({ length: 10 }, () =>
      applyLocationNoise(NYC, 0.5)
    );
    const uniqueLats = new Set(results.map((r) => r.latitude));
    // With 10 random samples, we should get at least 2 distinct values
    expect(uniqueLats.size).toBeGreaterThan(1);
  });

  it("handles negative radiusMiles as zero (no noise)", () => {
    const result = applyLocationNoise(NYC, -1);
    expect(result.latitude).toBe(NYC.latitude);
    expect(result.longitude).toBe(NYC.longitude);
  });
});
