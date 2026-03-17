import { renderHook, waitFor, act } from "@testing-library/react";
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

const { useCreateVibe, useUpdateVibe, useGetTopVibes } = await import(
  "@/hooks/useVibe"
);

describe("useCreateVibe", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("inserts a vibe with correct data", async () => {
    const vibeData = {
      id: "vibe-1",
      giver_id: "user-a",
      emojis: ["😀", "🎉", "🔥"],
    };
    mockSupabase.configureFrom("vibes", { data: vibeData, error: null });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useCreateVibe(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        receiverId: "user-b",
        emojis: ["😀", "🎉", "🔥"],
      });
    });

    expect(mockSupabase.from).toHaveBeenCalledWith("vibes");
    const chain = mockSupabase.getLastChain("vibes");
    expect(chain?.insert).toHaveBeenCalledWith({
      giver_id: "user-a",
      receiver_id: "user-b",
      emojis: ["😀", "🎉", "🔥"],
    });
    expect(chain?.select).toHaveBeenCalled();
    expect(chain?.single).toHaveBeenCalled();
  });
});

describe("useUpdateVibe (emoji validation)", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("rejects update with wrong emoji count", async () => {
    mockSupabase.configureFrom("vibes", { data: {}, error: null });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useUpdateVibe(), { wrapper: Wrapper });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          vibeId: "vibe-1",
          emojis: ["😀", "🎉"],
        });
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe(
      "Vibe must have exactly 3 emojis"
    );
  });

  it("allows update with exactly 3 emojis", async () => {
    mockSupabase.configureFrom("vibes", { data: {}, error: null });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useUpdateVibe(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        vibeId: "vibe-1",
        emojis: ["😀", "🎉", "🔥"],
      });
    });

    const chain = mockSupabase.getLastChain("vibes");
    expect(chain?.update).toHaveBeenCalledWith({
      emojis: ["😀", "🎉", "🔥"],
    });
  });
});

describe("useGetTopVibes", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("calls rpc('get_top_vibes') with correct params", async () => {
    const vibeData = [
      { emoji: "😀", count: 5 },
      { emoji: "🎉", count: 3 },
    ];
    mockSupabase.configureRpc("get_top_vibes", { data: vibeData, error: null });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useGetTopVibes("user-b"), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockSupabase.rpc).toHaveBeenCalledWith("get_top_vibes", {
      p_user_id: "user-b",
      p_limit: 5,
    });
    expect(result.current.data).toEqual({ data: vibeData, totalCount: 8 });
  });
});
