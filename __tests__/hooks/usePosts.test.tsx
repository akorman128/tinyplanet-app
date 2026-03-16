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

const { useCreatePost, useUpdatePost, useDeletePost } = await import(
  "@/hooks/usePosts"
);

describe("useCreatePost", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("calls from('posts').insert() and invalidates cache on success", async () => {
    const createdPost = { id: "new-post", text: "hello" };
    mockSupabase.configureFrom("posts", { data: createdPost, error: null });

    const { Wrapper, queryClient } = createTestWrapper(mockSupabase);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreatePost(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        text: "hello",
        visibility: "friends",
      } as any);
    });

    expect(mockSupabase.from).toHaveBeenCalledWith("posts");
    const chain = mockSupabase.getLastChain("posts");
    expect(chain?.insert).toHaveBeenCalledWith({
      author_id: "user-a",
      text: "hello",
      visibility: "friends",
      media_urls: [],
      list_id: null,
    });
    expect(chain?.select).toHaveBeenCalled();
    expect(chain?.single).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["posts"],
    });
  });
});

describe("useDeletePost", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("calls from('posts').delete() with correct post ID and author_id", async () => {
    mockSupabase.configureFrom("posts", { data: null, error: null });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useDeletePost(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync("post-123");
    });

    expect(mockSupabase.from).toHaveBeenCalledWith("posts");
    const chain = mockSupabase.getLastChain("posts");
    expect(chain?.delete).toHaveBeenCalled();
    expect(chain?.eq).toHaveBeenCalledWith("id", "post-123");
    expect(chain?.eq).toHaveBeenCalledWith("author_id", "user-a");
  });
});

describe("useUpdatePost", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("calls from('posts').update() with edited_at timestamp", async () => {
    const updatedPost = { id: "post-123", text: "updated" };
    mockSupabase.configureFrom("posts", { data: updatedPost, error: null });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useUpdatePost(), { wrapper: Wrapper });

    const before = new Date().toISOString();

    await act(async () => {
      await result.current.mutateAsync({
        postId: "post-123",
        input: { text: "updated" },
      });
    });

    const chain = mockSupabase.getLastChain("posts");
    expect(chain?.update).toHaveBeenCalled();
    const updateArg = (chain?.update as any).mock.calls[0][0];
    expect(updateArg.text).toBe("updated");
    expect(updateArg.edited_at).toBeDefined();
    // edited_at should be a recent ISO string
    expect(new Date(updateArg.edited_at).getTime()).toBeGreaterThanOrEqual(
      new Date(before).getTime()
    );
    expect(chain?.eq).toHaveBeenCalledWith("id", "post-123");
    expect(chain?.eq).toHaveBeenCalledWith("author_id", "user-a");
  });
});
