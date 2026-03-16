import { adminClient, anonClient } from "../utils/supabase-test-client";
import {
  createTestUser,
  createFriendship,
  cleanupTestData,
  TestUser,
} from "../utils/seed";

/**
 * Helper: sign in as a test user and return an authenticated Supabase client.
 * The travel plan RPCs check auth.uid(), so we need a real JWT.
 */
async function signInAsUser(email: string) {
  const { data, error } = await anonClient.auth.signInWithPassword({
    email,
    password: "test-password-123",
  });
  if (error) throw error;

  const { createClient } = await import("@supabase/supabase-js");
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      },
    }
  );
}

/** Format a Date as YYYY-MM-DD */
function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

/** Get a future date N days from now */
function futureDate(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return formatDate(d);
}

describe("Travel Plan RPCs", () => {
  let userA: TestUser;
  let userB: TestUser;
  let clientA: Awaited<ReturnType<typeof signInAsUser>>;
  let clientB: Awaited<ReturnType<typeof signInAsUser>>;

  beforeAll(async () => {
    userA = await createTestUser({ full_name: "Travel User A" });
    userB = await createTestUser({ full_name: "Travel User B" });
    await createFriendship(userA.id, userB.id);

    clientA = await signInAsUser(userA.email);
    clientB = await signInAsUser(userB.email);
  });

  afterAll(async () => {
    // Clean up any remaining travel plans first
    await adminClient.from("travel_plans").delete().eq("user_id", userA.id);
    await adminClient.from("travel_plans").delete().eq("user_id", userB.id);
    await cleanupTestData([userA.id, userB.id]);
  });

  // ── create_travel_plan_with_post ──────────────────────────────

  describe("create_travel_plan_with_post", () => {
    let createdPlanId: string | null = null;

    afterEach(async () => {
      // Clean up plan created in each test
      if (createdPlanId) {
        await clientA.rpc("cancel_travel_plan_with_post", {
          p_travel_plan_id: createdPlanId,
        });
        createdPlanId = null;
      }
    });

    it("creates plan and associated post successfully", async () => {
      const startDate = futureDate(5);
      const { data, error } = await clientA.rpc(
        "create_travel_plan_with_post",
        {
          p_user_id: userA.id,
          p_destination_location_lng: -73.9857,
          p_destination_location_lat: 40.7484,
          p_destination_name: "New York City",
          p_start_date: startDate,
          p_duration_days: 7,
        }
      );

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      const plan = data![0];
      createdPlanId = plan.travel_plan_id;

      expect(plan.travel_plan_id).toBeDefined();
      expect(plan.post_id).toBeDefined();
      expect(plan.destination_name).toBe("New York City");
      expect(plan.start_date).toBe(startDate);

      // Verify the post was created
      const { data: post } = await adminClient
        .from("posts")
        .select("*")
        .eq("id", plan.post_id)
        .single();
      expect(post).not.toBeNull();
      expect(post!.text).toContain("New York City");
      expect(post!.author_id).toBe(userA.id);
    });

    it("rejects duration outside 1-31 range", async () => {
      const { error: errZero } = await clientA.rpc(
        "create_travel_plan_with_post",
        {
          p_user_id: userA.id,
          p_destination_location_lng: 2.3522,
          p_destination_location_lat: 48.8566,
          p_destination_name: "Paris",
          p_start_date: futureDate(10),
          p_duration_days: 0,
        }
      );
      expect(errZero).not.toBeNull();
      expect(errZero!.message).toContain("Duration must be between 1 and 31");

      const { error: errOver } = await clientA.rpc(
        "create_travel_plan_with_post",
        {
          p_user_id: userA.id,
          p_destination_location_lng: 2.3522,
          p_destination_location_lat: 48.8566,
          p_destination_name: "Paris",
          p_start_date: futureDate(10),
          p_duration_days: 32,
        }
      );
      expect(errOver).not.toBeNull();
      expect(errOver!.message).toContain("Duration must be between 1 and 31");
    });

    it("prevents overlapping travel plans for same user", async () => {
      // Create first plan
      const { data: first } = await clientA.rpc(
        "create_travel_plan_with_post",
        {
          p_user_id: userA.id,
          p_destination_location_lng: 139.6917,
          p_destination_location_lat: 35.6895,
          p_destination_name: "Tokyo",
          p_start_date: futureDate(3),
          p_duration_days: 5,
        }
      );
      createdPlanId = first![0].travel_plan_id;

      // Attempt second plan — should fail
      const { error } = await clientA.rpc("create_travel_plan_with_post", {
        p_user_id: userA.id,
        p_destination_location_lng: 2.3522,
        p_destination_location_lat: 48.8566,
        p_destination_name: "Paris",
        p_start_date: futureDate(20),
        p_duration_days: 3,
      });
      expect(error).not.toBeNull();
      expect(error!.message).toContain(
        "already have an active or upcoming travel plan"
      );
    });

    it("creates plan with custom post text", async () => {
      const { data } = await clientA.rpc("create_travel_plan_with_post", {
        p_user_id: userA.id,
        p_destination_location_lng: -0.1276,
        p_destination_location_lat: 51.5074,
        p_destination_name: "London",
        p_start_date: futureDate(15),
        p_duration_days: 4,
        p_text: "Who wants to grab fish and chips?",
      });

      expect(data).toHaveLength(1);
      createdPlanId = data![0].travel_plan_id;

      // Verify the custom text is appended to the auto-generated text
      const { data: post } = await adminClient
        .from("posts")
        .select("text")
        .eq("id", data![0].post_id)
        .single();
      expect(post!.text).toContain("London");
      expect(post!.text).toContain("Who wants to grab fish and chips?");
    });
  });

  // ── update_travel_plan_with_post ──────────────────────────────

  describe("update_travel_plan_with_post", () => {
    let planId: string;
    let postId: string;

    beforeAll(async () => {
      const { data } = await clientA.rpc("create_travel_plan_with_post", {
        p_user_id: userA.id,
        p_destination_location_lng: 12.4964,
        p_destination_location_lat: 41.9028,
        p_destination_name: "Rome",
        p_start_date: futureDate(5),
        p_duration_days: 5,
      });
      planId = data![0].travel_plan_id;
      postId = data![0].post_id;
    });

    afterAll(async () => {
      await clientA.rpc("cancel_travel_plan_with_post", {
        p_travel_plan_id: planId,
      });
    });

    it("updates destination and syncs post", async () => {
      const newStart = futureDate(8);
      const { data, error } = await clientA.rpc(
        "update_travel_plan_with_post",
        {
          p_travel_plan_id: planId,
          p_destination_location_lng: 23.7275,
          p_destination_location_lat: 37.9838,
          p_destination_name: "Athens",
          p_start_date: newStart,
          p_duration_days: 3,
        }
      );

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].destination_name).toBe("Athens");
      expect(data![0].start_date).toBe(newStart);

      // Verify post text was updated
      const { data: post } = await adminClient
        .from("posts")
        .select("text")
        .eq("id", postId)
        .single();
      expect(post!.text).toContain("Athens");
      expect(post!.text).not.toContain("Rome");
    });
  });

  // ── cancel_travel_plan_with_post ──────────────────────────────

  describe("cancel_travel_plan_with_post", () => {
    it("deletes both plan and associated post", async () => {
      // Create a plan to cancel
      const { data: created } = await clientA.rpc(
        "create_travel_plan_with_post",
        {
          p_user_id: userA.id,
          p_destination_location_lng: -3.7038,
          p_destination_location_lat: 40.4168,
          p_destination_name: "Madrid",
          p_start_date: futureDate(10),
          p_duration_days: 3,
        }
      );

      const planId = created![0].travel_plan_id;
      const postId = created![0].post_id;

      // Cancel it
      const { error } = await clientA.rpc("cancel_travel_plan_with_post", {
        p_travel_plan_id: planId,
      });
      expect(error).toBeNull();

      // Verify plan is gone
      const { data: plan } = await adminClient
        .from("travel_plans")
        .select("id")
        .eq("id", planId)
        .maybeSingle();
      expect(plan).toBeNull();

      // Verify post is gone
      const { data: post } = await adminClient
        .from("posts")
        .select("id")
        .eq("id", postId)
        .maybeSingle();
      expect(post).toBeNull();
    });
  });

  // ── get_travel_plan_by_post_id ────────────────────────────────

  describe("get_travel_plan_by_post_id", () => {
    let planId: string;
    let postId: string;

    beforeAll(async () => {
      const { data } = await clientA.rpc("create_travel_plan_with_post", {
        p_user_id: userA.id,
        p_destination_location_lng: -43.1729,
        p_destination_location_lat: -22.9068,
        p_destination_name: "Rio de Janeiro",
        p_start_date: futureDate(7),
        p_duration_days: 10,
      });
      planId = data![0].travel_plan_id;
      postId = data![0].post_id;
    });

    afterAll(async () => {
      await clientA.rpc("cancel_travel_plan_with_post", {
        p_travel_plan_id: planId,
      });
    });

    it("returns plan by post ID with coordinates", async () => {
      const { data, error } = await clientA.rpc("get_travel_plan_by_post_id", {
        p_post_id: postId,
      });

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      const plan = data![0];
      expect(plan.id).toBe(planId);
      expect(plan.destination_name).toBe("Rio de Janeiro");
      expect(plan.longitude).toBeCloseTo(-43.1729, 2);
      expect(plan.latitude).toBeCloseTo(-22.9068, 2);
      expect(plan.duration_days).toBe(10);
    });

    it("returns empty for non-existent post", async () => {
      const fakePostId = "00000000-0000-0000-0000-000000000000";
      const { data, error } = await clientA.rpc("get_travel_plan_by_post_id", {
        p_post_id: fakePostId,
      });

      // The function raises an exception when plan not found
      expect(error).not.toBeNull();
    });
  });

  // ── get_active_travel_plan_locations ──────────────────────────

  describe("get_active_travel_plan_locations", () => {
    let planId: string;

    beforeAll(async () => {
      // UserB creates an active travel plan (starts today, lasts 7 days)
      const { data } = await clientB.rpc("create_travel_plan_with_post", {
        p_user_id: userB.id,
        p_destination_location_lng: 100.5018,
        p_destination_location_lat: 13.7563,
        p_destination_name: "Bangkok",
        p_start_date: formatDate(new Date()), // starts today
        p_duration_days: 7,
      });
      planId = data![0].travel_plan_id;
    });

    afterAll(async () => {
      await clientB.rpc("cancel_travel_plan_with_post", {
        p_travel_plan_id: planId,
      });
    });

    it("returns friend travel plan locations", async () => {
      // UserA should see UserB's plan since they're friends
      const { data, error } = await clientA.rpc(
        "get_active_travel_plan_locations",
        { p_user_id: userA.id }
      );

      expect(error).toBeNull();
      expect(data!.length).toBeGreaterThanOrEqual(1);

      const bangkokPlan = data!.find(
        (p: Record<string, unknown>) => p.user_id === userB.id
      );
      expect(bangkokPlan).toBeDefined();
      expect(bangkokPlan!.destination_name).toBe("Bangkok");
      expect(bangkokPlan!.longitude).toBeCloseTo(100.5018, 2);
      expect(bangkokPlan!.latitude).toBeCloseTo(13.7563, 2);
      expect(bangkokPlan!.type).toBe("friend");
      expect(bangkokPlan!.full_name).toBe("Travel User B");
    });
  });
});
