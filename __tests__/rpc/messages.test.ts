import { adminClient } from "../utils/supabase-test-client";
import { authedClientFor } from "../utils/auth-helpers";
import {
  createTestUser,
  createFriendship,
  createTestMessage,
  cleanupTestData,
  TestUser,
} from "../utils/seed";

describe("messages RPCs", () => {
  let userA: TestUser;
  let userB: TestUser;
  let userLoner: TestUser;

  beforeAll(async () => {
    userA = await createTestUser({ full_name: "Alice Messages" });
    userB = await createTestUser({ full_name: "Bob Messages" });
    userLoner = await createTestUser({ full_name: "Lonely User" });

    await createFriendship(userA.id, userB.id);

    // B sends 2 messages to A, A sends 1 back
    await createTestMessage(userB.id, userA.id, "Hey Alice");
    // Small delay to ensure ordering
    await new Promise((r) => setTimeout(r, 50));
    await createTestMessage(userB.id, userA.id, "How are you?");
    await new Promise((r) => setTimeout(r, 50));
    await createTestMessage(userA.id, userB.id, "Good thanks!");
  });

  afterAll(async () => {
    await cleanupTestData([userA.id, userB.id, userLoner.id]);
  });

  describe("get_message_channels", () => {
    it("returns channels with last message data", async () => {
      const client = await authedClientFor(userA.email);
      const { data, error } = await client.rpc("get_message_channels", {
        p_user_id: userA.id,
      });
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      const channel = data![0];
      expect(channel.friend_id).toBe(userB.id);
      expect(channel.full_name).toBe("Bob Messages");
      expect(channel.last_message_text).toBe("Good thanks!");
      expect(channel.last_message_sender_id).toBe(userA.id);
      expect(channel.last_message_id).toBeTruthy();
      expect(channel.last_message_created_at).toBeTruthy();
    });

    it("calculates unread count", async () => {
      // A has 2 unread messages from B (the two B sent)
      const client = await authedClientFor(userA.email);
      const { data, error } = await client.rpc("get_message_channels", {
        p_user_id: userA.id,
      });
      expect(error).toBeNull();
      expect(data![0].unread_count).toBe(2);
    });

    it("returns empty for user with no friends", async () => {
      const client = await authedClientFor(userLoner.email);
      const { data, error } = await client.rpc("get_message_channels", {
        p_user_id: userLoner.id,
      });
      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });
  });

  describe("has_unread_messages", () => {
    it("returns true when unread messages exist", async () => {
      const client = await authedClientFor(userA.email);
      const { data, error } = await client.rpc("has_unread_messages", {
        p_user_id: userA.id,
      });
      expect(error).toBeNull();
      expect(data).toBe(true);
    });

    it("returns false after marking as read", async () => {
      // Mark conversation as read for userA
      const { error: upsertError } = await adminClient
        .from("conversation_reads")
        .upsert({
          user_id: userA.id,
          friend_id: userB.id,
          last_read_at: new Date().toISOString(),
        });
      expect(upsertError).toBeNull();

      const client = await authedClientFor(userA.email);
      const { data, error } = await client.rpc("has_unread_messages", {
        p_user_id: userA.id,
      });
      expect(error).toBeNull();
      expect(data).toBe(false);
    });
  });
});
