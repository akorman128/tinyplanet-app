import { renderHook, waitFor, act } from "@testing-library/react";
import { createMockSupabase, MockSupabaseClient } from "../utils/mock-supabase";
import { createTestWrapper } from "../utils/test-wrapper";

let mockSupabase: MockSupabaseClient;

vi.mock("@/hooks/useSupabase", () => ({
  useSupabase: () => ({ supabase: mockSupabase, isLoaded: true, session: {} }),
}));

vi.mock("@/hooks/useRequireProfile", () => ({
  useRequireProfile: () => ({ id: "user-a", full_name: "User A", avatar_url: "" }),
}));

vi.mock("@/stores/profileStore", () => ({
  useProfileStore: () => ({ profileState: { id: "user-a" } }),
}));

const { useCreateTravelPlan, useCancelTravelPlan, useGetTravelPlanByPostId } =
  await import("@/hooks/useTravelPlan");

describe("useCreateTravelPlan", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("calls RPC with correct params", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const startDate = futureDate.toISOString().split("T")[0];

    mockSupabase.configureRpc("create_travel_plan_with_post", {
      data: [{ id: "tp1", destination_name: "Paris" }],
      error: null,
    });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useCreateTravelPlan(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        destination: { longitude: 2.35, latitude: 48.86, name: "Paris" },
        start_date: startDate,
        duration_days: 5,
        post_visibility: "friends",
        text: "Excited!",
      });
    });

    expect(mockSupabase.rpc).toHaveBeenCalledWith("create_travel_plan_with_post", {
      p_user_id: "user-a",
      p_destination_location_lng: 2.35,
      p_destination_location_lat: 48.86,
      p_destination_name: "Paris",
      p_start_date: startDate,
      p_duration_days: 5,
      p_post_visibility: "friends",
      p_text: "Excited!",
    });
  });

  it("rejects invalid duration > 31", async () => {
    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useCreateTravelPlan(), { wrapper: Wrapper });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          destination: { longitude: 0, latitude: 0, name: "X" },
          start_date: "2099-01-01",
          duration_days: 32,
          post_visibility: "friends",
        });
      })
    ).rejects.toThrow("Duration must be between 1 and 31 days");
  });

  it("rejects past start date", async () => {
    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useCreateTravelPlan(), { wrapper: Wrapper });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          destination: { longitude: 0, latitude: 0, name: "X" },
          start_date: "2020-01-01",
          duration_days: 3,
          post_visibility: "friends",
        });
      })
    ).rejects.toThrow("Start date cannot be in the past");
  });
});

describe("useCancelTravelPlan", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("calls cancel RPC", async () => {
    mockSupabase.configureRpc("cancel_travel_plan_with_post", { data: null, error: null });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useCancelTravelPlan(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync("tp1");
    });

    expect(mockSupabase.rpc).toHaveBeenCalledWith("cancel_travel_plan_with_post", {
      p_travel_plan_id: "tp1",
    });
  });
});

describe("useGetTravelPlanByPostId", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("calls RPC with post id", async () => {
    mockSupabase.configureRpc("get_travel_plan_by_post_id", {
      data: [{ id: "tp1", destination_name: "Paris" }],
      error: null,
    });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useGetTravelPlanByPostId("post-1"), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockSupabase.rpc).toHaveBeenCalledWith("get_travel_plan_by_post_id", {
      p_post_id: "post-1",
    });
  });

  it("is disabled when postId is undefined", () => {
    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useGetTravelPlanByPostId(undefined), { wrapper: Wrapper });

    expect(result.current.fetchStatus).toBe("idle");
  });
});
