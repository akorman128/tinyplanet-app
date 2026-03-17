import { renderHook, waitFor } from "@testing-library/react";
import { createMockSupabase, MockSupabaseClient } from "../utils/mock-supabase";
import { createTestWrapper } from "../utils/test-wrapper";

let mockSupabase: MockSupabaseClient;

vi.mock("@/hooks/useSupabase", () => ({
  useSupabase: () => ({ supabase: mockSupabase, isLoaded: true, session: {} }),
}));

let mockProfileState: { id: string } | null = { id: "user-a" };

vi.mock("@/stores/profileStore", () => ({
  useProfileStore: () => ({ profileState: mockProfileState }),
}));

vi.mock("@/hooks/useRequireProfile", () => ({
  useRequireProfile: () => ({
    id: "user-a",
    full_name: "User A",
    avatar_url: "",
  }),
}));

const { useGetFeed, useGetUserPosts } = await import("@/hooks/useFeed");

describe("useGetFeed", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
    mockProfileState = { id: "user-a" };
  });

  it("fetches feed posts via RPC with correct params", async () => {
    const posts = Array.from({ length: 5 }, (_, i) => ({ id: `post-${i}` }));
    mockSupabase.configureRpc("get_feed_posts", { data: posts, error: null });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useGetFeed(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockSupabase.rpc).toHaveBeenCalledWith("get_feed_posts", {
      user_id_param: "user-a",
      limit_param: 10,
      offset_param: 0,
    });
    expect(result.current.data?.pages[0]).toEqual(posts);
  });

  it("handles error from RPC", async () => {
    mockSupabase.configureRpc("get_feed_posts", {
      data: null,
      error: { message: "Something went wrong" },
    });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useGetFeed(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual({ message: "Something went wrong" });
  });

  it("is disabled when no profile", async () => {
    mockProfileState = null;

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useGetFeed(), { wrapper: Wrapper });

    // Should not fetch
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockSupabase.rpc).not.toHaveBeenCalled();
  });

  it("has next page when full page returned", async () => {
    const fullPage = Array.from({ length: 10 }, (_, i) => ({
      id: `post-${i}`,
    }));
    mockSupabase.configureRpc("get_feed_posts", {
      data: fullPage,
      error: null,
    });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useGetFeed(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(true);
  });

  it("has no next page when partial page returned", async () => {
    const partialPage = Array.from({ length: 7 }, (_, i) => ({
      id: `post-${i}`,
    }));
    mockSupabase.configureRpc("get_feed_posts", {
      data: partialPage,
      error: null,
    });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useGetFeed(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(false);
  });
});

describe("useGetUserPosts", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
    mockProfileState = { id: "user-a" };
  });

  it("fetches posts for specific user with correct params", async () => {
    const posts = [{ id: "post-1" }];
    mockSupabase.configureRpc("get_user_posts", { data: posts, error: null });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useGetUserPosts("user-b"), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockSupabase.rpc).toHaveBeenCalledWith("get_user_posts", {
      user_id_param: "user-a",
      target_user_id: "user-b",
      limit_param: 10,
      offset_param: 0,
    });
  });

  it("is disabled when userId is undefined", async () => {
    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useGetUserPosts(undefined), {
      wrapper: Wrapper,
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockSupabase.rpc).not.toHaveBeenCalled();
  });
});
