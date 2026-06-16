# Shake-to-reveal Member Card — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A signed-in user shakes their phone and a member card — themed in their colors, with an animated starfield — flies in over a blurred backdrop; they flick it away or tap to dismiss.

**Architecture:** Pure, unit-tested logic (shake detection, date formatting, color resolution) lives in dependency-free modules. A thin `useShakeDetection` hook wires `expo-sensors` to the detector. Presentational components (`MemberCardStarfield`, `MemberCard`) are driven by Reanimated. `MemberCardOverlay` owns visible/cooldown state, the blur backdrop, the flick gesture, and the reveal animation; it's mounted once as a sibling of the protected `<Stack>` so it's only live when signed in.

**Tech Stack:** React Native, Expo, expo-sensors (new), react-native-reanimated v4, react-native-gesture-handler, react-native-svg, expo-blur, expo-haptics, Vitest (jsdom).

---

## File Structure

**Pure logic (no RN/expo imports → unit-tested in Vitest/jsdom):**
- `utils/formatMemberSince.ts` — format `created_at` → `"Jan 2026"`.
- `design-system/memberCardColors.ts` — resolve theme → `{ background, font }` with `#007EFF`/`#FFFFFF` fallback.
- `hooks/shakeDetector.ts` — `ShakeDetector` class: pure accelerometer-sample → shake decision.

**Wiring & visuals (verified by typecheck + manual device run):**
- `hooks/useShakeDetection.ts` — subscribes `expo-sensors` Accelerometer, feeds the detector, calls `onShake`.
- `design-system/MemberCardStarfield.tsx` — stars, planet (SVG radial gradient), orbits, moon, shooting star.
- `design-system/MemberCard.tsx` — the card chrome + fields, with the starfield behind.
- `design-system/MemberCardOverlay.tsx` — global overlay: state, blur, gesture, reveal, haptics, DEV trigger.

**Integration:**
- `app/(protected)/_layout.tsx` — mount `<MemberCardOverlay />` as a sibling of `<Stack>`.
- `design-system/index.ts` — export `MemberCardOverlay`.
- `__tests__/setup.ts` — add an `expo-sensors` mock (only if a hook test is added; logic tests don't need it).

**Tests:**
- `__tests__/utils/formatMemberSince.test.ts`
- `__tests__/design-system/memberCardColors.test.ts`
- `__tests__/hooks/shakeDetector.test.ts`

---

## Task 1: Install expo-sensors

**Files:** `package.json` (via installer)

- [ ] **Step 1: Install the dependency (Expo-pinned version)**

Run: `npx expo install expo-sensors`
Expected: `expo-sensors` added to `package.json` dependencies; no peer-dep errors.

- [ ] **Step 2: Verify it resolves**

Run: `node -e "require.resolve('expo-sensors'); console.log('ok')"`
Expected: prints `ok`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "build: add expo-sensors for shake detection"
```

---

## Task 2: `formatMemberSince` (pure, TDD)

**Files:**
- Create: `utils/formatMemberSince.ts`
- Modify: `utils/index.ts` (add barrel export)
- Test: `__tests__/utils/formatMemberSince.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/utils/formatMemberSince.test.ts
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
```

- [ ] **Step 2: Run it; verify it fails**

Run: `npx vitest run __tests__/utils/formatMemberSince.test.ts`
Expected: FAIL — cannot resolve `@/utils/formatMemberSince`.

- [ ] **Step 3: Implement**

```ts
// utils/formatMemberSince.ts
export const formatMemberSince = (
  timestamp: string | undefined | null
): string | null => {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(date);
};
```

- [ ] **Step 4: Add barrel export**

Add this line to `utils/index.ts` (alongside the other `export *` lines):

```ts
export * from "./formatMemberSince";
```

- [ ] **Step 5: Run it; verify it passes**

Run: `npx vitest run __tests__/utils/formatMemberSince.test.ts`
Expected: PASS (2 passed).

- [ ] **Step 6: Commit**

```bash
git add utils/formatMemberSince.ts utils/index.ts __tests__/utils/formatMemberSince.test.ts
git commit -m "feat(member-card): add formatMemberSince helper"
```

---

## Task 3: `resolveMemberCardColors` (pure, TDD)

**Files:**
- Create: `design-system/memberCardColors.ts`
- Test: `__tests__/design-system/memberCardColors.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/design-system/memberCardColors.test.ts
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
```

- [ ] **Step 2: Run it; verify it fails**

Run: `npx vitest run __tests__/design-system/memberCardColors.test.ts`
Expected: FAIL — cannot resolve module.

- [ ] **Step 3: Implement**

```ts
// design-system/memberCardColors.ts
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
```

- [ ] **Step 4: Run it; verify it passes**

Run: `npx vitest run __tests__/design-system/memberCardColors.test.ts`
Expected: PASS (3 passed).

- [ ] **Step 5: Commit**

```bash
git add design-system/memberCardColors.ts __tests__/design-system/memberCardColors.test.ts
git commit -m "feat(member-card): add theme color resolver with #007EFF fallback"
```

---

## Task 4: `ShakeDetector` (pure, TDD)

**Files:**
- Create: `hooks/shakeDetector.ts`
- Test: `__tests__/hooks/shakeDetector.test.ts`

The detector counts a "jolt" only on the rising edge of acceleration magnitude crossing a threshold (so one sustained spike = one jolt), and fires when `requiredJolts` land within `windowMs`. It takes `now` as a parameter so tests are deterministic.

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/hooks/shakeDetector.test.ts
import { describe, it, expect } from "vitest";
import { ShakeDetector } from "@/hooks/shakeDetector";

const REST = { x: 0, y: 0, z: 1 }; // magnitude 1 (gravity)
const JOLT = { x: 3, y: 0, z: 0 }; // magnitude 3 (> threshold)

describe("ShakeDetector", () => {
  it("fires after the required jolts within the window", () => {
    const d = new ShakeDetector({ threshold: 1.8, requiredJolts: 3, windowMs: 1000 });
    expect(d.process(REST, 0)).toBe(false);
    expect(d.process(JOLT, 100)).toBe(false); // jolt 1 (rising edge)
    expect(d.process(REST, 150)).toBe(false);
    expect(d.process(JOLT, 300)).toBe(false); // jolt 2
    expect(d.process(REST, 350)).toBe(false);
    expect(d.process(JOLT, 500)).toBe(true); // jolt 3 → fire
  });

  it("does not fire on a single sustained spike", () => {
    const d = new ShakeDetector({ requiredJolts: 3, windowMs: 1000 });
    let fired = false;
    for (let t = 0; t < 10; t++) {
      fired = fired || d.process(JOLT, t * 20); // stays above threshold → one rising edge
    }
    expect(fired).toBe(false);
  });

  it("does not fire when jolts fall outside the window", () => {
    const d = new ShakeDetector({ requiredJolts: 3, windowMs: 1000 });
    expect(d.process(JOLT, 0)).toBe(false); // jolt 1
    d.process(REST, 50);
    expect(d.process(JOLT, 600)).toBe(false); // jolt 2
    d.process(REST, 650);
    // jolt 1 (t=0) is now older than 1000ms → only 2 jolts in window
    expect(d.process(JOLT, 1200)).toBe(false);
  });

  it("resets after firing so the next shake needs fresh jolts", () => {
    const d = new ShakeDetector({ requiredJolts: 2, windowMs: 1000 });
    d.process(JOLT, 0);
    d.process(REST, 50);
    expect(d.process(JOLT, 100)).toBe(true); // fires
    d.process(REST, 150);
    expect(d.process(JOLT, 200)).toBe(false); // only one fresh jolt
  });
});
```

- [ ] **Step 2: Run it; verify it fails**

Run: `npx vitest run __tests__/hooks/shakeDetector.test.ts`
Expected: FAIL — cannot resolve `@/hooks/shakeDetector`.

- [ ] **Step 3: Implement**

```ts
// hooks/shakeDetector.ts
export interface AccelSample {
  x: number;
  y: number;
  z: number;
}

export interface ShakeDetectorConfig {
  threshold?: number; // magnitude (g) that counts as a jolt; rest ≈ 1
  requiredJolts?: number; // jolts needed within the window to fire
  windowMs?: number; // sliding window length
}

export class ShakeDetector {
  private readonly threshold: number;
  private readonly requiredJolts: number;
  private readonly windowMs: number;
  private joltTimes: number[] = [];
  private wasAboveThreshold = false;

  constructor(config: ShakeDetectorConfig = {}) {
    this.threshold = config.threshold ?? 1.8;
    this.requiredJolts = config.requiredJolts ?? 3;
    this.windowMs = config.windowMs ?? 1000;
  }

  /** Returns true exactly once when a shake is detected, then resets. */
  process(sample: AccelSample, now: number): boolean {
    const magnitude = Math.sqrt(
      sample.x * sample.x + sample.y * sample.y + sample.z * sample.z
    );
    const above = magnitude > this.threshold;

    // Count a jolt only on the rising edge so a sustained spike is one jolt.
    if (above && !this.wasAboveThreshold) {
      this.joltTimes.push(now);
    }
    this.wasAboveThreshold = above;

    // Keep only jolts inside the sliding window.
    this.joltTimes = this.joltTimes.filter((t) => now - t <= this.windowMs);

    if (this.joltTimes.length >= this.requiredJolts) {
      this.reset();
      return true;
    }
    return false;
  }

  reset(): void {
    this.joltTimes = [];
    this.wasAboveThreshold = false;
  }
}
```

- [ ] **Step 4: Run it; verify it passes**

Run: `npx vitest run __tests__/hooks/shakeDetector.test.ts`
Expected: PASS (4 passed).

- [ ] **Step 5: Commit**

```bash
git add hooks/shakeDetector.ts __tests__/hooks/shakeDetector.test.ts
git commit -m "feat(member-card): add pure ShakeDetector with rising-edge jolt counting"
```

---

## Task 5: `useShakeDetection` hook

**Files:**
- Create: `hooks/useShakeDetection.ts`

Subscribes to the accelerometer only while `enabled`. Reads `onShake` through a ref so a changing callback never re-subscribes. Guards with `isAvailableAsync()` so it no-ops where there's no sensor (e.g. iOS Simulator).

- [ ] **Step 1: Implement**

```ts
// hooks/useShakeDetection.ts
import { useEffect, useRef } from "react";
import { Accelerometer } from "expo-sensors";
import { ShakeDetector } from "./shakeDetector";

const UPDATE_INTERVAL_MS = 50; // 20 Hz

interface UseShakeDetectionOptions {
  enabled: boolean;
  onShake: () => void;
  threshold?: number;
  requiredJolts?: number;
  windowMs?: number;
}

export function useShakeDetection({
  enabled,
  onShake,
  threshold = 1.8,
  requiredJolts = 3,
  windowMs = 1000,
}: UseShakeDetectionOptions) {
  const onShakeRef = useRef(onShake);
  onShakeRef.current = onShake;

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let subscription: { remove: () => void } | undefined;
    const detector = new ShakeDetector({ threshold, requiredJolts, windowMs });

    (async () => {
      const available = await Accelerometer.isAvailableAsync().catch(() => false);
      if (!available || cancelled) return;
      Accelerometer.setUpdateInterval(UPDATE_INTERVAL_MS);
      subscription = Accelerometer.addListener((sample) => {
        if (detector.process(sample, Date.now())) {
          onShakeRef.current();
        }
      });
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [enabled, threshold, requiredJolts, windowMs]);
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors in `hooks/useShakeDetection.ts` (pre-existing unrelated errors in other files, if any, are out of scope).

- [ ] **Step 3: Commit**

```bash
git add hooks/useShakeDetection.ts
git commit -m "feat(member-card): add useShakeDetection hook wiring expo-sensors"
```

---

## Task 6: `MemberCardStarfield` component

**Files:**
- Create: `design-system/MemberCardStarfield.tsx`

Renders ~26 twinkling stars, a planet (SVG radial gradient), two counter-rotating orbit rings, an orbiting moon, and a shooting star — all tinted with the card's font color. Honors `reducedMotion` by holding static values.

- [ ] **Step 1: Implement**

```tsx
// design-system/MemberCardStarfield.tsx
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";

interface StarSpec {
  left: number;
  top: number;
  size: number;
  delay: number;
}

// Hand-placed over the 280×360 card for an even spread.
const STARS: StarSpec[] = [
  { left: 14, top: 30, size: 3, delay: 0 },
  { left: 40, top: 64, size: 2, delay: 1200 },
  { left: 70, top: 22, size: 2, delay: 600 },
  { left: 96, top: 50, size: 3, delay: 1900 },
  { left: 128, top: 18, size: 2, delay: 300 },
  { left: 160, top: 42, size: 3, delay: 2200 },
  { left: 196, top: 26, size: 2, delay: 1500 },
  { left: 228, top: 54, size: 3, delay: 800 },
  { left: 250, top: 30, size: 2, delay: 2000 },
  { left: 24, top: 104, size: 2, delay: 1100 },
  { left: 248, top: 110, size: 3, delay: 500 },
  { left: 12, top: 150, size: 2, delay: 1700 },
  { left: 256, top: 158, size: 2, delay: 900 },
  { left: 30, top: 200, size: 3, delay: 2300 },
  { left: 240, top: 210, size: 2, delay: 1400 },
  { left: 18, top: 250, size: 2, delay: 200 },
  { left: 60, top: 236, size: 2, delay: 1800 },
  { left: 210, top: 248, size: 3, delay: 700 },
  { left: 255, top: 240, size: 2, delay: 2100 },
  { left: 44, top: 286, size: 2, delay: 1000 },
  { left: 120, top: 300, size: 2, delay: 400 },
  { left: 230, top: 296, size: 3, delay: 1600 },
  { left: 88, top: 330, size: 2, delay: 2400 },
  { left: 170, top: 336, size: 2, delay: 950 },
  { left: 14, top: 340, size: 2, delay: 1350 },
  { left: 260, top: 330, size: 3, delay: 550 },
];

const PLANET_SIZE = 84;
const ORBIT_OUTER = 168;
const ORBIT_INNER = 124;
const SYSTEM = ORBIT_OUTER;

function Star({
  spec,
  color,
  reducedMotion,
}: {
  spec: StarSpec;
  color: string;
  reducedMotion: boolean;
}) {
  const t = useSharedValue(0.6);
  useEffect(() => {
    if (reducedMotion) {
      t.value = 0.6;
      return;
    }
    t.value = withDelay(
      spec.delay,
      withRepeat(
        withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
  }, [t, spec.delay, reducedMotion]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 1], [0.15, 0.95]),
    transform: [{ scale: interpolate(t.value, [0, 1], [0.7, 1.1]) }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: spec.left,
          top: spec.top,
          width: spec.size,
          height: spec.size,
          borderRadius: spec.size / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

function Orbit({
  size,
  color,
  durationMs,
  reverse,
  reducedMotion,
  children,
}: {
  size: number;
  color: string;
  durationMs: number;
  reverse?: boolean;
  reducedMotion: boolean;
  children?: React.ReactNode;
}) {
  const r = useSharedValue(0);
  useEffect(() => {
    if (reducedMotion) return;
    r.value = withRepeat(
      withTiming(1, { duration: durationMs, easing: Easing.linear }),
      -1,
      false
    );
  }, [r, durationMs, reducedMotion]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${(reverse ? -1 : 1) * r.value * 360}deg` }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1.5,
          borderColor: color,
          opacity: 0.3,
          alignItems: "center",
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

function ShootingStar({
  color,
  reducedMotion,
  delayMs,
}: {
  color: string;
  reducedMotion: boolean;
  delayMs: number;
}) {
  const p = useSharedValue(0);
  useEffect(() => {
    if (reducedMotion) return;
    p.value = withDelay(
      delayMs,
      withRepeat(
        withTiming(1, { duration: 7000, easing: Easing.in(Easing.ease) }),
        -1,
        false
      )
    );
  }, [p, delayMs, reducedMotion]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.05, 0.12, 0.2, 1], [0, 0.9, 0.9, 0, 0]),
    transform: [
      { translateX: interpolate(p.value, [0, 0.2], [-40, 220]) },
      { translateY: interpolate(p.value, [0, 0.2], [-10, 70]) },
      { rotate: "20deg" },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: 24,
          left: 0,
          width: 60,
          height: 2,
          borderRadius: 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

export function MemberCardStarfield({
  color,
  reducedMotion,
}: {
  color: string;
  reducedMotion: boolean;
}) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {STARS.map((spec, i) => (
        <Star key={i} spec={spec} color={color} reducedMotion={reducedMotion} />
      ))}

      <View
        style={{
          position: "absolute",
          top: 86,
          left: 0,
          right: 0,
          height: SYSTEM,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Orbit
          size={ORBIT_OUTER}
          color={color}
          durationMs={16000}
          reducedMotion={reducedMotion}
        >
          {/* moon rides the outer orbit */}
          <View
            style={{
              position: "absolute",
              top: -5,
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: color,
              opacity: 0.9,
            }}
          />
        </Orbit>
        <Orbit
          size={ORBIT_INNER}
          color={color}
          durationMs={24000}
          reverse
          reducedMotion={reducedMotion}
        />
        <Svg width={PLANET_SIZE} height={PLANET_SIZE}>
          <Defs>
            <RadialGradient id="memberPlanet" cx="34%" cy="30%" r="70%">
              <Stop offset="0%" stopColor={color} stopOpacity={0.55} />
              <Stop offset="100%" stopColor={color} stopOpacity={0.12} />
            </RadialGradient>
          </Defs>
          <Circle
            cx={PLANET_SIZE / 2}
            cy={PLANET_SIZE / 2}
            r={PLANET_SIZE / 2 - 3}
            fill="url(#memberPlanet)"
          />
        </Svg>
      </View>

      <ShootingStar color={color} reducedMotion={reducedMotion} delayMs={1500} />
      <ShootingStar color={color} reducedMotion={reducedMotion} delayMs={5000} />
    </View>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors in `design-system/MemberCardStarfield.tsx`.

- [ ] **Step 3: Commit**

```bash
git add design-system/MemberCardStarfield.tsx
git commit -m "feat(member-card): add animated starfield (planet, orbits, moon, shooting stars)"
```

---

## Task 7: `MemberCard` component

**Files:**
- Create: `design-system/MemberCard.tsx`

Pure presentational card. Uses RN primitives so dynamic theme colors apply via inline `style` (not className). Starfield sits behind the content.

- [ ] **Step 1: Implement**

```tsx
// design-system/MemberCard.tsx
import { StyleSheet, Text, View } from "react-native";
import type { MemberCardColors } from "./memberCardColors";
import { MemberCardStarfield } from "./MemberCardStarfield";

interface MemberCardProps {
  colors: MemberCardColors;
  name: string;
  since: string | null;
  reducedMotion: boolean;
}

export function MemberCard({ colors, name, since, reducedMotion }: MemberCardProps) {
  const { background, font } = colors;
  return (
    <View style={[styles.card, { backgroundColor: background }]}>
      <MemberCardStarfield color={font} reducedMotion={reducedMotion} />

      <View style={styles.content} pointerEvents="none">
        <Text style={[styles.appName, { color: font }]}>Tiny Planet</Text>
        <Text style={[styles.title, { color: font }]}>Member Card</Text>

        <View style={styles.spacer} />

        <View style={styles.rows}>
          <View style={styles.rowLeft}>
            <Text style={[styles.label, { color: font }]}>MEMBER</Text>
            <Text style={[styles.value, { color: font }]} numberOfLines={1}>
              {name}
            </Text>
          </View>
          {since ? (
            <View>
              <Text style={[styles.label, styles.right, { color: font }]}>
                SINCE
              </Text>
              <Text style={[styles.value, styles.right, { color: font }]}>
                {since}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={[styles.divider, { backgroundColor: font }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 280,
    height: 360,
    borderRadius: 20,
    overflow: "hidden",
  },
  content: {
    flex: 1,
    padding: 22,
  },
  appName: {
    fontSize: 22,
    fontWeight: "600",
    opacity: 0.6,
  },
  title: {
    fontSize: 25,
    fontWeight: "700",
    marginTop: 2,
  },
  spacer: { flex: 1 },
  rows: { flexDirection: "row", gap: 16 },
  rowLeft: { flex: 1 },
  label: {
    fontSize: 9,
    letterSpacing: 0.6,
    fontWeight: "600",
    opacity: 0.7,
    marginBottom: 3,
  },
  value: { fontSize: 14 },
  right: { textAlign: "right" },
  divider: {
    height: 1.5,
    opacity: 0.2,
    marginTop: 14,
  },
});
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors in `design-system/MemberCard.tsx`.

- [ ] **Step 3: Commit**

```bash
git add design-system/MemberCard.tsx
git commit -m "feat(member-card): add MemberCard presentational component"
```

---

## Task 8: `MemberCardOverlay` component

**Files:**
- Create: `design-system/MemberCardOverlay.tsx`

Owns visible/cooldown state, the shake hook, the blur backdrop, the reveal animation, the flick-to-dismiss pan gesture, the success haptic, and a `__DEV__`-only trigger button (so the card can be previewed without a physical accelerometer). All hooks run unconditionally; rendering is gated below them. Wraps its own `GestureHandlerRootView` (the app has no root one) with `pointerEvents="box-none"` so it never blocks touches when idle.

- [ ] **Step 1: Implement**

```tsx
// design-system/MemberCardOverlay.tsx
import { useCallback, useEffect, useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { useProfileStore } from "@/stores/profileStore";
import { hapticSuccess } from "@/utils";
import { formatMemberSince } from "@/utils/formatMemberSince";
import { useShakeDetection } from "@/hooks/useShakeDetection";
import { resolveMemberCardColors } from "./memberCardColors";
import { MemberCard } from "./MemberCard";

const COOLDOWN_MS = 2500;
const FLICK_DISTANCE = 120;
const FLICK_SPEED = 800;
const { height: SCREEN_H } = Dimensions.get("window");
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export function MemberCardOverlay() {
  const profile = useProfileStore((s) => s.profileState);
  const reducedMotion = useReducedMotion() ?? false;

  const [visible, setVisible] = useState(false);
  const [cooling, setCooling] = useState(false);

  const progress = useSharedValue(0); // 0 = hidden, 1 = fully revealed
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);

  const reveal = useCallback(() => {
    dragX.value = 0;
    dragY.value = 0;
    setVisible(true);
    progress.value = reducedMotion
      ? 1
      : withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
    hapticSuccess();
  }, [progress, dragX, dragY, reducedMotion]);

  const finishDismiss = useCallback(() => {
    setVisible(false);
    setCooling(true);
  }, []);

  const dismiss = useCallback(() => {
    progress.value = withTiming(0, { duration: 220 }, (done) => {
      if (done) runOnJS(finishDismiss)();
    });
  }, [progress, finishDismiss]);

  // Cooldown after dismiss before shakes can re-trigger.
  useEffect(() => {
    if (!cooling) return;
    const id = setTimeout(() => setCooling(false), COOLDOWN_MS);
    return () => clearTimeout(id);
  }, [cooling]);

  useShakeDetection({
    enabled: !!profile && !visible && !cooling,
    onShake: reveal,
  });

  const flick = Gesture.Pan()
    .onUpdate((e) => {
      dragX.value = e.translationX;
      dragY.value = e.translationY;
    })
    .onEnd((e) => {
      const dist = Math.hypot(e.translationX, e.translationY);
      const speed = Math.hypot(e.velocityX, e.velocityY);
      if (dist > FLICK_DISTANCE || speed > FLICK_SPEED) {
        dragX.value = withTiming(e.translationX + e.velocityX * 0.2, {
          duration: 250,
        });
        dragY.value = withTiming(
          e.translationY + e.velocityY * 0.2 + SCREEN_H * 0.3,
          { duration: 250 }
        );
        progress.value = withTiming(0, { duration: 250 }, (done) => {
          if (done) runOnJS(finishDismiss)();
        });
      } else {
        dragX.value = withSpring(0);
        dragY.value = withSpring(0);
      }
    });

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateX: dragX.value },
      {
        translateY:
          dragY.value + (reducedMotion ? 0 : interpolate(progress.value, [0, 1], [20, 0])),
      },
      { scale: reducedMotion ? 1 : interpolate(progress.value, [0, 1], [0.8, 1]) },
      {
        rotateZ: `${
          reducedMotion ? 0 : interpolate(progress.value, [0, 1], [-6, 0])
        }deg`,
      },
    ],
  }));

  if (!profile) return null;

  const colors = resolveMemberCardColors(profile.theme_settings);
  const name = profile.full_name || "Member";
  const since = formatMemberSince(profile.created_at);

  // While hidden, render nothing (the shake hook above stays mounted and active).
  // This avoids an absolute-fill overlay swallowing touches when idle.
  const showDevTrigger = __DEV__ && !visible;
  if (!visible && !showDevTrigger) return null;

  return (
    <GestureHandlerRootView style={styles.root} pointerEvents="box-none">
      {visible ? (
        <>
          <AnimatedBlurView
            intensity={40}
            tint="dark"
            style={[StyleSheet.absoluteFill, backdropStyle]}
          />
          <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
          <Animated.View style={styles.center} pointerEvents="box-none">
            <GestureDetector gesture={flick}>
              <Animated.View style={cardStyle}>
                <MemberCard
                  colors={colors}
                  name={name}
                  since={since}
                  reducedMotion={reducedMotion}
                />
              </Animated.View>
            </GestureDetector>
          </Animated.View>
        </>
      ) : null}

      {showDevTrigger ? (
        <Pressable style={styles.devTrigger} onPress={reveal}>
          <Text style={styles.devTriggerText}>🪪</Text>
        </Pressable>
      ) : null}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, zIndex: 9999, elevation: 9999 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  devTrigger: {
    position: "absolute",
    right: 12,
    bottom: 96,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  devTriggerText: { fontSize: 18 },
});
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors in `design-system/MemberCardOverlay.tsx`.

- [ ] **Step 3: Commit**

```bash
git add design-system/MemberCardOverlay.tsx
git commit -m "feat(member-card): add overlay with reveal, flick-dismiss, cooldown, DEV trigger"
```

---

## Task 9: Mount the overlay & export it

**Files:**
- Modify: `design-system/index.ts`
- Modify: `app/(protected)/_layout.tsx`

- [ ] **Step 1: Export from the barrel**

Add to `design-system/index.ts` (with the other exports):

```ts
export { MemberCardOverlay } from "./MemberCardOverlay";
```

- [ ] **Step 2: Mount as a sibling of the protected Stack**

Edit `app/(protected)/_layout.tsx` to import the overlay and wrap the return in a fragment with the overlay after `</Stack>`:

```tsx
import "../../global.css";
import { Stack } from "expo-router";
import { MemberCardOverlay } from "@/design-system";

export default function ProtectedLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: true,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#faf9f5" },
          headerTitleStyle: {
            fontWeight: "bold",
            fontSize: 20,
            color: "#111827",
          },
          headerTintColor: "#111827",
          headerBackButtonDisplayMode: "minimal",
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="create-list" options={{ headerShown: false }} />
        <Stack.Screen name="create-post" options={{ headerShown: false }} />
        <Stack.Screen
          name="create-travel-plan"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="create-intro" options={{ headerShown: false }} />
        <Stack.Screen name="comments" options={{ headerShown: false }} />
        <Stack.Screen
          name="search"
          options={{
            headerShown: false,
            presentation: "transparentModal",
            animation: "fade",
          }}
        />
      </Stack>
      <MemberCardOverlay />
    </>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add design-system/index.ts "app/(protected)/_layout.tsx"
git commit -m "feat(member-card): mount overlay in protected layout"
```

---

## Task 10: Verify end-to-end & finalize

**Files:** none (verification)

- [ ] **Step 1: Run the full test suite**

Run: `npm run test`
Expected: all tests pass, including the 3 new files (formatMemberSince, memberCardColors, shakeDetector).

- [ ] **Step 2: Typecheck the whole project**

Run: `npx tsc --noEmit`
Expected: no errors introduced by these files.

- [ ] **Step 3: Lint the new files**

Run: `npx expo lint .`
Expected: no errors for the new files. (Note: this repo's lint runs whole-repo with `--fix`; check `git status` afterward to ensure it didn't touch unrelated files — re-stage only member-card files if needed.)

- [ ] **Step 4: Manual verification (DEV trigger, simulator)**

Run: `npm run ios` (or `npm run android`). Sign in, then on any screen tap the `🪪` button (bottom-right, DEV only).
Expected: backdrop blurs/dims, the card scales + rotates + fades in, a haptic fires (device only), the starfield twinkles and the orbits/moon/shooting stars animate. Tap the backdrop → card fades out. Reopen → flick the card hard in any direction → it flings off-screen and dismisses. After dismiss, the `🪪` reappears.

- [ ] **Step 5: Manual verification (real shake, physical device)**

Run on a physical device. Shake firmly (2–3 jolts) → card reveals. Confirm a single bump or pocket-pull does NOT trigger it; tune `threshold`/`requiredJolts` in `useShakeDetection` defaults if needed. Confirm an immediate re-shake right after dismiss is ignored (cooldown).

- [ ] **Step 6: Verify theme + fallback**

With a custom theme set (e.g. via theme editor), the card uses those colors. With no theme, the card is `#007EFF` background / white text.

- [ ] **Step 7: Final review commit (if any tuning was needed)**

```bash
git add -A
git commit -m "chore(member-card): tune shake thresholds after device testing"
```

Then push and update PR #21:

```bash
git push
```

---

## Notes for the implementer

- **Vitest can't render React Native** (jsdom). That's why the three logic units are extracted into RN-free modules and unit-tested, while the visual components are verified via typecheck + the DEV trigger + device run. Do not try to add `@testing-library/react` render tests for `MemberCard`/`MemberCardStarfield`/`MemberCardOverlay`.
- **Hooks before returns:** every hook in `MemberCardOverlay` is called before the `if (!profile) return null` so the shake subscription stays alive while the card is hidden. Keep it that way.
- **No new `expo-sensors` mock needed** unless you add a hook-level test; the logic tests don't import `expo-sensors`.
- **Lint caution:** `npx expo lint . --fix` operates on the whole repo and can auto-delete unused exports in unstaged files. After linting, run `git status` and only stage member-card files.
