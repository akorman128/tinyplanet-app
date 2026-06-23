import { describe, it, expect } from "vitest";
import { friendRequestRecipient } from "../../supabase/functions/_shared/recipients";

describe("friendRequestRecipient", () => {
  it("returns user_b when user_a is the requester", () => {
    expect(
      friendRequestRecipient({ user_a: "a", user_b: "b", requested_by: "a" })
    ).toBe("b");
  });
  it("returns user_a when user_b is the requester", () => {
    expect(
      friendRequestRecipient({ user_a: "a", user_b: "b", requested_by: "b" })
    ).toBe("a");
  });
});
