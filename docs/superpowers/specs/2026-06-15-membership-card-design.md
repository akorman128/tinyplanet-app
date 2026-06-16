# Shake-to-reveal Member Card — Design Spec

**Date:** 2026-06-15
**Status:** Approved, ready for implementation plan
**Type:** Easter egg / delight feature (no new backend)

## Summary

While signed in, a deliberate shake of the phone reveals a "Member Card" rendered in
the user's theme colors over a dimmed/blurred backdrop. The card carries an animated
starfield (planet, orbit rings, moon, twinkling stars, occasional shooting star), flies
in with a satisfying haptic, and is dismissed by flicking it off-screen or tapping the
backdrop. A short cooldown prevents it from immediately re-triggering.

The feature is a hidden delight built entirely from data the app already has. It
introduces no membership tiers, founding-member status, member numbers, or any other
backend concept.

## Decisions (locked during brainstorming)

- **Single card**, not a swipeable deck of themes.
- **Easter egg** — uses only existing profile data; no new DB columns or backend.
- **Planet aesthetic** with a live starfield (twinkles, orbits, moon, shooting star) and
  a shake-reveal entrance animation.
- **Flick-to-dismiss** (plus backdrop tap), not tap-only.
- **Default color `#007EFF`** (white text) for users without a customized theme.
- **Render via Approach 1**: `react-native-svg` + `react-native-reanimated`, hand-built
  (already installed). No Skia.

## Dependencies

- **Add:** `expo-sensors` (accelerometer; no runtime permission required). Install with
  `npx expo install expo-sensors`.
- **Already installed and used:** `react-native-svg`, `react-native-reanimated`,
  `react-native-gesture-handler`, `expo-haptics`, `expo-blur`.

## Architecture & Files

- `hooks/useShakeDetection.ts`
  - Subscribes to `expo-sensors` `Accelerometer` only while `enabled`.
  - Detects a shake (acceleration-magnitude spikes above a threshold; requires multiple
    spikes within a short window), invokes `onShake`, then enforces a cooldown.
  - Guards with `Accelerometer.isAvailableAsync()`; no-ops where there is no sensor.
  - Self-contained and unit-testable.

- `design-system/MemberCardOverlay.tsx`
  - Mounted **once** in `app/(protected)/_layout.tsx`, so it is only active when signed in.
  - Owns `visible` state; wires `useShakeDetection({ enabled: !visible && !cooldown })`.
  - Renders the `expo-blur` backdrop, the entrance/exit animation, and the
    flick-to-dismiss pan gesture around `MemberCard`.

- `design-system/MemberCard.tsx`
  - Pure presentational card. Props: background color, font color, member name, "since"
    date. Renders card chrome, copy, and fields. No data fetching, no sensor logic.

- `design-system/Starfield.tsx`
  - The animated visuals: ~26 twinkling stars, planet with radial gradient, two
    counter-rotating orbit rings, an orbiting moon, periodic shooting star, planet glow
    pulse. Kept separate so `MemberCard` stays readable.

(Placement in `design-system/` follows the existing flat-file convention, e.g.
`GlassInfoCard.tsx`, `ScreenshotWarningModal.tsx`.)

## Data Flow

Source: `useProfileStore().profileState`.

- `backgroundColor = theme_settings?.backgroundColor ?? '#007EFF'`
- `fontColor = theme_settings?.fontColor ?? '#FFFFFF'`
- `MEMBER = full_name ?? 'Member'`
- `SINCE = format(created_at) -> 'Mon YYYY'` (e.g., `Jan 2026`); field hidden if
  `created_at` is absent.
- Copy: app name **"Tiny Planet"**, card title **"Member Card"**.

The card mirrors the user's chosen theme as-is. The `#007EFF` / white pair is only the
fallback for users who never customized a theme.

## Shake Detection

- Sample the accelerometer at ~20Hz (`Accelerometer.setUpdateInterval(~50ms)`).
- Compute the acceleration-magnitude per sample; count spikes that exceed a tuned
  threshold above the resting baseline.
- Fire `onShake` only when ~2–3 spikes occur within an ~800ms window — so a single bump,
  walking, or pulling the phone from a pocket will not trigger it. Exact threshold and
  window are tuned on-device during implementation.
- After dismiss, apply a ~2–3s cooldown; detection is also disabled while the card is
  visible.
- Unsubscribe on cleanup / when `enabled` is false.

## Animation (Reanimated, UI thread)

- **Entrance:** scale 0.8→1, rotate −6°→0°, translateY 20→0, opacity 0→1 over ~800ms
  with an ease-out curve, followed by a subtle idle float loop.
- **Starfield:** each star runs a staggered twinkle loop (opacity + scale); two orbit
  rings rotate in opposite directions; a moon rides the outer orbit; a shooting star
  streaks across periodically; the planet has a soft glow pulse. Star count capped around
  26 to stay smooth.
- **Haptic:** one `expo-haptics` impact as the card lands.
- **Dismiss:** a `react-native-gesture-handler` pan gesture tracks the card. Past a
  velocity/distance threshold the card flings off-screen in the gesture direction and
  fades; otherwise it springs back to center. Tapping the backdrop animates the card out
  (scale down + fade). On any dismiss, the cooldown starts.

## Edge Cases

- **Not signed in / no profile:** overlay disabled; sensor never subscribed (the overlay
  lives in the protected layout).
- **No sensor (e.g., iOS Simulator):** `isAvailableAsync()` guard means no crash and no
  subscription. A **DEV-only** trigger (visible only in `__DEV__`) lets us preview the
  card without a physical device.
- **Reduce Motion:** if the OS "Reduce Motion" setting is on, skip the heavy animation
  loops and simply fade the card in over a static starfield.
- **Theme contrast:** the card reflects the user's own theme colors exactly; we do not
  override their contrast choices. Only the fallback is the chosen #007EFF/white.

## Testing & Verification

- **Unit:** `useShakeDetection` with synthetic accelerometer samples — fires after the
  required spikes, does not fire on sub-threshold noise, respects the cooldown.
- **Render:** `MemberCard` shows the member name and formatted date and applies the
  provided theme colors; verifies the #007EFF/white fallback when no theme is set.
- **Manual (physical device):** shake → reveal + haptic → flick dismiss → confirm
  cooldown before it can re-trigger. Use the DEV trigger to exercise the visuals in the
  simulator.

## Out of Scope (YAGNI)

- Swipeable deck / carousel of all themes.
- Real membership concepts: founding-member status, tiers, member numbers, entitlements.
- Sharing or image export of the card.
- Persisting "you found the easter egg" state.
