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
  useProfileStore: () => ({ profileState: { id: "user-a" } }),
}));

const { useCreateContact, useUpdateContact, useGetContacts, useDeleteContact } =
  await import("@/hooks/useContacts");

describe("useCreateContact", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("calls from('contacts').insert() with correct data", async () => {
    const contactData = { id: "contact-1", name: "John Doe" };
    mockSupabase.configureFrom("contacts", { data: contactData, error: null });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useCreateContact(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        name: "John Doe",
        phone: "+1234567890",
        email: "john@example.com",
      });
    });

    expect(mockSupabase.from).toHaveBeenCalledWith("contacts");
    const chain = mockSupabase.getLastChain("contacts");
    expect(chain?.insert).toHaveBeenCalledWith({
      user_id: "user-a",
      name: "John Doe",
      phone: "+1234567890",
      email: "john@example.com",
      company: null,
      note: null,
      location: null,
      location_name: null,
    });
    expect(chain?.select).toHaveBeenCalled();
    expect(chain?.single).toHaveBeenCalled();
  });
});

describe("useUpdateContact", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("updates only the provided fields, scoped by id + owner", async () => {
    mockSupabase.configureFrom("contacts", {
      data: { id: "contact-1", name: "Jane" },
      error: null,
    });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useUpdateContact(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        contact_id: "contact-1",
        name: "Jane",
        phone: "",
      });
    });

    const chain = mockSupabase.getLastChain("contacts");
    expect(chain?.update).toHaveBeenCalledWith({ name: "Jane", phone: null });
    expect(chain?.eq).toHaveBeenCalledWith("id", "contact-1");
    expect(chain?.eq).toHaveBeenCalledWith("user_id", "user-a");
    expect(chain?.select).toHaveBeenCalled();
    expect(chain?.single).toHaveBeenCalled();
  });

  it("sets a new location as a POINT with its name", async () => {
    mockSupabase.configureFrom("contacts", {
      data: { id: "contact-1" },
      error: null,
    });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useUpdateContact(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        contact_id: "contact-1",
        location: { latitude: 40.5, longitude: -73.9, name: "Brooklyn, NY" },
      });
    });

    const chain = mockSupabase.getLastChain("contacts");
    expect(chain?.update).toHaveBeenCalledWith({
      location: "POINT(-73.9 40.5)",
      location_name: "Brooklyn, NY",
    });
  });

  it("clears the location when location is null", async () => {
    mockSupabase.configureFrom("contacts", {
      data: { id: "contact-1" },
      error: null,
    });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useUpdateContact(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        contact_id: "contact-1",
        location: null,
      });
    });

    const chain = mockSupabase.getLastChain("contacts");
    expect(chain?.update).toHaveBeenCalledWith({
      location: null,
      location_name: null,
    });
  });

  it("leaves the location untouched when omitted", async () => {
    mockSupabase.configureFrom("contacts", {
      data: { id: "contact-1" },
      error: null,
    });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useUpdateContact(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        contact_id: "contact-1",
        note: "Met at the conference",
      });
    });

    const chain = mockSupabase.getLastChain("contacts");
    expect(chain?.update).toHaveBeenCalledWith({
      note: "Met at the conference",
    });
  });
});

describe("useGetContacts", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("calls rpc('get_contacts_ordered') with correct params", async () => {
    const contacts = [{ id: "contact-1", name: "John" }];
    mockSupabase.configureRpc("get_contacts_ordered", {
      data: contacts,
      error: null,
    });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useGetContacts(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockSupabase.rpc).toHaveBeenCalledWith("get_contacts_ordered", {
      p_user_id: "user-a",
    });
    expect(result.current.data).toEqual({ data: contacts, total: 1 });
  });
});

describe("useDeleteContact", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("calls from('contacts').delete() with correct filters", async () => {
    mockSupabase.configureFrom("contacts", { data: {}, error: null });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useDeleteContact(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync("contact-1");
    });

    expect(mockSupabase.from).toHaveBeenCalledWith("contacts");
    const chain = mockSupabase.getLastChain("contacts");
    expect(chain?.delete).toHaveBeenCalled();
    expect(chain?.eq).toHaveBeenCalledWith("id", "contact-1");
    expect(chain?.eq).toHaveBeenCalledWith("user_id", "user-a");
  });
});
