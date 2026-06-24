import { adminClient } from "../utils/supabase-test-client";
import { authedClientFor } from "../utils/auth-helpers";
import { expectAuthzRejected } from "../utils/authz-helpers";
import {
  createTestUser,
  createFriendship,
  createTestContact,
  cleanupTestData,
  TestUser,
} from "../utils/seed";

describe("get_contacts_ordered RPC", () => {
  let user: TestUser;

  beforeAll(async () => {
    user = await createTestUser({ full_name: "Contacts Owner" });

    // Create contacts at different latitudes (north to south)
    await createTestContact(user.id, {
      name: "Helsinki Contact",
      location_lat: 60.1699,
      location_lng: 24.9384,
      location_name: "Helsinki, Finland",
    });
    await createTestContact(user.id, {
      name: "New York Contact",
      location_lat: 40.7128,
      location_lng: -74.006,
      location_name: "New York, USA",
    });
    await createTestContact(user.id, {
      name: "Miami Contact",
      location_lat: 25.7617,
      location_lng: -80.1918,
      location_name: "Miami, USA",
    });
    // Contact with no location
    await createTestContact(user.id, {
      name: "No Location Contact",
    });
  });

  afterAll(async () => {
    await cleanupTestData([user.id]);
  });

  it("returns contacts ordered by latitude (north to south)", async () => {
    const client = await authedClientFor(user.email);
    const { data, error } = await client.rpc("get_contacts_ordered", {
      p_user_id: user.id,
    });
    expect(error).toBeNull();
    expect(data).toHaveLength(4);

    // First 3 should be ordered by latitude DESC (north to south)
    expect(data[0].name).toBe("Helsinki Contact");
    expect(data[0].latitude).toBeCloseTo(60.1699, 2);
    expect(data[0].longitude).toBeCloseTo(24.9384, 2);

    expect(data[1].name).toBe("New York Contact");
    expect(data[1].latitude).toBeCloseTo(40.7128, 2);

    expect(data[2].name).toBe("Miami Contact");
    expect(data[2].latitude).toBeCloseTo(25.7617, 2);
  });

  it("includes contacts without locations (sorted last)", async () => {
    const client = await authedClientFor(user.email);
    const { data, error } = await client.rpc("get_contacts_ordered", {
      p_user_id: user.id,
    });
    expect(error).toBeNull();

    // NULLS LAST means no-location contact is at the end
    const last = data[data.length - 1];
    expect(last.name).toBe("No Location Contact");
    expect(last.latitude).toBeNull();
    expect(last.longitude).toBeNull();
  });

  it("returns empty for user with no contacts", async () => {
    const noContactsUser = await createTestUser({
      full_name: "No Contacts User",
    });
    try {
      const client = await authedClientFor(noContactsUser.email);
      const { data, error } = await client.rpc("get_contacts_ordered", {
        p_user_id: noContactsUser.id,
      });
      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    } finally {
      await cleanupTestData([noContactsUser.id]);
    }
  });
});

describe("get_contacts_ordered cross-user visibility", () => {
  // owner — friend (direct) — mutual (friend-of-friend of owner); stranger has
  // no connection to owner.
  let owner: TestUser;
  let friend: TestUser;
  let mutual: TestUser;
  let stranger: TestUser;

  beforeAll(async () => {
    owner = await createTestUser({ full_name: "Contacts Owner X" });
    friend = await createTestUser({ full_name: "Contacts Direct Friend" });
    mutual = await createTestUser({ full_name: "Contacts Mutual" });
    stranger = await createTestUser({ full_name: "Contacts Stranger" });

    await createFriendship(owner.id, friend.id);
    await createFriendship(friend.id, mutual.id);

    await createTestContact(owner.id, {
      name: "Owner's Contact",
      location_lat: 40.7128,
      location_lng: -74.006,
      location_name: "New York, USA",
    });
  });

  afterAll(async () => {
    await cleanupTestData([owner.id, friend.id, mutual.id, stranger.id]);
  });

  it("lets a direct friend view the owner's contacts", async () => {
    const client = await authedClientFor(friend.email);
    const { data, error } = await client.rpc("get_contacts_ordered", {
      p_user_id: owner.id,
    });
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe("Owner's Contact");
  });

  it("lets a mutual (friend-of-friend) view the owner's contacts", async () => {
    const client = await authedClientFor(mutual.email);
    const { data, error } = await client.rpc("get_contacts_ordered", {
      p_user_id: owner.id,
    });
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    // Prove the rows belong to the owner, not the viewer (guards against a
    // body that filters on auth.uid() instead of p_user_id).
    expect(data[0].user_id).toBe(owner.id);
    expect(data[0].name).toBe("Owner's Contact");
  });

  it("rejects an unconnected stranger", async () => {
    const client = await authedClientFor(stranger.email);
    const result = await client.rpc("get_contacts_ordered", {
      p_user_id: owner.id,
    });
    expectAuthzRejected(result);
  });

  it("rejects a mutual the owner has blocked", async () => {
    await adminClient
      .from("blocks")
      .insert({ blocker_id: owner.id, blocked_id: mutual.id });
    try {
      const client = await authedClientFor(mutual.email);
      const result = await client.rpc("get_contacts_ordered", {
        p_user_id: owner.id,
      });
      expectAuthzRejected(result);
    } finally {
      await adminClient
        .from("blocks")
        .delete()
        .eq("blocker_id", owner.id)
        .eq("blocked_id", mutual.id);
    }
  });

  // The contact-detail screen reads the contacts table directly (RLS), so that
  // path must agree with the summary RPC.
  it("lets a mutual read the owner's contacts via direct table query (RLS)", async () => {
    const client = await authedClientFor(mutual.email);
    const { data, error } = await client
      .from("contacts")
      .select("id, name")
      .eq("user_id", owner.id);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0].name).toBe("Owner's Contact");
  });

  it("hides the owner's contacts from a stranger's direct table query (RLS)", async () => {
    const client = await authedClientFor(stranger.email);
    const { data, error } = await client
      .from("contacts")
      .select("id")
      .eq("user_id", owner.id);
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });
});
