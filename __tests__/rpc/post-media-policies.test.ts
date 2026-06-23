import { authedClientFor } from "../utils/auth-helpers";
import { adminClient } from "../utils/supabase-test-client";
import { createTestUser, cleanupTestData, TestUser } from "../utils/seed";

const tinyJpeg = () => new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

describe("post-media storage policies", () => {
  let userA: TestUser;
  let userB: TestUser;

  beforeAll(async () => {
    userA = await createTestUser({ full_name: "Media Alice" });
    userB = await createTestUser({ full_name: "Media Bob" });
  });

  afterAll(async () => {
    await adminClient.storage
      .from("post-media-staging")
      .remove([`${userA.id}/a.jpg`]);
    await adminClient.storage.from("post-media").remove([`${userA.id}/a.jpg`]);
    await cleanupTestData([userA.id, userB.id]);
  });

  it("lets a user upload to staging under their own prefix", async () => {
    const client = await authedClientFor(userA.email);
    // Plain INSERT (no upsert): the feature uploads unique paths, and upsert
    // would emit ON CONFLICT DO UPDATE, which Postgres requires an UPDATE policy
    // for — staging intentionally has none.
    const { error } = await client.storage
      .from("post-media-staging")
      .upload(`${userA.id}/a.jpg`, tinyJpeg(), {
        contentType: "image/jpeg",
      });
    expect(error).toBeNull();
  });

  it("blocks uploading to staging under another user's prefix", async () => {
    const client = await authedClientFor(userA.email);
    const { error } = await client.storage
      .from("post-media-staging")
      .upload(`${userB.id}/a.jpg`, tinyJpeg(), { contentType: "image/jpeg" });
    expect(error).not.toBeNull();
  });

  it("blocks clients from writing to the public post-media bucket", async () => {
    const client = await authedClientFor(userA.email);
    const { error } = await client.storage
      .from("post-media")
      .upload(`${userA.id}/a.jpg`, tinyJpeg(), { contentType: "image/jpeg" });
    expect(error).not.toBeNull();
  });

  // The owner-delete policy on post-media is exercised in production. It can't
  // be verified through the Storage API on this local stack: storage-api
  // v1.29.0 fails to set the `storage.allow_delete_query` GUC that its own
  // `protect_delete()` trigger requires, so EVERY API delete (even service_role)
  // errors with 42501. The harness has no raw-SQL path to set that GUC, so this
  // assertion is skipped locally rather than asserting the broken behavior.
  it.skip("lets a user delete their own object in post-media (blocked by local storage-api v1.29 allow_delete_query bug)", async () => {
    await adminClient.storage
      .from("post-media")
      .upload(`${userA.id}/a.jpg`, tinyJpeg(), {
        contentType: "image/jpeg",
        upsert: true,
      });
    const client = await authedClientFor(userA.email);
    const { error } = await client.storage
      .from("post-media")
      .remove([`${userA.id}/a.jpg`]);
    expect(error).toBeNull();
  });
});
