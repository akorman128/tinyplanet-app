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

const {
  useSendFriendRequest,
  useGetFriends,
  useSearchFriends,
  useGetPlatformStatistics,
  useAcceptFriendRequest,
} = await import("@/hooks/useFriends");

describe("useSendFriendRequest", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("inserts a friendship row", async () => {
    const insertedRow = { id: "f1", user_a: "user-a", user_b: "user-b", status: "pending" };
    mockSupabase.configureFrom("friendships", { data: insertedRow, error: null });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useSendFriendRequest(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ targetUserId: "user-b" });
    });

    const chain = mockSupabase.getLastChain("friendships");
    expect(chain?.insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_a: "user-a", user_b: "user-b", status: "pending" })
    );
  });

  it("rejects self-friend request", async () => {
    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useSendFriendRequest(), { wrapper: Wrapper });

    await expect(
      act(async () => {
        await result.current.mutateAsync({ targetUserId: "user-a" });
      })
    ).rejects.toThrow("yourself");
  });
});

describe("useGetFriends", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("fetches and transforms friendships", async () => {
    mockSupabase.configureFrom("friendships", {
      data: [
        {
          id: "f1",
          user_a: "user-a",
          user_b: "user-b",
          status: "accepted",
          a: { id: "user-a", full_name: "User A", avatar_url: "", website: "", hometown: "", birthday: "", location: "" },
          b: { id: "user-b", full_name: "User B", avatar_url: "", website: "", hometown: "", birthday: "", location: "" },
        },
      ],
      error: null,
    });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useGetFriends(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(1);
    expect(result.current.data?.data[0].id).toBe("user-b");
  });
});

describe("useSearchFriends", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("calls RPC with correct params", async () => {
    mockSupabase.configureRpc("search_friends", {
      data: [{ id: "user-b", full_name: "User B", avatar_url: "", website: "", hometown: "" }],
      error: null,
    });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useSearchFriends("Bob"), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockSupabase.rpc).toHaveBeenCalledWith("search_friends", {
      p_user_id: "user-a",
      p_query: "Bob",
    });
  });

  it("is disabled with empty query", () => {
    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useSearchFriends(""), { wrapper: Wrapper });

    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useGetPlatformStatistics", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("calls RPC and returns stats", async () => {
    mockSupabase.configureRpc("get_platform_statistics", {
      data: [{ total_users: 100, connections_count: 50 }],
      error: null,
    });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useGetPlatformStatistics(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockSupabase.rpc).toHaveBeenCalledWith("get_platform_statistics", { p_user_id: "user-a" });
    expect(result.current.data?.data).toEqual({ total_users: 100, connections_count: 50 });
  });
});

describe("useAcceptFriendRequest", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("updates friendship status to accepted", async () => {
    const acceptedRow = { id: "f1", user_a: "user-a", user_b: "user-b", status: "accepted" };
    mockSupabase.configureFrom("friendships", { data: acceptedRow, error: null });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useAcceptFriendRequest(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ fromUserId: "user-b" });
    });

    const chain = mockSupabase.getLastChain("friendships");
    expect(chain?.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "accepted" })
    );
  });
});
