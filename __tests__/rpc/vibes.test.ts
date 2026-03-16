import { adminClient } from "../utils/supabase-test-client";
import {
  createTestUser,
  cleanupTestData,
  TestUser,
} from "../utils/seed";

describe("get_top_vibes RPC", () => {
  let userA: TestUser;
  let userB: TestUser;
  let userC: TestUser;

  beforeAll(async () => {
    userA = await createTestUser({ full_name: "Vibes Recipient" });
    userB = await createTestUser({ full_name: "Vibes Giver B" });
    userC = await createTestUser({ full_name: "Vibes Giver C" });

    // B sends vibes to A: fire, 100, party
    const { error: e1 } = await adminClient.from("vibes").insert({
      giver_id: userB.id,
      receiver_id: userA.id,
      emojis: ["🔥", "💯", "🎉"],
    });
    if (e1) throw e1;

    // C sends vibes to A: fire, heart, star
    const { error: e2 } = await adminClient.from("vibes").insert({
      giver_id: userC.id,
      receiver_id: userA.id,
      emojis: ["🔥", "❤️", "🌟"],
    });
    if (e2) throw e2;
  });

  afterAll(async () => {
    // Clean up vibes manually since cleanupTestData uses sender_id/recipient_id
    await adminClient
      .from("vibes")
      .delete()
      .or(`receiver_id.eq.${userA.id}`);
    await cleanupTestData([userA.id, userB.id, userC.id]);
  });

  it("returns top emojis ordered by frequency", async () => {
    const { data, error } = await adminClient.rpc("get_top_vibes", {
      p_user_id: userA.id,
    });
    expect(error).toBeNull();
    expect(data.length).toBeGreaterThanOrEqual(1);

    // Fire emoji appears twice (once from B, once from C), should be first
    expect(data[0].emoji).toBe("🔥");
    expect(Number(data[0].count)).toBe(2);

    // Other emojis appear once each
    const singleEmojis = data.filter((v: any) => Number(v.count) === 1);
    expect(singleEmojis.length).toBe(4); // 💯, 🎉, ❤️, 🌟
  });

  it("respects limit parameter", async () => {
    const { data, error } = await adminClient.rpc("get_top_vibes", {
      p_user_id: userA.id,
      p_limit: 2,
    });
    expect(error).toBeNull();
    expect(data).toHaveLength(2);
    expect(data[0].emoji).toBe("🔥");
  });

  it("returns empty for user with no vibes received", async () => {
    const { data, error } = await adminClient.rpc("get_top_vibes", {
      p_user_id: userB.id,
    });
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });
});
