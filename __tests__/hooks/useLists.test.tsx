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

const { useCreateList, useDeleteList, useGetLists, useGetListLocations } =
  await import("@/hooks/useLists");

describe("useCreateList", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("calls from('lists').insert() with PostGIS POINT", async () => {
    const listData = { id: "list-1", title: "My List" };
    mockSupabase.configureFrom("lists", { data: listData, error: null });
    mockSupabase.configureRpc("get_list_places_with_coordinates", {
      data: [],
      error: null,
    });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useCreateList(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        title: "My List",
        category: "food",
        location: { name: "NYC", latitude: 40.7, longitude: -74.0 },
      });
    });

    expect(mockSupabase.from).toHaveBeenCalledWith("lists");
    const chain = mockSupabase.getLastChain("lists");
    expect(chain?.insert).toHaveBeenCalledWith({
      user_id: "user-a",
      title: "My List",
      category: "food",
      location_name: "NYC",
      location: "POINT(-74 40.7)",
      note: null,
    });
    expect(chain?.select).toHaveBeenCalled();
    expect(chain?.single).toHaveBeenCalled();
  });
});

describe("useDeleteList", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("calls from('lists').delete() with correct filters", async () => {
    mockSupabase.configureFrom("lists", { data: {}, error: null });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useDeleteList(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync("list-1");
    });

    expect(mockSupabase.from).toHaveBeenCalledWith("lists");
    const chain = mockSupabase.getLastChain("lists");
    expect(chain?.delete).toHaveBeenCalled();
    expect(chain?.eq).toHaveBeenCalledWith("id", "list-1");
    expect(chain?.eq).toHaveBeenCalledWith("user_id", "user-a");
  });
});

describe("useGetLists", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("calls rpc('get_lists_with_places') with correct params", async () => {
    const listsData = [
      { id: "list-1", title: "List 1", places: [], total_count: 1 },
    ];
    mockSupabase.configureRpc("get_lists_with_places", {
      data: listsData,
      error: null,
    });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useGetLists(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockSupabase.rpc).toHaveBeenCalledWith("get_lists_with_places", {
      p_user_id: "user-a",
      p_limit: null,
      p_offset: 0,
    });
  });
});

describe("useGetListLocations", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("calls rpc('get_viewable_list_locations') with correct params", async () => {
    const locations = [
      {
        id: "list-1",
        title: "List 1",
        category: "food",
        location_name: "NYC",
        longitude: -74.0,
        latitude: 40.7,
        owner_name: "User A",
      },
    ];
    mockSupabase.configureRpc("get_viewable_list_locations", {
      data: locations,
      error: null,
    });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useGetListLocations(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockSupabase.rpc).toHaveBeenCalledWith(
      "get_viewable_list_locations",
      { p_user_id: "user-a" }
    );
    expect(result.current.data).toEqual([
      {
        id: "list-1",
        title: "List 1",
        category: "food",
        location_name: "NYC",
        location: { longitude: -74.0, latitude: 40.7 },
        owner_name: "User A",
      },
    ]);
  });
});
