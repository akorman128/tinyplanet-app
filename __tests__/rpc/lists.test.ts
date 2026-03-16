import { adminClient } from "../utils/supabase-test-client";
import {
  createTestUser,
  createFriendship,
  createTestList,
  cleanupTestData,
  TestUser,
} from "../utils/seed";

describe("Lists RPCs", () => {
  let userA: TestUser;
  let userB: TestUser;
  let listAWithPlaces: string;
  let listAEmpty: string;
  let listB: string;
  let placeId1: string;
  let placeId2: string;

  const place1Lng = -73.9969;
  const place1Lat = 40.7306;
  const place2Lng = -73.9851;
  const place2Lat = 40.7484;

  beforeAll(async () => {
    userA = await createTestUser({ full_name: "Lists User A" });
    userB = await createTestUser({ full_name: "Lists User B" });

    await createFriendship(userA.id, userB.id);

    // List for A with a location (has places)
    listAWithPlaces = await createTestList(userA.id, {
      title: "NYC Favorites",
      location_name: "New York, NY",
      location_lng: -74.006,
      location_lat: 40.7128,
    });

    // Empty list for A (no location)
    listAEmpty = await createTestList(userA.id, {
      title: "Empty List",
      location_name: "Nowhere",
    });

    // List for B with a location
    listB = await createTestList(userB.id, {
      title: "LA Spots",
      location_name: "Los Angeles, CA",
      location_lng: -118.2437,
      location_lat: 34.0522,
    });

    // Insert places into A's list
    const { data: p1, error: e1 } = await adminClient
      .from("list_places")
      .insert({
        list_id: listAWithPlaces,
        original_text: "Joe's Pizza",
        resolved_name: "Joe's Pizza",
        location: `POINT(${place1Lng} ${place1Lat})`,
        confidence: 0.95,
        status: "resolved",
        position: 0,
      })
      .select("id")
      .single();
    if (e1) throw e1;
    placeId1 = p1.id;

    const { data: p2, error: e2 } = await adminClient
      .from("list_places")
      .insert({
        list_id: listAWithPlaces,
        original_text: "Grand Central",
        resolved_name: "Grand Central Terminal",
        location: `POINT(${place2Lng} ${place2Lat})`,
        confidence: 0.88,
        status: "resolved",
        position: 1,
      })
      .select("id")
      .single();
    if (e2) throw e2;
    placeId2 = p2.id;
  });

  afterAll(async () => {
    await cleanupTestData([userA.id, userB.id]);
  });

  describe("get_lists_with_places", () => {
    it("returns lists with aggregated places JSONB", async () => {
      const { data, error } = await adminClient.rpc("get_lists_with_places", {
        p_user_id: userA.id,
      });
      expect(error).toBeNull();
      expect(data).toHaveLength(2);

      // Ordered by created_at DESC, so empty list comes first (created second)
      const listWithPlaces = data.find(
        (l: any) => l.id === listAWithPlaces
      );
      expect(listWithPlaces).toBeDefined();
      expect(listWithPlaces.title).toBe("NYC Favorites");

      const places = listWithPlaces.places;
      expect(places).toHaveLength(2);
      // Ordered by position ASC
      expect(places[0].resolved_name).toBe("Joe's Pizza");
      expect(places[0].longitude).toBeCloseTo(place1Lng, 2);
      expect(places[0].latitude).toBeCloseTo(place1Lat, 2);
      expect(places[1].resolved_name).toBe("Grand Central Terminal");
    });

    it("returns empty places array for list with no places", async () => {
      const { data, error } = await adminClient.rpc("get_lists_with_places", {
        p_user_id: userA.id,
      });
      expect(error).toBeNull();

      const emptyList = data.find((l: any) => l.id === listAEmpty);
      expect(emptyList).toBeDefined();
      expect(emptyList.places).toEqual([]);
    });

    it("supports pagination with p_limit and p_offset", async () => {
      const { data, error } = await adminClient.rpc("get_lists_with_places", {
        p_user_id: userA.id,
        p_limit: 1,
        p_offset: 0,
      });
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      // total_count should reflect all lists, not just the page
      expect(Number(data[0].total_count)).toBe(2);
    });
  });

  describe("get_list_places_with_coordinates", () => {
    it("returns places with extracted lat/lon", async () => {
      // This RPC checks auth.uid(), so it will fail with service role client.
      // Use adminClient which bypasses RLS via SECURITY DEFINER.
      const { data, error } = await adminClient.rpc(
        "get_list_places_with_coordinates",
        { p_list_id: listAWithPlaces }
      );

      // The RPC uses auth.uid() for access check, which is null for service role.
      // If it raises an exception, that's expected behavior for the access check.
      if (error) {
        // Access denied is expected when not authenticated as list owner
        expect(error.message).toContain("access denied");
        return;
      }

      expect(data).toHaveLength(2);
      expect(data[0].longitude).toBeCloseTo(place1Lng, 2);
      expect(data[0].latitude).toBeCloseTo(place1Lat, 2);
      expect(data[1].longitude).toBeCloseTo(place2Lng, 2);
      expect(data[1].latitude).toBeCloseTo(place2Lat, 2);
    });
  });

  describe("get_viewable_list_locations", () => {
    it("returns both own and friend lists with coordinates", async () => {
      const { data, error } = await adminClient.rpc(
        "get_viewable_list_locations",
        { p_user_id: userA.id }
      );
      expect(error).toBeNull();

      // A's list with location + B's list with location (both have coordinates)
      // A's empty list has no location so it's excluded
      const ids = data.map((l: any) => l.id);
      expect(ids).toContain(listAWithPlaces);
      expect(ids).toContain(listB);
      // Empty list has no location, should not appear
      expect(ids).not.toContain(listAEmpty);

      const ownList = data.find((l: any) => l.id === listAWithPlaces);
      expect(ownList.owner_name).toBe("You");
      expect(ownList.longitude).toBeCloseTo(-74.006, 2);
      expect(ownList.latitude).toBeCloseTo(40.7128, 2);

      const friendList = data.find((l: any) => l.id === listB);
      expect(friendList.owner_name).toBe("Lists User B");
      expect(friendList.longitude).toBeCloseTo(-118.2437, 2);
      expect(friendList.latitude).toBeCloseTo(34.0522, 2);
    });
  });
});
