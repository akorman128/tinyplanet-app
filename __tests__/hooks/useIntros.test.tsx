import { renderHook, act } from "@testing-library/react";
import { createMockSupabase, MockSupabaseClient } from "../utils/mock-supabase";
import { createTestWrapper } from "../utils/test-wrapper";

let mockSupabase: MockSupabaseClient;

vi.mock("@/hooks/useSupabase", () => ({
  useSupabase: () => ({ supabase: mockSupabase, isLoaded: true, session: {} }),
}));

vi.mock("@/hooks/useRequireProfile", () => ({
  useRequireProfile: () => ({
    id: "user-a",
    full_name: "User A",
    avatar_url: "",
  }),
}));

vi.mock("@/stores/profileStore", () => ({
  useProfileStore: () => ({ profileState: { id: "user-a" } }),
}));

const { useCreateIntro, useGetIntro } = await import("@/hooks/useIntros");

describe("useCreateIntro", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("calls create_intro RPC with correct params", async () => {
    mockSupabase.configureRpc("create_intro", {
      data: "intro-id-1",
      error: null,
    });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useCreateIntro(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        userAId: "user-b",
        userBId: "user-c",
        message: "You both love hiking!",
      });
    });

    expect(mockSupabase.rpc).toHaveBeenCalledWith("create_intro", {
      p_user_a_id: "user-b",
      p_user_b_id: "user-c",
      p_message: "You both love hiking!",
    });
  });

  it("throws on RPC error", async () => {
    mockSupabase.configureRpc("create_intro", {
      data: null,
      error: { message: "You must be friends with both users" },
    });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useCreateIntro(), {
      wrapper: Wrapper,
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          userAId: "user-b",
          userBId: "user-c",
          message: "Hello",
        });
      })
    ).rejects.toEqual(
      expect.objectContaining({
        message: "You must be friends with both users",
      })
    );
  });
});

describe("useGetIntro", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("queries intros table with ordered user IDs", async () => {
    const introRow = {
      id: "intro-1",
      introducer_id: "user-c",
      user_id_a: "user-a",
      user_id_b: "user-b",
      message: "You should meet!",
      created_at: "2026-03-18T00:00:00Z",
      introducer: {
        id: "user-c",
        full_name: "User C",
        avatar_url: null,
      },
    };
    mockSupabase.configureFrom("intros", { data: introRow, error: null });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useGetIntro("user-b"), {
      wrapper: Wrapper,
    });

    // Wait for query to resolve
    await vi.waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSupabase.from).toHaveBeenCalledWith("intros");
    const chain = mockSupabase.getLastChain("intros");
    expect(chain?.eq).toHaveBeenCalledWith("user_id_a", "user-a");
    expect(chain?.eq).toHaveBeenCalledWith("user_id_b", "user-b");
    expect(result.current.data?.data).toEqual(introRow);
  });
});
