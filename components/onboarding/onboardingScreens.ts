/**
 * Pure data + logic for the sign-up onboarding flow.
 *
 * Kept free of React Native so it can be unit-tested directly. The screen
 * component (`app/(public)/sign-up/onboarding.tsx`) renders these and drives
 * the swipe pager; gating is end-only (see the spec at
 * docs/superpowers/specs/2026-06-16-onboarding-flow-design.md).
 */

export type PledgeKey = "pledgeFamily" | "pledgeLocation";

export interface Consents {
  pledgeFamily: boolean;
  pledgeLocation: boolean;
}

export interface OnboardingScreen {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  lights: number;
  pledge?: PledgeKey;
  final?: boolean;
  cta: string;
}

export const PLEDGE_LABELS: Record<PledgeKey, string> = {
  pledgeFamily: "I'll treat my planet like family",
  pledgeLocation: "I'm cool with sharing my location",
};

export const ONBOARDING_SCREENS: OnboardingScreen[] = [
  {
    id: "welcome",
    eyebrow: "You've been invited",
    title: "Welcome to Tiny Planet.",
    body: "A world for your favorite people's favorite people — the friends who are family.",
    lights: 2,
    cta: "Continue",
  },
  {
    id: "vouched",
    eyebrow: "How you got here",
    title: "Someone vouched for you",
    body: "Everyone here was invited by someone who loves them. The idea is that good people know good people.",
    lights: 4,
    cta: "Continue",
  },
  {
    id: "family",
    eyebrow: "The deal · 1 of 2",
    title: "Treat your planet like family.",
    body: "That's the whole contract. If that's not your vibe, all good!",
    lights: 5,
    pledge: "pledgeFamily",
    cta: "Continue",
  },
  {
    id: "location",
    eyebrow: "The deal · 2 of 2",
    title: "Heads up! Your location is part of it.",
    body: "Friends and mutuals can see where you are. Think of Tiny Planet as Find My Fam",
    lights: 5,
    pledge: "pledgeLocation",
    cta: "Continue",
  },
  {
    id: "enter",
    eyebrow: "Welcome",
    title: "Welcome to the planet",
    body: "We're happy you're here ☺️",
    lights: 6,
    final: true,
    cta: "Accept & enter",
  },
];

export function ctaForIndex(index: number): string {
  return ONBOARDING_SCREENS[index]?.cta ?? "Continue";
}

export function lightsForIndex(index: number): number {
  return ONBOARDING_SCREENS[index]?.lights ?? 0;
}

export function isPledgeScreen(index: number): boolean {
  return Boolean(ONBOARDING_SCREENS[index]?.pledge);
}

export function isLastIndex(index: number): boolean {
  return index === ONBOARDING_SCREENS.length - 1;
}

export function isEnterEnabled(consents: Consents): boolean {
  return consents.pledgeFamily && consents.pledgeLocation;
}

/**
 * Whether the forward action (Continue / Accept & enter) is blocked on a given
 * screen: a Deal screen gates on its own pledge, the final screen on both.
 */
export function isAdvanceDisabled(index: number, consents: Consents): boolean {
  const screen = ONBOARDING_SCREENS[index];
  if (!screen) return false;
  if (screen.final) return !isEnterEnabled(consents);
  if (screen.pledge) return !consents[screen.pledge];
  return false;
}

/**
 * Furthest panel the user may reach given current consents — they can sit on an
 * un-toggled Deal screen but cannot pass it until its pledge is on. Used to clamp
 * forward swipes so the gate can't be bypassed.
 */
export function maxReachableIndex(consents: Consents): number {
  for (let i = 0; i < ONBOARDING_SCREENS.length; i++) {
    const pledge = ONBOARDING_SCREENS[i].pledge;
    if (pledge && !consents[pledge]) return i;
  }
  return ONBOARDING_SCREENS.length - 1;
}

/**
 * Nearest panel index for a horizontal scroll offset, clamped to [0, count-1].
 * Guards against a zero panel width (measured before layout).
 */
export function activeIndexFromOffset(
  offsetX: number,
  panelWidth: number,
  count: number
): number {
  if (panelWidth <= 0) return 0;
  const raw = Math.round(offsetX / panelWidth);
  return Math.max(0, Math.min(count - 1, raw));
}
