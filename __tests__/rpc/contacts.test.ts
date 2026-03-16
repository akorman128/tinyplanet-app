import { adminClient } from "../utils/supabase-test-client";
import {
  createTestUser,
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
    const { data, error } = await adminClient.rpc("get_contacts_ordered", {
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
    const { data, error } = await adminClient.rpc("get_contacts_ordered", {
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
      const { data, error } = await adminClient.rpc("get_contacts_ordered", {
        p_user_id: noContactsUser.id,
      });
      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    } finally {
      await cleanupTestData([noContactsUser.id]);
    }
  });
});
