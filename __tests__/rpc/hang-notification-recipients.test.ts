import { adminClient } from "../utils/supabase-test-client";
import {
  createTestUser,
  createFriendship,
  cleanupTestData,
  TestUser,
} from "../utils/seed";

describe("get_hang_notification_recipients", () => {
  let host: TestUser;
  let friend: TestUser;
  let mutual: TestUser;
  let blockedFriend: TestUser;
  let stranger: TestUser;

  beforeAll(async () => {
    host = await createTestUser({ full_name: "Host Hang" });
    friend = await createTestUser({ full_name: "Friend Hang" });
    mutual = await createTestUser({ full_name: "Mutual Hang" });
    blockedFriend = await createTestUser({ full_name: "Blocked Hang" });
    stranger = await createTestUser({ full_name: "Stranger Hang" });

    await createFriendship(host.id, friend.id);
    await createFriendship(friend.id, mutual.id);
    await createFriendship(host.id, blockedFriend.id);
    await adminClient
      .from("blocks")
      .insert({ blocker_id: host.id, blocked_id: blockedFriend.id });
  });

  afterAll(async () => {
    await cleanupTestData([
      host.id,
      friend.id,
      mutual.id,
      blockedFriend.id,
      stranger.id,
    ]);
  });

  it("returns friends + mutuals, excludes blocked and strangers", async () => {
    const { data, error } = await adminClient.rpc(
      "get_hang_notification_recipients",
      {
        p_host_id: host.id,
      }
    );
    expect(error).toBeNull();
    const ids = data!.map((r: { user_id: string }) => r.user_id);
    expect(ids).toContain(friend.id);
    expect(ids).toContain(mutual.id);
    expect(ids).not.toContain(blockedFriend.id);
    expect(ids).not.toContain(stranger.id);
    expect(ids).not.toContain(host.id);
  });
});
