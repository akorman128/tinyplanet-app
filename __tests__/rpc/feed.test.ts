import { adminClient } from "../utils/supabase-test-client";
import {
  createTestUser,
  createFriendship,
  createTestPost,
  createTestLike,
  createTestComment,
  createTestSavedPost,
  cleanupTestData,
  TestUser,
} from "../utils/seed";

describe("Feed RPCs", () => {
  let userA: TestUser; // the "viewer"
  let userB: TestUser; // friend of A
  let stranger: TestUser; // NOT a friend of A

  let friendPostId: string;
  let strangerPostId: string;
  let ownPostId: string;

  beforeAll(async () => {
    // Create users
    userA = await createTestUser({ full_name: "Feed Viewer" });
    userB = await createTestUser({ full_name: "Feed Friend" });
    stranger = await createTestUser({ full_name: "Feed Stranger" });

    // Only A↔B are friends
    await createFriendship(userA.id, userB.id);

    // Create posts
    ownPostId = await createTestPost(userA.id, { text: "My own post" });
    friendPostId = await createTestPost(userB.id, {
      text: "Friend post",
      visibility: "friends",
    });
    strangerPostId = await createTestPost(stranger.id, {
      text: "Stranger post",
      visibility: "friends",
    });

    // Add engagement to the friend post
    await createTestLike(userA.id, friendPostId);
    await createTestComment(userA.id, friendPostId, "Nice!");
    await createTestComment(userB.id, friendPostId, "Thanks!");
    await createTestSavedPost(userA.id, friendPostId);
  });

  afterAll(async () => {
    await cleanupTestData([userA.id, userB.id, stranger.id]);
  });

  // ── get_feed_posts ────────────────────────────────────────────

  describe("get_feed_posts", () => {
    it("returns posts with correct shape", async () => {
      const { data, error } = await adminClient.rpc("get_feed_posts", {
        user_id_param: userA.id,
        limit_param: 50,
        offset_param: 0,
      });

      expect(error).toBeNull();
      expect(data!.length).toBeGreaterThanOrEqual(1);

      // Find the friend post
      const post = data!.find(
        (p: Record<string, unknown>) => p.id === friendPostId
      );
      expect(post).toBeDefined();

      // Check shape
      expect(post).toHaveProperty("id");
      expect(post).toHaveProperty("text");
      expect(post).toHaveProperty("media_urls");
      expect(post).toHaveProperty("created_at");
      expect(post).toHaveProperty("author_id");
      expect(post).toHaveProperty("visibility");
      expect(post).toHaveProperty("author");
      expect(post).toHaveProperty("like_count");
      expect(post).toHaveProperty("comment_count");
      expect(post).toHaveProperty("liked_by_user");
      expect(post).toHaveProperty("saved_by_user");

      // Check author JSONB
      expect(post!.author).toHaveProperty("id", userB.id);
      expect(post!.author).toHaveProperty("full_name", "Feed Friend");

      // Check engagement metrics
      expect(post!.like_count).toBe(1);
      expect(post!.comment_count).toBe(2);

      // Check user-specific flags
      expect(post!.liked_by_user).toBe(true);
      expect(post!.saved_by_user).toBe(true);
    });

    it("respects pagination (limit/offset)", async () => {
      const { data: page1 } = await adminClient.rpc("get_feed_posts", {
        user_id_param: userA.id,
        limit_param: 1,
        offset_param: 0,
      });
      expect(page1).toHaveLength(1);

      const { data: page2 } = await adminClient.rpc("get_feed_posts", {
        user_id_param: userA.id,
        limit_param: 1,
        offset_param: 1,
      });
      expect(page2).toHaveLength(1);

      // Different posts on each page
      expect(page1![0].id).not.toBe(page2![0].id);
    });

    it("excludes posts from non-friends", async () => {
      const { data } = await adminClient.rpc("get_feed_posts", {
        user_id_param: userA.id,
        limit_param: 100,
        offset_param: 0,
      });

      const strangerPost = data!.find(
        (p: Record<string, unknown>) => p.id === strangerPostId
      );
      expect(strangerPost).toBeUndefined();
    });

    it("marks unliked/unsaved posts correctly", async () => {
      const { data } = await adminClient.rpc("get_feed_posts", {
        user_id_param: userA.id,
        limit_param: 100,
        offset_param: 0,
      });

      // Own post has no likes or saves from userA
      const own = data!.find(
        (p: Record<string, unknown>) => p.id === ownPostId
      );
      expect(own).toBeDefined();
      expect(own!.liked_by_user).toBe(false);
      expect(own!.saved_by_user).toBe(false);
    });
  });

  // ── get_user_posts ────────────────────────────────────────────

  describe("get_user_posts", () => {
    it("returns only posts by target user", async () => {
      const { data, error } = await adminClient.rpc("get_user_posts", {
        user_id_param: userA.id,
        target_user_id: userB.id,
        limit_param: 50,
        offset_param: 0,
      });

      expect(error).toBeNull();
      expect(data!.length).toBeGreaterThanOrEqual(1);

      // All returned posts belong to userB
      for (const post of data!) {
        expect(post.author_id).toBe(userB.id);
      }

      // Specifically contains the friend post
      const fp = data!.find(
        (p: Record<string, unknown>) => p.id === friendPostId
      );
      expect(fp).toBeDefined();
    });

    it("returns engagement metrics", async () => {
      const { data } = await adminClient.rpc("get_user_posts", {
        user_id_param: userA.id,
        target_user_id: userB.id,
        limit_param: 50,
        offset_param: 0,
      });

      const post = data!.find(
        (p: Record<string, unknown>) => p.id === friendPostId
      );
      expect(post).toBeDefined();
      expect(post!.like_count).toBe(1);
      expect(post!.comment_count).toBe(2);
      expect(post!.liked_by_user).toBe(true);
      expect(post!.saved_by_user).toBe(true);
    });
  });
});
