import { adminClient } from "../utils/supabase-test-client";
import {
  createTestUser,
  createFriendship,
  createTestPost,
  createTestSavedPost,
  cleanupTestData,
  TestUser,
} from "../utils/seed";

describe("get_saved_posts RPC", () => {
  let userA: TestUser;
  let userB: TestUser;
  let postByB: string;

  beforeAll(async () => {
    userA = await createTestUser({ full_name: "Saver Alice" });
    userB = await createTestUser({ full_name: "Author Bob" });

    await createFriendship(userA.id, userB.id);

    postByB = await createTestPost(userB.id, { text: "Bob's great post" });
    await createTestSavedPost(userA.id, postByB);
  });

  afterAll(async () => {
    await cleanupTestData([userA.id, userB.id]);
  });

  it("returns saved posts with author data", async () => {
    const { data, error } = await adminClient.rpc("get_saved_posts", {
      user_id_param: userA.id,
      limit_param: 10,
      offset_param: 0,
    });
    expect(error).toBeNull();
    expect(data).toHaveLength(1);

    const post = data[0];
    expect(post.id).toBe(postByB);
    expect(post.text).toBe("Bob's great post");
    expect(post.author_id).toBe(userB.id);

    // Author is JSONB object
    expect(post.author).toBeDefined();
    expect(post.author.full_name).toBe("Author Bob");
    expect(post.author.id).toBe(userB.id);
  });

  it("returns saved_by_user = true for saved posts", async () => {
    const { data, error } = await adminClient.rpc("get_saved_posts", {
      user_id_param: userA.id,
      limit_param: 10,
      offset_param: 0,
    });
    expect(error).toBeNull();
    expect(data[0].saved_by_user).toBe(true);
  });

  it("returns empty when user has no saved posts", async () => {
    const { data, error } = await adminClient.rpc("get_saved_posts", {
      user_id_param: userB.id,
      limit_param: 10,
      offset_param: 0,
    });
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });
});
