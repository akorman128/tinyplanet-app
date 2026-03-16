import { renderHook, waitFor, act } from "@testing-library/react";
import { createMockSupabase, MockSupabaseClient } from "../utils/mock-supabase";
import { createTestWrapper } from "../utils/test-wrapper";

let mockSupabase: MockSupabaseClient;
let mockProfileState: { id: string; full_name?: string } | null = { id: "user-a" };
const mockSetProfileState = vi.fn();

vi.mock("@/hooks/useSupabase", () => ({
  useSupabase: () => ({ supabase: mockSupabase, isLoaded: true, session: {} }),
}));

vi.mock("@/hooks/useRequireProfile", () => ({
  useRequireProfile: () => ({ id: "user-a", full_name: "User A", avatar_url: "" }),
}));

vi.mock("@/stores/profileStore", () => ({
  useProfileStore: () => ({
    profileState: mockProfileState,
    setProfileState: mockSetProfileState,
  }),
}));

const { useGetProfile, useCreateProfile, useUpdateProfile } = await import(
  "@/hooks/useProfile"
);

describe("useGetProfile", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
    mockProfileState = { id: "user-a" };
    mockSetProfileState.mockClear();
  });

  it("calls rpc('get_profile') with user ID", async () => {
    const profileData = [{ id: "user-b", full_name: "User B" }];
    mockSupabase.configureRpc("get_profile", { data: profileData, error: null });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useGetProfile("user-b"), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockSupabase.rpc).toHaveBeenCalledWith("get_profile", {
      p_user_id: "user-b",
      p_current_user_id: "user-a",
    });
    expect(result.current.data).toEqual(profileData[0]);
  });
});

describe("useCreateProfile", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
    mockProfileState = { id: "user-a" };
    mockSetProfileState.mockClear();
  });

  it("calls from('profiles').insert() with correct data", async () => {
    const createdProfile = { id: "new-user", full_name: "New User" };
    mockSupabase.configureFrom("profiles", { data: createdProfile, error: null });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useCreateProfile(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: "new-user",
        phone_number: "+1234567890",
        full_name: "New User",
        hometown: "NYC",
        birthday: "2000-01-01",
      });
    });

    expect(mockSupabase.from).toHaveBeenCalledWith("profiles");
    const chain = mockSupabase.getLastChain("profiles");
    expect(chain?.insert).toHaveBeenCalledWith({
      id: "new-user",
      phone_number: "+1234567890",
      full_name: "New User",
      avatar_url: "",
      website: "",
      hometown: "NYC",
      birthday: "2000-01-01",
      location: null,
      hometown_location: null,
      invited_by: undefined,
    });
    expect(chain?.select).toHaveBeenCalled();
    expect(chain?.single).toHaveBeenCalled();
  });
});

describe("useUpdateProfile", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
    mockProfileState = { id: "user-a" };
    mockSetProfileState.mockClear();
  });

  it("calls from('profiles').update() with correct data", async () => {
    const updatedProfile = { id: "user-a", full_name: "Updated Name" };
    mockSupabase.configureFrom("profiles", { data: updatedProfile, error: null });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        updateData: { full_name: "Updated Name" },
      });
    });

    expect(mockSupabase.from).toHaveBeenCalledWith("profiles");
    const chain = mockSupabase.getLastChain("profiles");
    expect(chain?.update).toHaveBeenCalledWith(
      expect.objectContaining({ full_name: "Updated Name" })
    );
    expect(chain?.eq).toHaveBeenCalledWith("id", "user-a");
    expect(chain?.select).toHaveBeenCalled();
    expect(chain?.single).toHaveBeenCalled();
  });
});
