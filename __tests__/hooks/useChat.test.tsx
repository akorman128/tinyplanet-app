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

const { useSendMessage, useDeleteMessage } = await import("@/hooks/useChat");

describe("useSendMessage", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("inserts message via from('messages')", async () => {
    const messageRow = { id: "m1", text: "Hello", sender_id: "user-a" };
    mockSupabase.configureFrom("messages", { data: messageRow, error: null });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useSendMessage(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ friendId: "user-b", text: "Hello" });
    });

    expect(mockSupabase.from).toHaveBeenCalledWith("messages");
    const chain = mockSupabase.getLastChain("messages");
    expect(chain?.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id_a: "user-a",
        user_id_b: "user-b",
        sender_id: "user-a",
        text: "Hello",
      })
    );
  });
});

describe("useDeleteMessage", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("soft-deletes by updating deleted_at", async () => {
    mockSupabase.configureFrom("messages", { data: null, error: null });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useDeleteMessage(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({ messageId: "m1" });
    });

    const chain = mockSupabase.getLastChain("messages");
    expect(chain?.update).toHaveBeenCalledWith(
      expect.objectContaining({ deleted_at: expect.any(String) })
    );
    expect(chain?.eq).toHaveBeenCalledWith("id", "m1");
  });
});
