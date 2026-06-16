import { describe, it, expect } from "vitest";
import {
  resolveMemberCardColors,
  MEMBER_CARD_FALLBACK,
} from "@/design-system/memberCardColors";

describe("resolveMemberCardColors", () => {
  it("uses the theme colors when present", () => {
    expect(
      resolveMemberCardColors({
        backgroundColor: "#CC5500",
        fontColor: "#FFFFFF",
        fontFamily: null,
        emojiBorder: null,
      })
    ).toEqual({ background: "#CC5500", font: "#FFFFFF" });
  });

  it("falls back to #007EFF/#FFFFFF when theme is null", () => {
    expect(resolveMemberCardColors(null)).toEqual({
      background: MEMBER_CARD_FALLBACK.background,
      font: MEMBER_CARD_FALLBACK.font,
    });
  });

  it("falls back per-field when individual colors are null", () => {
    expect(
      resolveMemberCardColors({
        backgroundColor: null,
        fontColor: null,
        fontFamily: null,
        emojiBorder: null,
      })
    ).toEqual({ background: "#007EFF", font: "#FFFFFF" });
  });
});
