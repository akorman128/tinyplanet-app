import { describe, it, expect } from "vitest";
import { formatMemberSince } from "@/utils/formatMemberSince";

describe("formatMemberSince", () => {
  it("formats an ISO timestamp as 'Mon YYYY'", () => {
    // Mid-month, midday UTC so no timezone can shift the month.
    expect(formatMemberSince("2026-01-14T12:00:00Z")).toBe("Jan 2026");
  });

  it("returns null for missing or invalid input", () => {
    expect(formatMemberSince(undefined)).toBeNull();
    expect(formatMemberSince(null)).toBeNull();
    expect(formatMemberSince("not-a-date")).toBeNull();
  });
});
