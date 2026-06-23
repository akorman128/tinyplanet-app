import { adminClient } from "../utils/supabase-test-client";
import {
  createTestUser,
  createFriendship,
  cleanupTestData,
  TestUser,
} from "../utils/seed";

async function createPost(
  authorId: string,
  visibility: "friends" | "mutuals" | "public"
) {
  const { data, error } = await adminClient
    .from("posts")
    .insert({ author_id: authorId, text: `post ${visibility}`, visibility })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

describe("get_post_notification_recipients", () => {
  let author: TestUser; // posts
  let friend: TestUser; // A's direct friend
  let mutual: TestUser; // friend-of-friend via `friend`
  let stranger: TestUser; // unconnected
  let blockedFriend: TestUser; // direct friend but blocked

  beforeAll(async () => {
    author = await createTestUser({ full_name: "Author Post" });
    friend = await createTestUser({ full_name: "Friend Post" });
    mutual = await createTestUser({ full_name: "Mutual Post" });
    stranger = await createTestUser({ full_name: "Stranger Post" });
    blockedFriend = await createTestUser({ full_name: "Blocked Post" });

    await createFriendship(author.id, friend.id); // author ↔ friend
    await createFriendship(friend.id, mutual.id); // friend ↔ mutual ⇒ mutual is author's mutual
    await createFriendship(author.id, blockedFriend.id); // author ↔ blockedFriend
    await adminClient
      .from("blocks")
      .insert({ blocker_id: author.id, blocked_id: blockedFriend.id });
  });

  afterAll(async () => {
    await cleanupTestData([
      author.id,
      friend.id,
      mutual.id,
      stranger.id,
      blockedFriend.id,
    ]);
  });

  it("friends-visibility post notifies direct friends only (not mutuals/strangers)", async () => {
    const postId = await createPost(author.id, "friends");
    const { data, error } = await adminClient.rpc(
      "get_post_notification_recipients",
      {
        p_post_id: postId,
      }
    );
    expect(error).toBeNull();
    const ids = data!.map((r: { user_id: string }) => r.user_id);
    expect(ids).toContain(friend.id);
    expect(ids).not.toContain(mutual.id);
    expect(ids).not.toContain(stranger.id);
    expect(ids).not.toContain(author.id);
  });

  it("mutuals-visibility post notifies friends + mutuals (not strangers)", async () => {
    const postId = await createPost(author.id, "mutuals");
    const { data, error } = await adminClient.rpc(
      "get_post_notification_recipients",
      {
        p_post_id: postId,
      }
    );
    expect(error).toBeNull();
    const ids = data!.map((r: { user_id: string }) => r.user_id);
    expect(ids).toContain(friend.id);
    expect(ids).toContain(mutual.id);
    expect(ids).not.toContain(stranger.id);
  });

  it("public-visibility post caps at friends + mutuals (no unbounded public)", async () => {
    const postId = await createPost(author.id, "public");
    const { data, error } = await adminClient.rpc(
      "get_post_notification_recipients",
      {
        p_post_id: postId,
      }
    );
    expect(error).toBeNull();
    const ids = data!.map((r: { user_id: string }) => r.user_id);
    expect(ids).toContain(friend.id);
    expect(ids).toContain(mutual.id);
    expect(ids).not.toContain(stranger.id);
  });

  it("excludes blocked users even when they are friends", async () => {
    const postId = await createPost(author.id, "friends");
    const { data, error } = await adminClient.rpc(
      "get_post_notification_recipients",
      {
        p_post_id: postId,
      }
    );
    expect(error).toBeNull();
    const ids = data!.map((r: { user_id: string }) => r.user_id);
    expect(ids).toContain(friend.id);
    expect(ids).not.toContain(blockedFriend.id);
  });
});
