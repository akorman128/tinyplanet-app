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

const {
  useCreateHang,
  useGetHangDetail,
  useGetHangLocations,
  useRsvpToHang,
  useRemoveHangRsvp,
} = await import("@/hooks/useHangs");

const inOneDay = () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

describe("useCreateHang", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("calls rpc('create_hang_with_post') with mapped args", async () => {
    const startsAt = inOneDay();
    mockSupabase.configureRpc("create_hang_with_post", {
      data: [
        { hang_id: "h1", post_id: "p1", title: "Picnic", starts_at: startsAt },
      ],
      error: null,
    });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useCreateHang(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        title: "  Picnic  ",
        description: " Bring snacks ",
        location: { name: "Dolores Park", latitude: 37.76, longitude: -122.42 },
        starts_at: startsAt,
      });
    });

    expect(mockSupabase.rpc).toHaveBeenCalledWith("create_hang_with_post", {
      p_user_id: "user-a",
      p_location_lng: -122.42,
      p_location_lat: 37.76,
      p_location_name: "Dolores Park",
      p_title: "Picnic",
      p_description: "Bring snacks",
      p_starts_at: startsAt,
      p_post_visibility: "mutuals",
    });
  });

  it("rejects a start time more than 7 days out before calling the RPC", async () => {
    const tooFar = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString();

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useCreateHang(), { wrapper: Wrapper });

    await expect(
      result.current.mutateAsync({
        title: "Too far",
        location: { name: "X", latitude: 1, longitude: 2 },
        starts_at: tooFar,
      })
    ).rejects.toThrow(/7 days/);

    expect(mockSupabase.rpc).not.toHaveBeenCalled();
  });

  it("rejects a start time in the past before calling the RPC", async () => {
    const past = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useCreateHang(), { wrapper: Wrapper });

    await expect(
      result.current.mutateAsync({
        title: "Past",
        location: { name: "X", latitude: 1, longitude: 2 },
        starts_at: past,
      })
    ).rejects.toThrow(/past/);

    expect(mockSupabase.rpc).not.toHaveBeenCalled();
  });
});

describe("useGetHangDetail", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("calls rpc('get_hang_detail') and returns the first row", async () => {
    const detail = { id: "h1", title: "Picnic", attendee_count: 2 };
    mockSupabase.configureRpc("get_hang_detail", {
      data: [detail],
      error: null,
    });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useGetHangDetail("h1"), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockSupabase.rpc).toHaveBeenCalledWith("get_hang_detail", {
      p_hang_id: "h1",
    });
    expect(result.current.data).toEqual(detail);
  });

  it("is disabled (no RPC) without a hangId", async () => {
    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useGetHangDetail(undefined), {
      wrapper: Wrapper,
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockSupabase.rpc).not.toHaveBeenCalled();
  });
});

describe("useGetHangLocations", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("calls rpc('get_active_hang_locations') with the user id", async () => {
    mockSupabase.configureRpc("get_active_hang_locations", {
      data: [],
      error: null,
    });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useGetHangLocations(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockSupabase.rpc).toHaveBeenCalledWith("get_active_hang_locations", {
      p_user_id: "user-a",
    });
  });
});

describe("useRsvpToHang / useRemoveHangRsvp", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("inserts the viewer into hang_attendees", async () => {
    mockSupabase.configureFrom("hang_attendees", { data: {}, error: null });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useRsvpToHang(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync("h1");
    });

    expect(mockSupabase.from).toHaveBeenCalledWith("hang_attendees");
    const chain = mockSupabase.getLastChain("hang_attendees");
    expect(chain?.insert).toHaveBeenCalledWith({
      hang_id: "h1",
      user_id: "user-a",
      status: "going",
    });
  });

  it("deletes the viewer's RSVP with the correct filters", async () => {
    mockSupabase.configureFrom("hang_attendees", { data: {}, error: null });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useRemoveHangRsvp(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync("h1");
    });

    const chain = mockSupabase.getLastChain("hang_attendees");
    expect(chain?.delete).toHaveBeenCalled();
    expect(chain?.eq).toHaveBeenCalledWith("hang_id", "h1");
    expect(chain?.eq).toHaveBeenCalledWith("user_id", "user-a");
  });
});
