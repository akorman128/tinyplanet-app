import { adminClient } from "../utils/supabase-test-client";
import { createTestUser, cleanupTestData, TestUser } from "../utils/seed";

describe("get_invite_refresh_recipients", () => {
  let lastMonthInviter: TestUser; // invited last calendar month -> included
  let thisMonthInviter: TestUser; // invited this calendar month -> excluded

  const now = new Date();
  const lastMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 15, 12, 0, 0)
  );
  const thisMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 15, 12, 0, 0)
  );

  beforeAll(async () => {
    lastMonthInviter = await createTestUser({
      full_name: "Last Month Inviter",
    });
    thisMonthInviter = await createTestUser({
      full_name: "This Month Inviter",
    });

    await adminClient.from("invite_codes").insert([
      {
        code: `LM-${lastMonthInviter.id.slice(0, 8)}`,
        inviter_id: lastMonthInviter.id,
        created_at: lastMonth.toISOString(),
      },
      {
        code: `TM-${thisMonthInviter.id.slice(0, 8)}`,
        inviter_id: thisMonthInviter.id,
        created_at: thisMonth.toISOString(),
      },
    ]);
  });

  afterAll(async () => {
    await cleanupTestData([lastMonthInviter.id, thisMonthInviter.id]);
  });

  it("returns inviters from the previous calendar month only", async () => {
    const { data, error } = await adminClient.rpc(
      "get_invite_refresh_recipients",
      {}
    );
    expect(error).toBeNull();
    const ids = data!.map((r: { user_id: string }) => r.user_id);
    expect(ids).toContain(lastMonthInviter.id);
    expect(ids).not.toContain(thisMonthInviter.id);
  });
});
