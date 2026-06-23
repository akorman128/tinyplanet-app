import { adminClient } from "../utils/supabase-test-client";
import { authedClientFor } from "../utils/auth-helpers";
import {
  createTestUser,
  createFriendship,
  cleanupTestData,
  TestUser,
} from "../utils/seed";

describe("friends RPCs", () => {
  let userA: TestUser;
  let userB: TestUser;
  let userC: TestUser;
  let userD: TestUser;

  beforeAll(async () => {
    // A: has location
    userA = await createTestUser({
      full_name: "Alice Friends",
      location_lat: 40.7128,
      location_lng: -74.006,
    });
    // B: has location + hometown
    userB = await createTestUser({
      full_name: "Bob Friends",
      location_lat: 34.0522,
      location_lng: -118.2437,
      hometown: "Los Angeles",
    });
    // C: has location (friend-of-friend of A through B)
    userC = await createTestUser({
      full_name: "Charlie Friends",
      location_lat: 51.5074,
      location_lng: -0.1278,
    });
    // D: unconnected, no location
    userD = await createTestUser({ full_name: "Dave Friends" });

    // A↔B friends
    await createFriendship(userA.id, userB.id);
    // B↔C friends (C is mutual of A through B)
    await createFriendship(userB.id, userC.id);

    // Set hometown_location for B
    await adminClient
      .from("profiles")
      .update({
        hometown_location: `POINT(-118.2437 34.0522)`,
      })
      .eq("id", userB.id);
  });

  afterAll(async () => {
    await cleanupTestData([userA.id, userB.id, userC.id, userD.id]);
  });

  describe("get_friend_locations", () => {
    it("returns direct friend locations", async () => {
      const client = await authedClientFor(userA.email);
      const { data, error } = await client.rpc("get_friend_locations", {
        p_user_id: userA.id,
      });
      expect(error).toBeNull();
      expect(data).toHaveLength(1); // only B has location and is friend of A
      const friend = data[0];
      expect(friend.id).toBe(userB.id);
      expect(friend.full_name).toBe("Bob Friends");
      expect(friend.type).toBe("friend");
      expect(friend.latitude).toBeCloseTo(34.0522, 2);
      expect(friend.longitude).toBeCloseTo(-118.2437, 2);
    });

    it("does not return non-friends", async () => {
      const client = await authedClientFor(userA.email);
      const { data, error } = await client.rpc("get_friend_locations", {
        p_user_id: userA.id,
      });
      expect(error).toBeNull();
      const ids = data!.map((r: { id: string }) => r.id);
      // Must actually return A's friend (B) — otherwise an empty response would
      // pass the exclusion checks vacuously.
      expect(ids).toContain(userB.id);
      expect(ids).not.toContain(userC.id);
      expect(ids).not.toContain(userD.id);
    });
  });

  describe("get_mutual_locations_with_connections", () => {
    it("returns friend-of-friend locations with connecting_friend_id", async () => {
      const client = await authedClientFor(userA.email);
      const { data, error } = await client.rpc(
        "get_mutual_locations_with_connections",
        { p_user_id: userA.id }
      );
      expect(error).toBeNull();
      // C is friend-of-friend of A through B
      expect(data).toHaveLength(1);
      const mutual = data[0];
      expect(mutual.id).toBe(userC.id);
      expect(mutual.type).toBe("mutual");
      expect(mutual.connecting_friend_id).toBe(userB.id);
      expect(mutual.latitude).toBeCloseTo(51.5074, 2);
      expect(mutual.longitude).toBeCloseTo(-0.1278, 2);
    });
  });

  describe("search_friends", () => {
    it("finds friends by case-insensitive name search", async () => {
      const client = await authedClientFor(userA.email);
      const { data, error } = await client.rpc("search_friends", {
        p_user_id: userA.id,
        p_query: "bob",
      });
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe(userB.id);
      expect(data[0].full_name).toBe("Bob Friends");
    });

    it("does not return non-friends", async () => {
      const client = await authedClientFor(userA.email);
      const { data, error } = await client.rpc("search_friends", {
        p_user_id: userA.id,
        p_query: "charlie",
      });
      expect(error).toBeNull();
      expect(data).toHaveLength(0); // C is not a direct friend of A
    });

    it("returns empty for empty query", async () => {
      const client = await authedClientFor(userA.email);
      const { data, error } = await client.rpc("search_friends", {
        p_user_id: userA.id,
        p_query: "  ",
      });
      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });
  });

  describe("get_mutual_friends_between_users", () => {
    it("returns shared friends between two users", async () => {
      // A↔B and B↔C, so B is mutual friend between A and C
      const client = await authedClientFor(userA.email);
      const { data, error } = await client.rpc(
        "get_mutual_friends_between_users",
        { p_user_id: userA.id, p_target_user_id: userC.id }
      );
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe(userB.id);
      expect(data[0].full_name).toBe("Bob Friends");
    });

    it("returns empty when no shared friends", async () => {
      const client = await authedClientFor(userA.email);
      const { data, error } = await client.rpc(
        "get_mutual_friends_between_users",
        { p_user_id: userA.id, p_target_user_id: userD.id }
      );
      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });
  });

  describe("count_mutual_friends", () => {
    it("counts shared friends between two users", async () => {
      const client = await authedClientFor(userA.email);
      const { data, error } = await client.rpc("count_mutual_friends", {
        p_user_id: userA.id,
        p_target_user_id: userC.id,
      });
      expect(error).toBeNull();
      expect(data).toBe(1); // B is the mutual friend
    });

    it("returns 0 when no shared friends", async () => {
      const client = await authedClientFor(userA.email);
      const { data, error } = await client.rpc("count_mutual_friends", {
        p_user_id: userA.id,
        p_target_user_id: userD.id,
      });
      expect(error).toBeNull();
      expect(data).toBe(0);
    });
  });

  describe("get_platform_statistics", () => {
    it("returns total users and connection count", async () => {
      const client = await authedClientFor(userA.email);
      const { data, error } = await client.rpc("get_platform_statistics", {
        p_user_id: userA.id,
      });
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      const stats = data[0];
      // total_users includes at least our 4 test users
      expect(stats.total_users).toBeGreaterThanOrEqual(4);
      // A has 1 direct friend (B) + 1 mutual (C) = 2 connections
      expect(stats.connections_count).toBe(2);
    });
  });

  describe("get_friend_hometown_locations", () => {
    it("returns friends with hometown_location set", async () => {
      const client = await authedClientFor(userA.email);
      const { data, error } = await client.rpc(
        "get_friend_hometown_locations",
        { p_user_id: userA.id }
      );
      expect(error).toBeNull();
      // B is A's friend with hometown_location set
      const friendHometowns = data!.filter(
        (r: { type: string }) => r.type === "friend_hometown"
      );
      expect(friendHometowns).toHaveLength(1);
      expect(friendHometowns[0].id).toBe(userB.id);
      expect(friendHometowns[0].hometown_name).toBe("Los Angeles");
      expect(friendHometowns[0].latitude).toBeCloseTo(34.0522, 2);
      expect(friendHometowns[0].longitude).toBeCloseTo(-118.2437, 2);
    });
  });
});
