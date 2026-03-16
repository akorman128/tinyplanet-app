import { adminClient } from "../utils/supabase-test-client";
import {
  createTestUser,
  createFriendship,
  createTestPost,
  cleanupTestData,
  TestUser,
} from "../utils/seed";

describe("get_profile RPC", () => {
  let userA: TestUser;
  let userB: TestUser;
  let userC: TestUser;
  let userNoLocation: TestUser;

  beforeAll(async () => {
    // User A: has location
    userA = await createTestUser({
      full_name: "Alice Profile",
      location_lat: 40.7128,
      location_lng: -74.006,
    });
    // User B: has location
    userB = await createTestUser({
      full_name: "Bob Profile",
      location_lat: 34.0522,
      location_lng: -118.2437,
    });
    // User C: has location
    userC = await createTestUser({
      full_name: "Charlie Profile",
      location_lat: 51.5074,
      location_lng: -0.1278,
    });
    // User with no location
    userNoLocation = await createTestUser({ full_name: "NoLoc User" });

    // A↔B friends, A↔C friends, B↔C friends
    await createFriendship(userA.id, userB.id);
    await createFriendship(userA.id, userC.id);
    await createFriendship(userB.id, userC.id);

    // Create posts for A
    await createTestPost(userA.id, { text: "Post 1" });
    await createTestPost(userA.id, { text: "Post 2" });
    await createTestPost(userA.id, { text: "Post 3" });
  });

  afterAll(async () => {
    await cleanupTestData([userA.id, userB.id, userC.id, userNoLocation.id]);
  });

  it("returns profile with correct fields", async () => {
    const { data, error } = await adminClient.rpc("get_profile", {
      p_user_id: userA.id,
    });
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    const profile = data[0];
    expect(profile.id).toBe(userA.id);
    expect(profile.full_name).toBe("Alice Profile");
    expect(profile.latitude).toBeCloseTo(40.7128, 2);
    expect(profile.longitude).toBeCloseTo(-74.006, 2);
  });

  it("counts friends correctly", async () => {
    const { data, error } = await adminClient.rpc("get_profile", {
      p_user_id: userA.id,
    });
    expect(error).toBeNull();
    // A is friends with B and C
    expect(data[0].friend_count).toBe(2);
  });

  it("counts posts correctly", async () => {
    const { data, error } = await adminClient.rpc("get_profile", {
      p_user_id: userA.id,
    });
    expect(error).toBeNull();
    expect(data[0].post_count).toBe(3);
  });

  it("computes mutual friends when p_current_user_id provided", async () => {
    // B viewing C: A is mutual friend (A↔B, A↔C)
    const { data, error } = await adminClient.rpc("get_profile", {
      p_user_id: userC.id,
      p_current_user_id: userB.id,
    });
    expect(error).toBeNull();
    // A is the mutual friend between B and C
    expect(data[0].mutual_friend_count).toBe(1);
  });

  it("returns 0 mutual friends when p_current_user_id omitted", async () => {
    const { data, error } = await adminClient.rpc("get_profile", {
      p_user_id: userC.id,
    });
    expect(error).toBeNull();
    expect(data[0].mutual_friend_count).toBe(0);
  });

  it("handles user with no location", async () => {
    const { data, error } = await adminClient.rpc("get_profile", {
      p_user_id: userNoLocation.id,
    });
    expect(error).toBeNull();
    expect(data[0].latitude).toBeNull();
    expect(data[0].longitude).toBeNull();
  });
});
