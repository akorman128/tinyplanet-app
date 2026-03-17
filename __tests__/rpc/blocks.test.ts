import { adminClient } from "../utils/supabase-test-client";
import {
  createTestUser,
  createFriendship,
  createTestPost,
  createTestList,
  cleanupTestData,
  TestUser,
} from "../utils/seed";

describe("blocks RPCs", () => {
  let alice: TestUser;
  let bob: TestUser;
  let charlie: TestUser;

  beforeAll(async () => {
    // Alice: has location
    alice = await createTestUser({
      full_name: "Alice Blocks",
      location_lat: 40.7128,
      location_lng: -74.006,
    });
    // Bob: has location + hometown
    bob = await createTestUser({
      full_name: "Bob Blocks",
      location_lat: 34.0522,
      location_lng: -118.2437,
      hometown: "Los Angeles",
    });
    // Charlie: has location (friend-of-friend of Alice through Bob)
    charlie = await createTestUser({
      full_name: "Charlie Blocks",
      location_lat: 51.5074,
      location_lng: -0.1278,
    });

    // Set hometown_location for Bob
    await adminClient
      .from("profiles")
      .update({ hometown_location: `POINT(-118.2437 34.0522)` })
      .eq("id", bob.id);

    // Alice↔Bob friends, Bob↔Charlie friends
    await createFriendship(alice.id, bob.id);
    await createFriendship(bob.id, charlie.id);
  });

  afterAll(async () => {
    // Clean up blocks first
    for (const user of [alice, bob, charlie]) {
      await adminClient
        .from("blocks")
        .delete()
        .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`);
    }
    await cleanupTestData([alice.id, bob.id, charlie.id]);
  });

  describe("block creates row and deletes friendship", () => {
    afterEach(async () => {
      // Clean up blocks after each test in this group
      await adminClient
        .from("blocks")
        .delete()
        .or(`blocker_id.eq.${alice.id},blocked_id.eq.${alice.id}`);
      // Re-create the friendship that the trigger deleted
      const { data: existing } = await adminClient
        .from("friendships")
        .select("id")
        .or(
          `and(user_a.eq.${alice.id < bob.id ? alice.id : bob.id},user_b.eq.${alice.id < bob.id ? bob.id : alice.id})`
        )
        .maybeSingle();
      if (!existing) {
        await createFriendship(alice.id, bob.id);
      }
    });

    it("creates a block row", async () => {
      const { error } = await adminClient
        .from("blocks")
        .insert({ blocker_id: alice.id, blocked_id: bob.id });
      expect(error).toBeNull();

      const { data } = await adminClient
        .from("blocks")
        .select("*")
        .eq("blocker_id", alice.id)
        .eq("blocked_id", bob.id)
        .single();
      expect(data).not.toBeNull();
      expect(data.blocker_id).toBe(alice.id);
      expect(data.blocked_id).toBe(bob.id);
    });

    it("trigger deletes existing friendship on block", async () => {
      // Verify friendship exists before block
      const [user_a, user_b] =
        alice.id < bob.id ? [alice.id, bob.id] : [bob.id, alice.id];
      const { data: before } = await adminClient
        .from("friendships")
        .select("id")
        .eq("user_a", user_a)
        .eq("user_b", user_b)
        .maybeSingle();
      expect(before).not.toBeNull();

      // Block
      await adminClient
        .from("blocks")
        .insert({ blocker_id: alice.id, blocked_id: bob.id });

      // Friendship should be deleted
      const { data: after } = await adminClient
        .from("friendships")
        .select("id")
        .eq("user_a", user_a)
        .eq("user_b", user_b)
        .maybeSingle();
      expect(after).toBeNull();
    });
  });

  describe("is_blocked helper", () => {
    beforeAll(async () => {
      await adminClient
        .from("blocks")
        .insert({ blocker_id: alice.id, blocked_id: bob.id });
    });

    afterAll(async () => {
      await adminClient
        .from("blocks")
        .delete()
        .eq("blocker_id", alice.id)
        .eq("blocked_id", bob.id);
      // Re-create friendship
      const [user_a, user_b] =
        alice.id < bob.id ? [alice.id, bob.id] : [bob.id, alice.id];
      const { data: existing } = await adminClient
        .from("friendships")
        .select("id")
        .eq("user_a", user_a)
        .eq("user_b", user_b)
        .maybeSingle();
      if (!existing) {
        await createFriendship(alice.id, bob.id);
      }
    });

    it("returns true for both directions", async () => {
      const { data: forward } = await adminClient.rpc("is_blocked", {
        user1: alice.id,
        user2: bob.id,
      });
      expect(forward).toBe(true);

      const { data: reverse } = await adminClient.rpc("is_blocked", {
        user1: bob.id,
        user2: alice.id,
      });
      expect(reverse).toBe(true);
    });

    it("returns false for unblocked users", async () => {
      const { data } = await adminClient.rpc("is_blocked", {
        user1: alice.id,
        user2: charlie.id,
      });
      expect(data).toBe(false);
    });
  });

  describe("get_friend_locations excludes blocked users", () => {
    beforeAll(async () => {
      // Re-create friendship first (may have been deleted by prior tests)
      const [user_a, user_b] =
        alice.id < bob.id ? [alice.id, bob.id] : [bob.id, alice.id];
      const { data: existing } = await adminClient
        .from("friendships")
        .select("id")
        .eq("user_a", user_a)
        .eq("user_b", user_b)
        .maybeSingle();
      if (!existing) {
        await createFriendship(alice.id, bob.id);
      }
    });

    it("shows friend before block", async () => {
      const { data } = await adminClient.rpc("get_friend_locations", {
        p_user_id: alice.id,
      });
      const ids = data.map((r: { id: string }) => r.id);
      expect(ids).toContain(bob.id);
    });

    it("hides friend after block", async () => {
      await adminClient
        .from("blocks")
        .insert({ blocker_id: alice.id, blocked_id: bob.id });

      const { data } = await adminClient.rpc("get_friend_locations", {
        p_user_id: alice.id,
      });
      const ids = (data ?? []).map((r: { id: string }) => r.id);
      expect(ids).not.toContain(bob.id);

      // Clean up
      await adminClient
        .from("blocks")
        .delete()
        .eq("blocker_id", alice.id)
        .eq("blocked_id", bob.id);
      // Re-create friendship
      await createFriendship(alice.id, bob.id);
    });
  });

  describe("get_feed_posts excludes blocked users", () => {
    let bobPostId: string;

    beforeAll(async () => {
      bobPostId = await createTestPost(bob.id, {
        text: "Bob's post",
        visibility: "friends",
      });
    });

    afterAll(async () => {
      await adminClient.from("posts").delete().eq("id", bobPostId);
    });

    it("shows post before block", async () => {
      const { data } = await adminClient.rpc("get_feed_posts", {
        user_id_param: alice.id,
        limit_param: 50,
        offset_param: 0,
      });
      const authorIds = data.map((r: { author_id: string }) => r.author_id);
      expect(authorIds).toContain(bob.id);
    });

    it("hides post after block", async () => {
      await adminClient
        .from("blocks")
        .insert({ blocker_id: alice.id, blocked_id: bob.id });

      const { data } = await adminClient.rpc("get_feed_posts", {
        user_id_param: alice.id,
        limit_param: 50,
        offset_param: 0,
      });
      const authorIds = (data ?? []).map(
        (r: { author_id: string }) => r.author_id
      );
      expect(authorIds).not.toContain(bob.id);

      // Clean up
      await adminClient
        .from("blocks")
        .delete()
        .eq("blocker_id", alice.id)
        .eq("blocked_id", bob.id);
      await createFriendship(alice.id, bob.id);
    });
  });

  describe("get_mutual_locations_with_connections excludes blocked users", () => {
    it("shows mutual before block", async () => {
      const { data } = await adminClient.rpc(
        "get_mutual_locations_with_connections",
        { p_user_id: alice.id }
      );
      const ids = data.map((r: { id: string }) => r.id);
      expect(ids).toContain(charlie.id);
    });

    it("hides mutual after block", async () => {
      await adminClient
        .from("blocks")
        .insert({ blocker_id: alice.id, blocked_id: charlie.id });

      const { data } = await adminClient.rpc(
        "get_mutual_locations_with_connections",
        { p_user_id: alice.id }
      );
      const ids = (data ?? []).map((r: { id: string }) => r.id);
      expect(ids).not.toContain(charlie.id);

      // Clean up
      await adminClient
        .from("blocks")
        .delete()
        .eq("blocker_id", alice.id)
        .eq("blocked_id", charlie.id);
    });
  });

  describe("get_friend_hometown_locations excludes blocked users", () => {
    it("hides hometown after block", async () => {
      await adminClient
        .from("blocks")
        .insert({ blocker_id: alice.id, blocked_id: bob.id });

      const { data } = await adminClient.rpc("get_friend_hometown_locations", {
        p_user_id: alice.id,
      });
      const ids = (data ?? []).map((r: { id: string }) => r.id);
      expect(ids).not.toContain(bob.id);

      // Clean up
      await adminClient
        .from("blocks")
        .delete()
        .eq("blocker_id", alice.id)
        .eq("blocked_id", bob.id);
      await createFriendship(alice.id, bob.id);
    });
  });

  describe("get_viewable_list_locations excludes blocked users", () => {
    let bobListId: string;

    beforeAll(async () => {
      bobListId = await createTestList(bob.id, {
        title: "Bob's List",
        location_name: "LA",
        location_lng: -118.2437,
        location_lat: 34.0522,
      });
    });

    afterAll(async () => {
      await adminClient.from("lists").delete().eq("id", bobListId);
    });

    it("hides list after block", async () => {
      await adminClient
        .from("blocks")
        .insert({ blocker_id: alice.id, blocked_id: bob.id });

      const { data } = await adminClient.rpc("get_viewable_list_locations", {
        p_user_id: alice.id,
      });
      const ids = (data ?? []).map((r: { id: string }) => r.id);
      expect(ids).not.toContain(bobListId);

      // Clean up
      await adminClient
        .from("blocks")
        .delete()
        .eq("blocker_id", alice.id)
        .eq("blocked_id", bob.id);
      await createFriendship(alice.id, bob.id);
    });
  });

  describe("double block: A blocks B, B blocks A — independent unblock", () => {
    beforeAll(async () => {
      await adminClient
        .from("blocks")
        .insert({ blocker_id: alice.id, blocked_id: bob.id });
      await adminClient
        .from("blocks")
        .insert({ blocker_id: bob.id, blocked_id: alice.id });
    });

    afterAll(async () => {
      await adminClient
        .from("blocks")
        .delete()
        .or(
          `and(blocker_id.eq.${alice.id},blocked_id.eq.${bob.id}),and(blocker_id.eq.${bob.id},blocked_id.eq.${alice.id})`
        );
      await createFriendship(alice.id, bob.id);
    });

    it("both blocks exist independently", async () => {
      const { data: aliceBlock } = await adminClient
        .from("blocks")
        .select("id")
        .eq("blocker_id", alice.id)
        .eq("blocked_id", bob.id)
        .single();
      expect(aliceBlock).not.toBeNull();

      const { data: bobBlock } = await adminClient
        .from("blocks")
        .select("id")
        .eq("blocker_id", bob.id)
        .eq("blocked_id", alice.id)
        .single();
      expect(bobBlock).not.toBeNull();
    });

    it("unblocking one direction preserves the other", async () => {
      // Alice unblocks Bob
      await adminClient
        .from("blocks")
        .delete()
        .eq("blocker_id", alice.id)
        .eq("blocked_id", bob.id);

      // Bob's block of Alice still exists
      const { data: bobBlock } = await adminClient
        .from("blocks")
        .select("id")
        .eq("blocker_id", bob.id)
        .eq("blocked_id", alice.id)
        .single();
      expect(bobBlock).not.toBeNull();

      // is_blocked still returns true (Bob still blocks Alice)
      const { data: stillBlocked } = await adminClient.rpc("is_blocked", {
        user1: alice.id,
        user2: bob.id,
      });
      expect(stillBlocked).toBe(true);
    });
  });
});
