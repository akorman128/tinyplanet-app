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

const { useSavePost, useUnsavePost, useGetSavedPosts } = await import(
  "@/hooks/useSavedPosts"
);

describe("useSavePost", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("calls from('saved_posts').insert() with correct params", async () => {
    mockSupabase.configureFrom("saved_posts", { data: {}, error: null });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useSavePost(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync("post-123");
    });

    expect(mockSupabase.from).toHaveBeenCalledWith("saved_posts");
    const chain = mockSupabase.getLastChain("saved_posts");
    expect(chain?.insert).toHaveBeenCalledWith({
      user_id: "user-a",
      post_id: "post-123",
    });
  });
});

describe("useUnsavePost", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("calls from('saved_posts').delete() with correct filters", async () => {
    mockSupabase.configureFrom("saved_posts", { data: {}, error: null });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useUnsavePost(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync("post-456");
    });

    expect(mockSupabase.from).toHaveBeenCalledWith("saved_posts");
    const chain = mockSupabase.getLastChain("saved_posts");
    expect(chain?.delete).toHaveBeenCalled();
    expect(chain?.eq).toHaveBeenCalledWith("user_id", "user-a");
    expect(chain?.eq).toHaveBeenCalledWith("post_id", "post-456");
  });
});

describe("useGetSavedPosts", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("calls rpc('get_saved_posts') with correct params", async () => {
    const posts = [{ id: "post-1" }, { id: "post-2" }];
    mockSupabase.configureRpc("get_saved_posts", { data: posts, error: null });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useGetSavedPosts(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockSupabase.rpc).toHaveBeenCalledWith("get_saved_posts", {
      user_id_param: "user-a",
      limit_param: 10,
      offset_param: 0,
    });
    expect(result.current.data?.pages[0]).toEqual(posts);
  });
});
