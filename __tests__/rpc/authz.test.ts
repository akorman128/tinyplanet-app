import { adminClient, anonClient } from "../utils/supabase-test-client";
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
 * RAISEs EXCEPTION (ERRCODE 42501) when the acting-user parameter does not match
 * auth.uid(). So, authenticated as user A, calling an RPC with user B's id as the
 * acting param MUST error (or return no rows). Passing your OWN id still works.
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
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    global: {
      headers: { Authorization: `Bearer ${data.session.access_token}` },
    },
  });
}

/**
 * Assert that an RPC call performed on behalf of someone else is rejected.
 * The contract allows either of two equivalent outcomes: a raised authorization
 * exception (ERRCODE 42501), or no rows leaked.
 */
function expectAuthzRejected(result: { data: unknown; error: unknown }) {
  const { data, error } = result as {
    data: unknown;
    error: { code?: string; message?: string } | null;
  };

  if (error) {
    // RAISE EXCEPTION ... ERRCODE = 42501 (insufficient_privilege)
    const matchesContract =
      error.code === "42501" ||
      /42501|not authorized|unauthor|insufficient|access denied|permission/i.test(
        error.message ?? ""
      );
    expect(matchesContract).toBe(true);
  } else {
    // If it didn't raise, it must at least not have leaked another user's rows.
    expect(Array.isArray(data) ? data.length : data ?? 0).toBeFalsy();
  }
}

describe.skipIf(!hasSupabaseEnv)("RPC negative authorization", () => {
  let userA: TestUser;
  let userB: TestUser;
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

    // Act as user A.
    clientA = await signInAsUser(userA.email);
  });

  afterAll(async () => {
    const ids = [userA?.id, userB?.id].filter(Boolean) as string[];
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

  // ── get_contacts_ordered (p_user_id) ──────────────────────────────
  describe("get_contacts_ordered", () => {
    it("rejects acting on another user's behalf", async () => {
      const result = await clientA.rpc("get_contacts_ordered", {
        p_user_id: userB.id,
      });
      expectAuthzRejected(result);
    });

    it("allows acting on your own behalf", async () => {
      const { error } = await clientA.rpc("get_contacts_ordered", {
        p_user_id: userA.id,
      });
      expect(error).toBeNull();
    });
  });
});
