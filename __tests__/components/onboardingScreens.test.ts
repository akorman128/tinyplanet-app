import { describe, it, expect } from "vitest";

import {
  ONBOARDING_SCREENS,
  PLEDGE_LABELS,
  ctaForIndex,
  lightsForIndex,
  isPledgeScreen,
  isLastIndex,
  isEnterEnabled,
  isAdvanceDisabled,
  maxReachableIndex,
  activeIndexFromOffset,
} from "@/components/onboarding/onboardingScreens";

describe("ONBOARDING_SCREENS", () => {
  it("has the five screens in flow order with reconciled copy", () => {
    expect(ONBOARDING_SCREENS).toHaveLength(5);
    expect(ONBOARDING_SCREENS.map((s) => s.id)).toEqual([
      "welcome",
      "vouched",
      "family",
      "location",
      "enter",
    ]);
    expect(ONBOARDING_SCREENS[0].title).toBe("Welcome to Tiny Planet.");
    expect(ONBOARDING_SCREENS[1].title).toBe("Someone vouched for you");
    expect(ONBOARDING_SCREENS[2].body).toBe(
      "That's the whole contract. If that's not your vibe, all good!"
    );
    expect(ONBOARDING_SCREENS[3].body).toBe(
      "Friends and mutuals can see where you are. Think of Tiny Planet as Find My Fam"
    );
  });

  it("puts the two pledges on the family and location screens", () => {
    expect(ONBOARDING_SCREENS[2].pledge).toBe("pledgeFamily");
    expect(ONBOARDING_SCREENS[3].pledge).toBe("pledgeLocation");
    expect(ONBOARDING_SCREENS[0].pledge).toBeUndefined();
    expect(PLEDGE_LABELS.pledgeFamily).toBe("I'll treat my planet like family");
    expect(PLEDGE_LABELS.pledgeLocation).toBe(
      "I'm cool with sharing my location"
    );
  });

  it("marks the final screen as the entry step with no pledge toggles", () => {
    const last = ONBOARDING_SCREENS[4];
    expect(last.final).toBe(true);
    expect(last.pledge).toBeUndefined();
    expect(last.cta).toBe("Accept & enter");
  });
});

describe("ctaForIndex", () => {
  it("reads Continue for info screens and Accept & enter for the last", () => {
    expect(ctaForIndex(0)).toBe("Continue");
    expect(ctaForIndex(3)).toBe("Continue");
    expect(ctaForIndex(4)).toBe("Accept & enter");
  });
});

describe("lightsForIndex", () => {
  it("grows the people-light count as the user advances", () => {
    expect([0, 1, 2, 3, 4].map(lightsForIndex)).toEqual([2, 4, 5, 5, 6]);
  });
});

describe("isPledgeScreen / isLastIndex", () => {
  it("identifies pledge screens and the final screen", () => {
    expect(isPledgeScreen(2)).toBe(true);
    expect(isPledgeScreen(3)).toBe(true);
    expect(isPledgeScreen(0)).toBe(false);
    expect(isPledgeScreen(4)).toBe(false);
    expect(isLastIndex(4)).toBe(true);
    expect(isLastIndex(3)).toBe(false);
  });
});

describe("isEnterEnabled", () => {
  it("requires both pledges", () => {
    expect(isEnterEnabled({ pledgeFamily: true, pledgeLocation: true })).toBe(
      true
    );
    expect(isEnterEnabled({ pledgeFamily: true, pledgeLocation: false })).toBe(
      false
    );
    expect(isEnterEnabled({ pledgeFamily: false, pledgeLocation: true })).toBe(
      false
    );
    expect(isEnterEnabled({ pledgeFamily: false, pledgeLocation: false })).toBe(
      false
    );
  });
});

describe("isAdvanceDisabled", () => {
  it("disables Continue on a Deal screen until its pledge is on", () => {
    const none = { pledgeFamily: false, pledgeLocation: false };
    expect(isAdvanceDisabled(0, none)).toBe(false);
    expect(isAdvanceDisabled(1, none)).toBe(false);
    expect(isAdvanceDisabled(2, none)).toBe(true);
    expect(
      isAdvanceDisabled(2, { pledgeFamily: true, pledgeLocation: false })
    ).toBe(false);
    expect(
      isAdvanceDisabled(3, { pledgeFamily: true, pledgeLocation: false })
    ).toBe(true);
    expect(
      isAdvanceDisabled(3, { pledgeFamily: true, pledgeLocation: true })
    ).toBe(false);
  });

  it("gates the final Accept & enter on both pledges", () => {
    expect(
      isAdvanceDisabled(4, { pledgeFamily: true, pledgeLocation: false })
    ).toBe(true);
    expect(
      isAdvanceDisabled(4, { pledgeFamily: true, pledgeLocation: true })
    ).toBe(false);
  });
});

describe("maxReachableIndex", () => {
  it("blocks progress past an un-toggled Deal screen", () => {
    expect(
      maxReachableIndex({ pledgeFamily: false, pledgeLocation: false })
    ).toBe(2);
    expect(
      maxReachableIndex({ pledgeFamily: true, pledgeLocation: false })
    ).toBe(3);
    expect(
      maxReachableIndex({ pledgeFamily: true, pledgeLocation: true })
    ).toBe(4);
  });

  it("does not unlock the second Deal screen from the first pledge alone", () => {
    expect(
      maxReachableIndex({ pledgeFamily: false, pledgeLocation: true })
    ).toBe(2);
  });
});

describe("activeIndexFromOffset", () => {
  const W = 390;
  it("rounds to the nearest panel", () => {
    expect(activeIndexFromOffset(0, W, 5)).toBe(0);
    expect(activeIndexFromOffset(W, W, 5)).toBe(1);
    expect(activeIndexFromOffset(W * 0.49, W, 5)).toBe(0);
    expect(activeIndexFromOffset(W * 0.51, W, 5)).toBe(1);
  });

  it("clamps within bounds", () => {
    expect(activeIndexFromOffset(-50, W, 5)).toBe(0);
    expect(activeIndexFromOffset(W * 99, W, 5)).toBe(4);
  });

  it("guards against a zero panel width", () => {
    expect(activeIndexFromOffset(100, 0, 5)).toBe(0);
  });
});
