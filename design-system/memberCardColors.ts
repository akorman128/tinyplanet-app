import type { ProfileThemeSettings } from "@/types/theme";

export const MEMBER_CARD_FALLBACK = {
  background: "#007EFF",
  font: "#FFFFFF",
} as const;

export interface MemberCardColors {
  background: string;
  font: string;
}

export const resolveMemberCardColors = (
  theme: ProfileThemeSettings | null | undefined
): MemberCardColors => ({
  background: theme?.backgroundColor ?? MEMBER_CARD_FALLBACK.background,
  font: theme?.fontColor ?? MEMBER_CARD_FALLBACK.font,
});
