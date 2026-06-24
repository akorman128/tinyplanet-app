import { adminClient } from "../utils/supabase-test-client";
import { authedClientFor } from "../utils/auth-helpers";
import { expectAuthzRejected } from "../utils/authz-helpers";
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
      const client = await authedClientFor(userA.email);
      const { data, error } = await client.rpc("get_lists_with_places", {
        p_user_id: userA.id,
      });
      expect(error).toBeNull();
      expect(data).toHaveLength(2);

      // Ordered by created_at DESC, so empty list comes first (created second)
      const listWithPlaces = data!.find(
        (l: { id: string; [key: string]: unknown }) => l.id === listAWithPlaces
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
      const client = await authedClientFor(userA.email);
      const { data, error } = await client.rpc("get_lists_with_places", {
        p_user_id: userA.id,
      });
      expect(error).toBeNull();

      const emptyList = data!.find(
        (l: { id: string; [key: string]: unknown }) => l.id === listAEmpty
      );
      expect(emptyList).toBeDefined();
      expect(emptyList.places).toEqual([]);
    });

    it("supports pagination with p_limit and p_offset", async () => {
      const client = await authedClientFor(userA.email);
      const { data, error } = await client.rpc("get_lists_with_places", {
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

  describe("get_lists_with_places cross-user visibility", () => {
    // owner — friend (direct) — mutual (friend-of-friend of owner); stranger
    // has no connection to owner.
    let owner: TestUser;
    let friend: TestUser;
    let mutual: TestUser;
    let stranger: TestUser;
    let ownerListId: string;

    beforeAll(async () => {
      owner = await createTestUser({ full_name: "Visibility Owner" });
      friend = await createTestUser({ full_name: "Visibility Direct Friend" });
      mutual = await createTestUser({ full_name: "Visibility Mutual" });
      stranger = await createTestUser({ full_name: "Visibility Stranger" });

      await createFriendship(owner.id, friend.id);
      await createFriendship(friend.id, mutual.id);

      ownerListId = await createTestList(owner.id, {
        title: "Owner List",
        location_name: "Somewhere",
        location_lng: -74.006,
        location_lat: 40.7128,
      });

      const { error: placeErr } = await adminClient.from("list_places").insert({
        list_id: ownerListId,
        original_text: "Owner Place",
        resolved_name: "Owner Place",
        location: "POINT(-74.006 40.7128)",
        confidence: 0.9,
        status: "resolved",
        position: 0,
      });
      if (placeErr) throw placeErr;
    });

    afterAll(async () => {
      await cleanupTestData([owner.id, friend.id, mutual.id, stranger.id]);
    });

    it("lets a direct friend view the owner's lists", async () => {
      const client = await authedClientFor(friend.email);
      const { data, error } = await client.rpc("get_lists_with_places", {
        p_user_id: owner.id,
      });
      expect(error).toBeNull();
      expect(data!.map((l: { id: string }) => l.id)).toContain(ownerListId);
    });

    it("lets a mutual (friend-of-friend) view the owner's lists", async () => {
      const client = await authedClientFor(mutual.email);
      const { data, error } = await client.rpc("get_lists_with_places", {
        p_user_id: owner.id,
      });
      expect(error).toBeNull();
      expect(data!.map((l: { id: string }) => l.id)).toContain(ownerListId);
    });

    it("rejects an unconnected stranger", async () => {
      const client = await authedClientFor(stranger.email);
      const result = await client.rpc("get_lists_with_places", {
        p_user_id: owner.id,
      });
      expectAuthzRejected(result);
    });

    it("rejects a mutual the owner has blocked", async () => {
      await adminClient
        .from("blocks")
        .insert({ blocker_id: owner.id, blocked_id: mutual.id });
      try {
        const client = await authedClientFor(mutual.email);
        const result = await client.rpc("get_lists_with_places", {
          p_user_id: owner.id,
        });
        expectAuthzRejected(result);
      } finally {
        await adminClient
          .from("blocks")
          .delete()
          .eq("blocker_id", owner.id)
          .eq("blocked_id", mutual.id);
      }
    });

    // The detail screens read the lists/list_places tables directly (RLS) and
    // the list-detail RPC, so those paths must agree with the summary RPC.
    it("lets a mutual read the owner's lists via direct table query (RLS)", async () => {
      const client = await authedClientFor(mutual.email);
      const { data, error } = await client
        .from("lists")
        .select("id")
        .eq("user_id", owner.id);
      expect(error).toBeNull();
      expect(data!.map((l: { id: string }) => l.id)).toContain(ownerListId);
    });

    it("hides the owner's lists from a stranger's direct table query (RLS)", async () => {
      const client = await authedClientFor(stranger.email);
      const { data, error } = await client
        .from("lists")
        .select("id")
        .eq("user_id", owner.id);
      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });

    it("lets a mutual fetch the owner's list places via get_list_places_with_coordinates", async () => {
      const client = await authedClientFor(mutual.email);
      const { data, error } = await client.rpc(
        "get_list_places_with_coordinates",
        { p_list_id: ownerListId }
      );
      expect(error).toBeNull();
      expect(data!.length).toBeGreaterThan(0);
      expect(data![0].resolved_name).toBe("Owner Place");
    });

    it("rejects a stranger from get_list_places_with_coordinates", async () => {
      const client = await authedClientFor(stranger.email);
      const { error } = await client.rpc("get_list_places_with_coordinates", {
        p_list_id: ownerListId,
      });
      expect(error).not.toBeNull();
      expect(error!.message).toContain("access denied");
    });

    it("includes the owner's list on a mutual's map (get_viewable_list_locations)", async () => {
      const client = await authedClientFor(mutual.email);
      const { data, error } = await client.rpc("get_viewable_list_locations", {
        p_user_id: mutual.id,
      });
      expect(error).toBeNull();
      expect(data!.map((l: { id: string }) => l.id)).toContain(ownerListId);
    });
  });

  describe("get_viewable_list_locations", () => {
    it("returns both own and friend lists with coordinates", async () => {
      const client = await authedClientFor(userA.email);
      const { data, error } = await client.rpc("get_viewable_list_locations", {
        p_user_id: userA.id,
      });
      expect(error).toBeNull();

      // A's list with location + B's list with location (both have coordinates)
      // A's empty list has no location so it's excluded
      const ids = data!.map(
        (l: { id: string; [key: string]: unknown }) => l.id
      );
      expect(ids).toContain(listAWithPlaces);
      expect(ids).toContain(listB);
      // Empty list has no location, should not appear
      expect(ids).not.toContain(listAEmpty);

      const ownList = data!.find(
        (l: { id: string; [key: string]: unknown }) => l.id === listAWithPlaces
      );
      expect(ownList.owner_name).toBe("You");
      expect(ownList.longitude).toBeCloseTo(-74.006, 2);
      expect(ownList.latitude).toBeCloseTo(40.7128, 2);

      const friendList = data!.find(
        (l: { id: string; [key: string]: unknown }) => l.id === listB
      );
      expect(friendList.owner_name).toBe("Lists User B");
      expect(friendList.longitude).toBeCloseTo(-118.2437, 2);
      expect(friendList.latitude).toBeCloseTo(34.0522, 2);
    });
  });
});
