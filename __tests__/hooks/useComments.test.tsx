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

const { useUpdateComment, useDeleteComment } = await import(
  "@/hooks/useComments"
);

describe("useUpdateComment", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("updates the body, stamps edited_at, and scopes to the author", async () => {
    mockSupabase.configureFrom("comments", {
      data: { id: "comment-1", body: "new body" },
      error: null,
    });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useUpdateComment(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        commentId: "comment-1",
        input: { body: "new body" },
      });
    });

    expect(mockSupabase.from).toHaveBeenCalledWith("comments");
    const chain = mockSupabase.getLastChain("comments");
    expect(chain).toBeDefined();
    expect(chain?.update).toHaveBeenCalledWith(
      expect.objectContaining({
        body: "new body",
        edited_at: expect.any(String),
      })
    );
    // Author scoping: only the author can update their own comment.
    expect(chain?.eq).toHaveBeenCalledWith("id", "comment-1");
    expect(chain?.eq).toHaveBeenCalledWith("author_id", "user-a");
  });

  it("does not touch list_id when it is not provided", async () => {
    mockSupabase.configureFrom("comments", {
      data: { id: "comment-1", body: "new body" },
      error: null,
    });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useUpdateComment(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        commentId: "comment-1",
        input: { body: "new body" },
      });
    });

    const chain = mockSupabase.getLastChain("comments");
    expect(chain).toBeDefined();
    const updateArg = chain?.update.mock.calls[0][0];
    expect(updateArg).not.toHaveProperty("list_id");
  });

  it("sets list_id when explicitly provided (including null to clear)", async () => {
    mockSupabase.configureFrom("comments", {
      data: { id: "comment-1", body: "new body" },
      error: null,
    });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useUpdateComment(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        commentId: "comment-1",
        input: { body: "new body", list_id: null },
      });
    });

    const chain = mockSupabase.getLastChain("comments");
    expect(chain).toBeDefined();
    const updateArg = chain?.update.mock.calls[0][0];
    expect(updateArg).toHaveProperty("list_id", null);
  });

  it("throws when Supabase returns an error", async () => {
    mockSupabase.configureFrom("comments", {
      data: null,
      error: { message: "denied" },
    });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useUpdateComment(), {
      wrapper: Wrapper,
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          commentId: "comment-1",
          input: { body: "new body" },
        });
      })
    ).rejects.toBeDefined();
  });
});

describe("useDeleteComment", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("deletes by id and scopes to the author", async () => {
    mockSupabase.configureFrom("comments", { data: null, error: null });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useDeleteComment(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync("comment-1");
    });

    expect(mockSupabase.from).toHaveBeenCalledWith("comments");
    const chain = mockSupabase.getLastChain("comments");
    expect(chain).toBeDefined();
    expect(chain?.delete).toHaveBeenCalled();
    expect(chain?.eq).toHaveBeenCalledWith("id", "comment-1");
    expect(chain?.eq).toHaveBeenCalledWith("author_id", "user-a");
  });

  it("throws when Supabase returns an error", async () => {
    mockSupabase.configureFrom("comments", {
      data: null,
      error: { message: "denied" },
    });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useDeleteComment(), {
      wrapper: Wrapper,
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync("comment-1");
      })
    ).rejects.toBeDefined();
  });
});
