import { adminClient, anonClient } from "../utils/supabase-test-client";
import { expectAuthzRejected } from "../utils/authz-helpers";
import {
  createTestUser,
  createFriendship,
  createTestPost,
  createTestMessage,
  createTestContact,
  cleanupTestData,
  TestUser,
} from "../utils/seed";

/**
 * Negative-authorization tests for the SECURITY DEFINER RPCs.
 *
 * Contract (from issue #1's fix): each RPC keeps its existing signature, but now
 * RAISEs EXCEPTION (ERRCODE 42501) when the *acting/viewer* parameter does not
 * match auth.uid(). So, authenticated as user A, calling such an RPC with user
 * B's id as the acting param MUST error (or return no rows). Passing your OWN id
 * still works.
 *
 * Exception: functions whose single param is the *target* user being viewed
 * (get_lists_with_places, get_contacts_ordered) intentionally allow friends and
 * mutuals to read the target's data; they reject only unconnected/blocked users.
 *
 * These checks require a real JWT (so auth.uid() is populated), so we sign in as
 * each user rather than using the service-role adminClient.
 */

// Skip the whole suite when there is no Supabase to talk to. The RPC tests in
// this directory exercise a live database; without one they cannot run.
const hasSupabaseEnv =
  !!process.env.SUPABASE_URL &&
  !!process.env.SUPABASE_ANON_KEY &&
  !!process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Sign in as a test user and return an authenticated Supabase client whose
 * requests carry the user's JWT (so auth.uid() inside RPCs resolves to them).
 */
async function signInAsUser(email: string) {
  const { data, error } = await anonClient.auth.signInWithPassword({
    email,
    password: "test-password-123",
  });
  if (error) throw error;

  const { createClient } = await import("@supabase/supabase-js");
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      },
    }
  );
}

describe.skipIf(!hasSupabaseEnv)("RPC negative authorization", () => {
  let userA: TestUser;
  let userB: TestUser;
  // Unconnected to A (not a friend, not a mutual): used to prove the target-param
  // RPCs still reject strangers. Seeded here, before signInAsUser clobbers the
  // shared GoTrue session — creating users mid-test would make adminClient act as
  // A and fail profiles RLS.
  let userStranger: TestUser;
  let clientA: Awaited<ReturnType<typeof signInAsUser>>;

  beforeAll(async () => {
    userA = await createTestUser({
      full_name: "Authz User A",
      location_lat: 40.7128,
      location_lng: -74.006,
    });
    userB = await createTestUser({
      full_name: "Authz User B",
      location_lat: 34.0522,
      location_lng: -118.2437,
    });
    userStranger = await createTestUser({ full_name: "Authz Stranger" });

    // A and B are friends so each genuinely has data the other could try to read.
    await createFriendship(userA.id, userB.id);

    // Seed something for each RPC surface, owned by the respective user.
    await createTestPost(userB.id, { text: "B post", visibility: "friends" });
    await createTestMessage(userB.id, userA.id, "hi from B");
    await createTestContact(userB.id, {
      name: "B's contact",
      location_lat: 51.5074,
      location_lng: -0.1278,
      location_name: "London",
    });
    // The stranger must own data too, otherwise "rejects viewing a stranger"
    // would pass on an empty result even if the guard were removed.
    await createTestContact(userStranger.id, {
      name: "Stranger's contact",
      location_lat: 48.8566,
      location_lng: 2.3522,
      location_name: "Paris",
    });

    // Act as user A.
    clientA = await signInAsUser(userA.email);
  });

  afterAll(async () => {
    const ids = [userA?.id, userB?.id, userStranger?.id].filter(
      Boolean
    ) as string[];
    if (ids.length) await cleanupTestData(ids);
  });

  // ── get_feed_posts (user_id_param) ────────────────────────────────
  describe("get_feed_posts", () => {
    it("rejects acting on another user's behalf", async () => {
      const result = await clientA.rpc("get_feed_posts", {
        user_id_param: userB.id,
        limit_param: 50,
        offset_param: 0,
      });
      expectAuthzRejected(result);
    });

    it("allows acting on your own behalf", async () => {
      const { error } = await clientA.rpc("get_feed_posts", {
        user_id_param: userA.id,
        limit_param: 50,
        offset_param: 0,
      });
      expect(error).toBeNull();
    });
  });

  // ── get_friend_locations (p_user_id) ──────────────────────────────
  describe("get_friend_locations", () => {
    it("rejects acting on another user's behalf", async () => {
      const result = await clientA.rpc("get_friend_locations", {
        p_user_id: userB.id,
      });
      expectAuthzRejected(result);
    });

    it("allows acting on your own behalf", async () => {
      const { error } = await clientA.rpc("get_friend_locations", {
        p_user_id: userA.id,
      });
      expect(error).toBeNull();
    });
  });

  // ── get_message_channels (p_user_id) ──────────────────────────────
  describe("get_message_channels", () => {
    it("rejects acting on another user's behalf", async () => {
      const result = await clientA.rpc("get_message_channels", {
        p_user_id: userB.id,
      });
      expectAuthzRejected(result);
    });

    it("allows acting on your own behalf", async () => {
      const { error } = await clientA.rpc("get_message_channels", {
        p_user_id: userA.id,
      });
      expect(error).toBeNull();
    });
  });

  // ── get_contacts_ordered (p_user_id is the TARGET user) ───────────
  // Unlike the functions above, p_user_id here is the user being viewed, not the
  // acting param: friends and mutuals may read it; strangers may not.
  describe("get_contacts_ordered", () => {
    it("allows viewing a friend's contacts", async () => {
      // userA and userB are friends (seeded above).
      const { error } = await clientA.rpc("get_contacts_ordered", {
        p_user_id: userB.id,
      });
      expect(error).toBeNull();
    });

    it("rejects viewing an unconnected user's contacts", async () => {
      const result = await clientA.rpc("get_contacts_ordered", {
        p_user_id: userStranger.id,
      });
      expectAuthzRejected(result);
    });

    it("allows viewing your own contacts", async () => {
      const { error } = await clientA.rpc("get_contacts_ordered", {
        p_user_id: userA.id,
      });
      expect(error).toBeNull();
    });
  });
});
