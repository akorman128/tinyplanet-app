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

const { useSendMessage, useDeleteMessage, useSubscribeToMessages } =
  await import("@/hooks/useChat");

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

describe("useSubscribeToMessages", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("subscribes to INSERTs on the ordered conversation channel", () => {
    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useSubscribeToMessages(), {
      wrapper: Wrapper,
    });

    result.current("user-b", vi.fn());

    expect(mockSupabase.channel).toHaveBeenCalledWith("chat:user-a:user-b");
    const channel = mockSupabase.channel.mock.results[0].value;
    expect(channel.on).toHaveBeenCalledWith(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: "user_id_a=eq.user-a,user_id_b=eq.user-b",
      },
      expect.any(Function)
    );
    expect(channel.subscribe).toHaveBeenCalled();
  });

  it("invokes onMessage with the inserted row when an event fires", () => {
    const onMessage = vi.fn();
    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useSubscribeToMessages(), {
      wrapper: Wrapper,
    });

    result.current("user-b", onMessage);

    const channel = mockSupabase.channel.mock.results[0].value;
    const handler = channel.on.mock.calls[0][2];
    const newRow = { id: "m1", text: "Hi", sender_id: "user-b" };
    handler({ new: newRow });

    expect(onMessage).toHaveBeenCalledWith(newRow);
  });

  it("removes the channel on cleanup", () => {
    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useSubscribeToMessages(), {
      wrapper: Wrapper,
    });

    const unsubscribe = result.current("user-b", vi.fn());
    const channel = mockSupabase.channel.mock.results[0].value;
    unsubscribe();

    expect(mockSupabase.removeChannel).toHaveBeenCalledWith(channel);
  });
});
