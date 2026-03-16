import { renderHook, waitFor } from "@testing-library/react";
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

const { useGetMessageChannels, useHasUnreadMessages } = await import(
  "@/hooks/useMessageChannels"
);

describe("useGetMessageChannels", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("calls RPC get_message_channels with p_user_id", async () => {
    mockSupabase.configureRpc("get_message_channels", {
      data: [{ friend_id: "user-b", last_message: "Hi" }],
      error: null,
    });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useGetMessageChannels(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockSupabase.rpc).toHaveBeenCalledWith("get_message_channels", {
      p_user_id: "user-a",
    });
    expect(result.current.data?.data).toHaveLength(1);
  });
});

describe("useHasUnreadMessages", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("calls RPC has_unread_messages", async () => {
    mockSupabase.configureRpc("has_unread_messages", { data: true, error: null });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useHasUnreadMessages(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockSupabase.rpc).toHaveBeenCalledWith("has_unread_messages", {
      p_user_id: "user-a",
    });
    expect(result.current.data).toBe(true);
  });
});
