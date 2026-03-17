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
  useProfileStore: () => ({
    profileState: { id: "user-a", full_name: "User A" },
  }),
}));

vi.mock("@/utils/inviteCode", () => ({
  generateInviteCode: () => "GENERATED123",
}));

const { useCreateInviteCode, useGetInviteCodes, useSendInviteCode } =
  await import("@/hooks/useInviteCodes");

describe("useCreateInviteCode", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("calls from('invite_codes').insert() with provided code", async () => {
    const inviteData = { id: "inv-1", code: "MYCODE" };
    mockSupabase.configureFrom("invite_codes", {
      data: inviteData,
      error: null,
    });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useCreateInviteCode(), {
      wrapper: Wrapper,
    });

    const expiresAt = new Date("2026-12-31");

    await act(async () => {
      await result.current.mutateAsync({
        code: "MYCODE",
        expires_at: expiresAt,
      });
    });

    expect(mockSupabase.from).toHaveBeenCalledWith("invite_codes");
    const chain = mockSupabase.getLastChain("invite_codes");
    expect(chain?.insert).toHaveBeenCalledWith({
      code: "MYCODE",
      inviter_id: "user-a",
      status: "active",
      expires_at: expiresAt,
    });
    expect(chain?.select).toHaveBeenCalled();
    expect(chain?.single).toHaveBeenCalled();
  });
});

describe("useGetInviteCodes", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("queries invite_codes table via fetchInviteCodes", async () => {
    const codes = [{ id: "inv-1", code: "ABC123" }];
    mockSupabase.configureFrom("invite_codes", { data: codes, error: null });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useGetInviteCodes(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockSupabase.from).toHaveBeenCalledWith("invite_codes");
    const chain = mockSupabase.getLastChain("invite_codes");
    expect(chain?.select).toHaveBeenCalledWith("*");
    expect(chain?.eq).toHaveBeenCalledWith("status", "active");
    expect(chain?.order).toHaveBeenCalledWith("created_at", {
      ascending: false,
    });
  });
});

describe("useSendInviteCode", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("calls functions.invoke('send-invite-sms') with correct body", async () => {
    mockSupabase.functions.invoke = vi.fn().mockResolvedValue({
      data: { success: true, message: "Sent!", messageSid: "SM123" },
      error: null,
    });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useSendInviteCode(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        phone_number: "+1234567890",
        invite_code: "MYCODE",
      });
    });

    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
      "send-invite-sms",
      {
        body: {
          phone_number: "+1234567890",
          invite_code: "MYCODE",
          inviter_name: "User A",
        },
      }
    );
  });
});
