# Hangs Feature — Implementation

Lightweight real-world meetups (Hangs) with "Going" RSVPs, visible in the feed and on the
map, with push notifications. Mirrors the Travel Plan pattern (a structured row linked to an
auto-created post) with a coral-accented "Scene" UI per `docs/hang-mockups/`.

Plan: `.claude/plans/here-is-the-prd-vivid-neumann.md`

## Stage 0 — Design tokens & primitives
- [x] Coral ramp in `global.css @theme` + `design-system/colors.ts`
- [x] Coral `Button` variant + coral `Badge` variant
- [x] `design-system/AvatarStack.tsx` (overlapping attendee avatars)

## Stage A — Database (3 migrations; validated via `supabase db reset` + psql + RPC tests)
- [x] `20260612000001_create_hangs.sql` — `hangs` + `hang_attendees`, RLS, realtime
- [x] `20260612000002_hang_rpc_functions.sql` — create/update/delete/detail/locations/friends-and-mutuals
- [x] `20260612000003_add_hangs_to_feed_functions.sql` — embed `hang` JSONB + exclude expired

## Stage B — Client data layer
- [x] `types/hang.ts`; `PostWithAuthor.hang`; `lib/queryKeys.ts` hangs; `lib/rpc.ts` RpcReturns
- [x] `hooks/useHangs.ts` (create/update/delete/rsvp/unrsvp/detail/locations/realtime)
- [x] `hooks/useMapData.ts` wiring; `utils/mapSnapshot.ts`; `utils/hangTime.ts`

## Stage C — UI (per designs; create/edit modeled on `edit-profile.tsx`)
- [x] Create-menu item + `create-hang` / `edit-hang` + `components/HangForm.tsx`
- [x] `design-system/HangCard.tsx` (Scene feed card) + `FeedView` branching
- [x] `app/(protected)/hang/[hangId].tsx` (Scene detail) — host/attendees/calendar/maps/RSVP/realtime
- [x] `components/HangMarker.tsx` (Quiet marker + preview) + `MapView` + "Hangs" map filter

## Stage D — Notifications, realtime, calendar
- [x] `supabase/functions/notify-hangs/index.ts` (branches on `hangs` / `hang_attendees`)
- [x] `usePushNotifications.ts` routes `data.hangId` → `/hang/[hangId]`
- [x] `expo-calendar` installed + `utils/calendar.ts` wired to detail

## Verification
- [x] `tsc --noEmit`: 0 errors across the project
- [x] eslint: 0 errors (warnings only, consistent with codebase)
- [x] `__tests__/hooks/useHangs.test.tsx`: 8/8 pass
- [x] `__tests__/rpc/hangs.test.ts`: 16/16 pass (create/RSVP/visibility/expiry/feed/update/delete)
- [x] Baseline comparison proves my changes add **0** new failures to the existing suite

---

## Review

### What was built
End-to-end Hang feature: DB schema + RLS + RPCs, React Query hooks with realtime RSVP
updates, a coral "Scene" feed card / detail / map marker, native-calendar integration, and a
fan-out push edge function. Hangs auto-create a linked post (reusing feed pagination +
visibility) and are hidden once `starts_at + 3h` passes — pure query-time filtering, no cron.

### Bugs caught & fixed during verification
1. **Feed visibility gap** — a `'mutuals'`-visibility hang post was invisible to **direct
   friends** in `get_feed_posts` (the existing "mutuals" branch only matches friends-of-
   friends). Added a hang-specific branch including friends **and** mutuals, independent of
   post visibility. Caught by a psql end-to-end check.
2. **Ambiguous `post_id`** in `update_hang_with_post` — the `RETURNS TABLE` output column
   collided with `hangs.post_id` in `SELECT … INTO`. Fixed by aliasing the table. Caught by
   the RPC integration test.

### Verified behavior (live local DB)
Host auto-RSVP, friend + mutual feed/map visibility, stranger exclusion, real-time attendee
counts, expiry (invitee loses feed/detail access; host retains history), edit syncs the post,
delete cascades RSVPs.

### Manual steps before production (can't be automated here)
- Deploy `notify-hangs` + create two Supabase **Dashboard webhooks** (INSERT on `hangs` and
  `hang_attendees`) → the function URL with the service-role header.
- **Native rebuild** (`npx expo run:ios` / `run:android`) for the new `expo-calendar` dep.

### Out of scope (PRD follow-ups)
Re-notifying attendees on host edits; hard-deleting expired rows (kept for future history); an
intermediate map preview callout beyond the current tap-to-detail.

### Pre-existing suite note
The full RPC suite (run in one process) shows `forbidden: user mismatch` failures in
`messages` / `profile` / `get_user_posts` — the shared GoTrue storage key clobbering
`adminClient`'s session against the `enforce_auth_uid` migration. Confirmed identical on the
hangs-free baseline; unrelated to this feature.
