import { adminClient } from "../utils/supabase-test-client";
import {
  createTestUser,
  createTestVibe,
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
    await createTestVibe(userB.id, userA.id, ["🔥", "💯", "🎉"]);
    // C sends vibes to A: fire, heart, star
    await createTestVibe(userC.id, userA.id, ["🔥", "❤️", "🌟"]);
  });

  afterAll(async () => {
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
    const singleEmojis = data.filter(
      (v: { emoji: string; count: number }) => Number(v.count) === 1
    );
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
