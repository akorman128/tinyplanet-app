import { renderHook, act } from "@testing-library/react";
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

const { useLikePost, useUnlikePost, useLikeComment } = await import(
  "@/hooks/useLikes"
);

describe("useLikePost", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("inserts like with correct payload", async () => {
    mockSupabase.configureFrom("likes", { data: null, error: null });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useLikePost(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync("post-1");
    });

    expect(mockSupabase.from).toHaveBeenCalledWith("likes");
    const chain = mockSupabase.getLastChain("likes");
    expect(chain?.insert).toHaveBeenCalledWith({
      user_id: "user-a",
      post_id: "post-1",
      comment_id: null,
    });
  });
});

describe("useUnlikePost", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("deletes like with correct eq() calls", async () => {
    mockSupabase.configureFrom("likes", { data: null, error: null });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useUnlikePost(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync("post-1");
    });

    expect(mockSupabase.from).toHaveBeenCalledWith("likes");
    const chain = mockSupabase.getLastChain("likes");
    expect(chain?.delete).toHaveBeenCalled();
    expect(chain?.eq).toHaveBeenCalledWith("user_id", "user-a");
    expect(chain?.eq).toHaveBeenCalledWith("post_id", "post-1");
  });
});

describe("useLikeComment", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("inserts like with comment_id and post_id: null", async () => {
    mockSupabase.configureFrom("likes", { data: null, error: null });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useLikeComment(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync("comment-1");
    });

    expect(mockSupabase.from).toHaveBeenCalledWith("likes");
    const chain = mockSupabase.getLastChain("likes");
    expect(chain?.insert).toHaveBeenCalledWith({
      user_id: "user-a",
      post_id: null,
      comment_id: "comment-1",
    });
  });
});
