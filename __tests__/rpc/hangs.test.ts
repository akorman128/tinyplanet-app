import { adminClient } from "../utils/supabase-test-client";
import {
  createTestUser,
  createFriendship,
  cleanupTestData,
  TestUser,
} from "../utils/seed";

const hasSupabaseEnv =
  !!process.env.SUPABASE_URL &&
  !!process.env.SUPABASE_ANON_KEY &&
  !!process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Sign in as a test user and return an authenticated client (hang RPCs check
 * auth.uid()). Uses `persistSession: false` clients so the sign-in never writes
 * to the shared GoTrue storage key — otherwise it would clobber the session
 * that `adminClient` reads and silently downgrade it from service_role.
 */
async function signInAsUser(email: string) {
  const { createClient } = await import("@supabase/supabase-js");
  const authOpts = { auth: { persistSession: false, autoRefreshToken: false } };

  const tmp = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    authOpts
  );
  const { data, error } = await tmp.auth.signInWithPassword({
    email,
    password: "test-password-123",
  });
  if (error) throw error;

  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      ...authOpts,
      global: {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      },
    }
  );
}

const inHours = (h: number) =>
  new Date(Date.now() + h * 3600_000).toISOString();
const inDays = (d: number) => inHours(d * 24);

describe.skipIf(!hasSupabaseEnv)("Hang RPCs", () => {
  let host: TestUser; // creates hangs
  let friend: TestUser; // accepted friend of host
  let stranger: TestUser; // no relationship
  let clientHost: Awaited<ReturnType<typeof signInAsUser>>;
  let clientFriend: Awaited<ReturnType<typeof signInAsUser>>;
  let clientStranger: Awaited<ReturnType<typeof signInAsUser>>;

  beforeAll(async () => {
    host = await createTestUser({ full_name: "Hang Host" });
    friend = await createTestUser({ full_name: "Hang Friend" });
    stranger = await createTestUser({ full_name: "Hang Stranger" });
    await createFriendship(host.id, friend.id);
    clientHost = await signInAsUser(host.email);
    clientFriend = await signInAsUser(friend.email);
    clientStranger = await signInAsUser(stranger.email);
  });

  afterAll(async () => {
    await adminClient.from("hangs").delete().eq("user_id", host.id);
    await cleanupTestData([host.id, friend.id, stranger.id]);
  });

  const createHang = (startsAt = inDays(1)) =>
    clientHost.rpc("create_hang_with_post", {
      p_user_id: host.id,
      p_location_lng: -122.427,
      p_location_lat: 37.7596,
      p_location_name: "Dolores Park",
      p_title: "Sunset picnic",
      p_description: "Bring snacks",
      p_starts_at: startsAt,
      p_post_visibility: "mutuals",
    });

  describe("create_hang_with_post", () => {
    let hangId: string | null = null;

    afterEach(async () => {
      if (hangId) {
        await clientHost.rpc("delete_hang_with_post", { p_hang_id: hangId });
        hangId = null;
      }
    });

    it("creates the hang, a linked post, and a host auto-RSVP", async () => {
      const { data, error } = await createHang();
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      hangId = data![0].hang_id;

      expect(data![0].post_id).toBeDefined();
      expect(data![0].title).toBe("Sunset picnic");

      const { data: post } = await adminClient
        .from("posts")
        .select("author_id, visibility")
        .eq("id", data![0].post_id)
        .single();
      expect(post!.author_id).toBe(host.id);
      expect(post!.visibility).toBe("mutuals");

      const { data: attendees } = await adminClient
        .from("hang_attendees")
        .select("user_id")
        .eq("hang_id", hangId!);
      expect(attendees).toHaveLength(1);
      expect(attendees![0].user_id).toBe(host.id);
    });

    it("rejects a start time more than 7 days out", async () => {
      const { error } = await createHang(inDays(8));
      expect(error).not.toBeNull();
      expect(error!.message).toContain("7 days");
    });

    it("rejects a start time in the past", async () => {
      const { error } = await createHang(inHours(-2));
      expect(error).not.toBeNull();
      expect(error!.message).toMatch(/past/i);
    });

    it("rejects creating a hang for another user", async () => {
      const { error } = await clientHost.rpc("create_hang_with_post", {
        p_user_id: friend.id, // not the caller
        p_location_lng: 0,
        p_location_lat: 0,
        p_location_name: "X",
        p_title: "Nope",
        p_description: null,
        p_starts_at: inDays(1),
        p_post_visibility: "mutuals",
      });
      expect(error).not.toBeNull();
      expect(error!.message).toMatch(/unauthorized/i);
    });
  });

  describe("detail, RSVP, feed, and map visibility", () => {
    let hangId: string;

    beforeAll(async () => {
      const { data } = await createHang(inDays(1));
      hangId = data![0].hang_id;
      // Friend RSVPs (direct table op, RLS-checked)
      await clientFriend
        .from("hang_attendees")
        .insert({ hang_id: hangId, user_id: friend.id, status: "going" });
    });

    afterAll(async () => {
      await clientHost.rpc("delete_hang_with_post", { p_hang_id: hangId });
    });

    it("get_hang_detail: host sees host+going flags and count", async () => {
      const { data } = await clientHost.rpc("get_hang_detail", {
        p_hang_id: hangId,
      });
      expect(data).toHaveLength(1);
      expect(data![0].viewer_is_host).toBe(true);
      expect(data![0].viewer_is_going).toBe(true);
      expect(Number(data![0].attendee_count)).toBe(2);
      expect(data![0].host.full_name).toBe("Hang Host");
      expect(data![0].attendees).toHaveLength(2);
    });

    it("get_hang_detail: friend sees it (not host, going)", async () => {
      const { data } = await clientFriend.rpc("get_hang_detail", {
        p_hang_id: hangId,
      });
      expect(data).toHaveLength(1);
      expect(data![0].viewer_is_host).toBe(false);
      expect(data![0].viewer_is_going).toBe(true);
    });

    it("get_hang_detail: stranger cannot see it", async () => {
      const { data } = await clientStranger.rpc("get_hang_detail", {
        p_hang_id: hangId,
      });
      expect(data ?? []).toHaveLength(0);
    });

    it("get_active_hang_locations: friend sees it as a 'friend' pin", async () => {
      const { data } = await clientFriend.rpc("get_active_hang_locations", {
        p_user_id: friend.id,
      });
      const hang = data!.find((h: Record<string, unknown>) => h.id === hangId);
      expect(hang).toBeDefined();
      expect(hang!.type).toBe("friend");
      expect(Number(hang!.attendee_count)).toBe(2);
      expect(hang!.longitude).toBeCloseTo(-122.427, 2);
    });

    it("get_feed_posts: friend's feed embeds the hang with attendees", async () => {
      const { data } = await clientFriend.rpc("get_feed_posts", {
        user_id_param: friend.id,
        limit_param: 20,
        offset_param: 0,
      });
      const row = data!.find(
        (p: Record<string, unknown>) =>
          (p.hang as { id?: string })?.id === hangId
      );
      expect(row).toBeDefined();
      expect(row!.hang.title).toBe("Sunset picnic");
      expect(Number(row!.hang.attendee_count)).toBe(2);
      expect(row!.hang.attendees.length).toBe(2);
    });

    it("get_friends_and_mutuals_of: host's set includes the friend", async () => {
      const { data } = await adminClient.rpc("get_friends_and_mutuals_of", {
        p_user_id: host.id,
      });
      const ids = (data ?? []).map((r: { user_id: string }) => r.user_id);
      expect(ids).toContain(friend.id);
    });
  });

  describe("expiration", () => {
    let hangId: string;

    beforeAll(async () => {
      const { data } = await createHang(inDays(1));
      hangId = data![0].hang_id;
      // Push the start time into the past (beyond the 3h active window)
      await adminClient
        .from("hangs")
        .update({ starts_at: inHours(-4) })
        .eq("id", hangId);
    });

    afterAll(async () => {
      await clientHost.rpc("delete_hang_with_post", { p_hang_id: hangId });
    });

    it("drops the expired hang from the friend's map", async () => {
      const { data } = await clientFriend.rpc("get_active_hang_locations", {
        p_user_id: friend.id,
      });
      expect(
        (data ?? []).find((h: { id: string }) => h.id === hangId)
      ).toBeUndefined();
    });

    it("drops the expired hang from the friend's feed", async () => {
      const { data } = await clientFriend.rpc("get_feed_posts", {
        user_id_param: friend.id,
        limit_param: 50,
        offset_param: 0,
      });
      const row = (data ?? []).find(
        (p: Record<string, unknown>) =>
          (p.hang as { id?: string })?.id === hangId
      );
      expect(row).toBeUndefined();
    });

    it("revokes invitee detail access but keeps host access", async () => {
      const friendView = await clientFriend.rpc("get_hang_detail", {
        p_hang_id: hangId,
      });
      expect(friendView.data ?? []).toHaveLength(0);

      const hostView = await clientHost.rpc("get_hang_detail", {
        p_hang_id: hangId,
      });
      expect(hostView.data).toHaveLength(1);
    });
  });

  describe("update_hang_with_post and delete_hang_with_post", () => {
    it("updates the hang and syncs the post", async () => {
      const { data: created } = await createHang(inDays(2));
      const hangId = created![0].hang_id;
      const postId = created![0].post_id;

      const { data, error } = await clientHost.rpc("update_hang_with_post", {
        p_hang_id: hangId,
        p_location_lng: -122.4,
        p_location_lat: 37.77,
        p_location_name: "Mission Dolores",
        p_title: "Morning coffee",
        p_description: "New plan",
        p_starts_at: inDays(2),
        p_post_visibility: null,
      });
      expect(error).toBeNull();
      expect(data![0].title).toBe("Morning coffee");

      const { data: post } = await adminClient
        .from("posts")
        .select("text")
        .eq("id", postId)
        .single();
      expect(post!.text).toContain("Morning coffee");

      await clientHost.rpc("delete_hang_with_post", { p_hang_id: hangId });
    });

    it("deletes the hang, its post, and cascades attendees", async () => {
      const { data: created } = await createHang(inDays(2));
      const hangId = created![0].hang_id;
      const postId = created![0].post_id;

      const { error } = await clientHost.rpc("delete_hang_with_post", {
        p_hang_id: hangId,
      });
      expect(error).toBeNull();

      const { data: hang } = await adminClient
        .from("hangs")
        .select("id")
        .eq("id", hangId)
        .maybeSingle();
      expect(hang).toBeNull();

      const { data: post } = await adminClient
        .from("posts")
        .select("id")
        .eq("id", postId)
        .maybeSingle();
      expect(post).toBeNull();

      const { data: attendees } = await adminClient
        .from("hang_attendees")
        .select("id")
        .eq("hang_id", hangId);
      expect(attendees ?? []).toHaveLength(0);
    });

    it("prevents a non-host from deleting the hang", async () => {
      const { data: created } = await createHang(inDays(2));
      const hangId = created![0].hang_id;

      const { error } = await clientFriend.rpc("delete_hang_with_post", {
        p_hang_id: hangId,
      });
      expect(error).not.toBeNull();

      await clientHost.rpc("delete_hang_with_post", { p_hang_id: hangId });
    });
  });
});
