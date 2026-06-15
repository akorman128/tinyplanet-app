# Hangs Feature — Implementation Plan

## Context

We're adding a new social object, the **Hang**: a lightweight real-world meetup a user
creates and invites friends + mutuals to, with "Going" RSVPs. Hangs appear in the feed and
on the map, have a detail page, and trigger push notifications on creation and RSVP. Today
the app has Posts, Travel Plans, Lists, and Intros but no way to organize a real-world
meetup — Hangs fill that gap.

**The Hang mirrors the existing Travel Plan backend pattern** (a structured row that
auto-creates a linked feed Post and shows on the map), reusing that machinery to keep the
change minimal. **The UI follows the selected design** in `docs/hang-mockups/` — the
coral-accented "Scene" direction: a *Quiet* map marker, a media-forward *Scene* feed card,
and a *Scene* (map-hero) detail view. The design handoff is `docs/hang-mockups/HANDOFF.md`;
the chosen frames are in `docs/hang-mockups/selected.html`.

### Product decisions (confirmed)
- **Expiry = active window.** Single start-time picker; the Hang stays visible on feed/map
  until **`starts_at + 3 hours`**, then is hidden. No `ends_at` column and no end-time field
  — the 3h window is computed. (The "ends in Xh"/time-range shown in the design is computed
  from `starts_at + 3h`; it also defines the calendar event's end.)
- **Add to Calendar = native device calendar** via `expo-calendar` (new dependency,
  permission prompt, requires a native rebuild).
- **Feed card = full social card.** Likes + comments (post infrastructure) **plus** the RSVP
  "I'm Going" CTA, per the Scene card design.
- **Accent = coral** (`#FF6B6B`), a new ramp distinct from Travel-Plans orange and brand purple.
- Visibility fixed to `mutuals` (friends + mutuals see it). RSVP is binary; host auto-"Going".
- **Form screens are modeled on `app/(protected)/edit-profile.tsx`** (the canonical
  react-hook-form + zod + `KeyboardAwareScrollView` + `Alert` screen), not the travel-plan form.

---

## Stage 0 — Design tokens & shared primitives

Per the project convention, tokens are mirrored manually in code and Paper (see memory
`design-system-code-vs-paper`). Code changes only here; the Paper file is synced separately.

- **`global.css` (`@theme`)** and **`design-system/colors.ts`**: add the coral ramp —
  `hang`/coral `#FF6B6B`, coral-pressed `#E8475F`, coral-tint `#FFEDEC`, CTA shadow
  `rgba(255,107,107,0.4)`. Reuse existing cream/ink/muted/divider tokens (do not redefine).
- **`design-system/Button.tsx`**: add a **coral primary** variant (coral fill, white label,
  radius ~14, coral drop-shadow) for the "I'm Going" CTA + pressed state.
- **`design-system/Badge.tsx`**: add a **coral variant** (coral text on `#FFEDEC`) for the
  "HANG" pill.
- Avatar **overlap stacks** (3× 26–30px, 2px ground-colored border): a small reusable helper
  (e.g. `design-system/AvatarStack.tsx`) wrapping `design-system/Avatar.tsx`, used by the
  feed card and detail attendee row.

---

## Stage A — Database (foundation; build & test first)

Three migrations in `supabase/migrations/`, prefixed `20260612xxxxxx` (auto-apply in order on
`supabase start`). Templates cited inline. **Active-window predicate, used everywhere:**
`starts_at + interval '3 hours' >= now()`.

### A1 — `20260612000001_create_hangs.sql` (mirror `20251229000002_create_travel_plans.sql`)
- **`hangs`**: `id`, `user_id` (host → `profiles(id) ON DELETE CASCADE`), `title text NOT NULL`,
  `description text`, `location geography(POINT,4326) NOT NULL`, `location_name text NOT NULL`,
  `starts_at timestamptz NOT NULL`, `post_id uuid REFERENCES posts(id) ON DELETE SET NULL`,
  `created_at`, `updated_at`. Indexes on `user_id`, `post_id`, `starts_at`, GIST on `location`.
  No `EXCLUDE` constraint (users may have multiple hangs).
- **RLS on `hangs`** (copy travel_plans policies, swap the daterange "active" check for the
  active-window predicate): SELECT own; SELECT friends' *active*; SELECT mutuals' *active*
  (reuse the canonical `friendships f1 JOIN f2` mutual block); INSERT/UPDATE/DELETE gated on
  `user_id = auth.uid()`. `update_hangs_updated_at` trigger; grants to `authenticated`.
- **`hang_attendees`** (name per design handoff): `id`, `hang_id` (→ `hangs(id) ON DELETE
  CASCADE`), `user_id` (→ `profiles`), `status text NOT NULL DEFAULT 'going'`, `created_at`,
  `UNIQUE (hang_id, user_id)`. Indexes on `hang_id`, `user_id`. (`status` is forward-compat;
  RSVP is binary "going" for now.)
  - RLS (mirror `likes`, `20251024153920_posts_comments_likes.sql`): SELECT gated by
    `EXISTS (SELECT 1 FROM hangs h WHERE h.id = hang_id)` (transitively filtered by `hangs`
    RLS → attendee lists only visible to those who can see the hang; **must be tested**);
    INSERT `WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM hangs h WHERE h.id =
    hang_id AND h.starts_at + interval '3 hours' >= now()))` (blocks RSVP to expired hangs);
    DELETE `USING (user_id = auth.uid())`.
- **Realtime**: `ALTER PUBLICATION supabase_realtime ADD TABLE hang_attendees;`
  (mirror `20260224000001_enable_realtime_on_lists.sql`).

### A2 — `20260612000002_hang_rpc_functions.sql` (mirror `20251229000003_travel_plan_rpc_functions.sql`)
All `SECURITY DEFINER SET search_path = public`, validate `auth.uid()`
(`20260610120000_enforce_auth_uid_in_security_definer_rpcs.sql`), grant to `authenticated`.
- **`create_hang_with_post(p_user_id, p_location_lng, p_location_lat, p_location_name, p_title,
  p_description, p_starts_at timestamptz, p_post_visibility default 'mutuals')`** →
  `(hang_id, post_id, title, starts_at)`. Validate `p_user_id = auth.uid()`,
  `p_starts_at >= now()`, `p_starts_at <= now() + interval '7 days'`, non-empty title. INSERT a
  `posts` row (visibility cast to `post_visibility`), then the `hangs` row linking `post_id`
  (`ST_SetSRID(ST_MakePoint(lng,lat),4326)::geography`), then auto-INSERT the host into
  `hang_attendees` (`status 'going'`).
- **`update_hang_with_post(p_hang_id, ...same fields..., p_post_visibility default NULL)`** —
  verify ownership, re-validate time bounds, UPDATE post + `hangs` (copy `update_travel_plan_with_post`).
- **`delete_hang_with_post(p_hang_id)` → void** — verify ownership, `DELETE FROM posts` (nulls
  `post_id`), `DELETE FROM hangs` (cascades `hang_attendees`). (Copy `cancel_travel_plan_with_post`.)
- **`get_active_hang_locations(p_user_id)`** (map) — copy `get_active_travel_plan_locations`,
  swap table/columns, active predicate = the 3h window; return `id, user_id, full_name,
  avatar_url, title, location_name, starts_at, longitude (ST_X), latitude (ST_Y),
  type ('own'|'friend'|'mutual'), attendee_count`. Keep the friend/mutual `WHERE` + `CASE` verbatim.
- **`get_hang_detail(p_hang_id)`** → host JSONB, attendees JSONB (`hang_attendees` JOIN
  `profiles`, ordered by `created_at`), `attendee_count`, `viewer_is_going`, `viewer_is_host`,
  coords, fields. **SECURITY DEFINER bypasses RLS → replicate the friend/mutual visibility
  predicate in the WHERE** (own OR active friend OR active mutual). Expired hangs return no rows
  to non-hosts; host still sees it.
- **`get_friends_and_mutuals_of(p_user_id)` → setof user_id** — for the edge function fan-out
  (called as `service_role`). Reuse the friend + mutual EXISTS blocks. Grant `service_role` +
  `authenticated`.

**RSVP writes are direct table ops via RLS (no RPC):** `from("hang_attendees").insert({ hang_id,
user_id, status:'going' })` / `.delete().eq(...)`, mirroring `likes`. RLS + INSERT `WITH CHECK`
enforce ownership and the not-expired rule.

### A3 — `20260612000003_add_hangs_to_feed_functions.sql`
`DROP`/`CREATE` both `get_feed_posts` and `get_saved_posts` (shared shape) from
`20260316000001_fix_feed_and_saved_posts_functions.sql`, adding:
- `LEFT JOIN hangs h ON h.post_id = p.id`.
- New return column `hang JSONB` = `CASE WHEN h.id IS NOT NULL THEN jsonb_build_object('id',
  h.id, 'title', h.title, 'description', h.description, 'location_name', h.location_name,
  'longitude', ST_X(h.location::geometry), 'latitude', ST_Y(h.location::geometry), 'starts_at',
  h.starts_at, 'attendee_count', (SELECT count(*) FROM hang_attendees a WHERE a.hang_id = h.id),
  'viewer_is_going', EXISTS(SELECT 1 FROM hang_attendees a WHERE a.hang_id = h.id AND a.user_id =
  user_id_param)) ELSE NULL END`.
- Outer `WHERE ... AND (h.id IS NULL OR h.starts_at + interval '3 hours' >= now())` — hides the
  auto-post (and saved entry) once the hang expires.
- Add the non-aggregated `h.*` columns to `GROUP BY` (or the migration fails to apply).

> This replaces the fragile text-prefix detection (`isTravelPlanPost`) for Hangs: the embedded
> `hang` JSONB is self-describing and carries live RSVP state. Highest-blast-radius migration —
> the shared feed read path; land and test it in isolation.

---

## Stage B — Client data layer

- **`types/hang.ts`** (new, mirror `types/travelPlan.ts`): `Hang`, `HangMapLocation`,
  `HangDetail`, `HangFeedEmbed` (the JSONB shape), `CreateHangInput`/`UpdateHangInput`,
  `CreateHangOutput`. Extend `types/post.ts` `PostWithAuthor` with `hang?: HangFeedEmbed | null`.
- **`lib/queryKeys.ts`**: add `hangs` namespace (`all`, `detail(id)`, `byUser(id)`, `locations`,
  `attendees(id)`).
- **`lib/rpc.ts`** `RpcReturns`: add `create_hang_with_post`, `update_hang_with_post`,
  `delete_hang_with_post`, `get_hang_detail`, `get_active_hang_locations`.
- **`hooks/useHangs.ts`** (new, mirror `useTravelPlan.ts` + `useChat.ts` realtime):
  `useCreateHang` / `useUpdateHang` / `useDeleteHang` (rpc + invalidate `hangs.*`, `posts.feed()`),
  `useGetHangDetail(hangId)` (query, `enabled: !!hangId`, returns `data[0]`),
  `useGetHangLocations()`, `useRsvpToHang` / `useRemoveHangRsvp` (direct `hang_attendees`
  insert/delete + invalidate `hangs.detail` & `posts.feed()`),
  `useSubscribeToHangAttendees()` (copy `useSubscribeToMessages`: `postgres_changes`,
  `table:'hang_attendees'`, `filter:'hang_id=eq.<id>'`).
- **`hooks/useMapData.ts`**: add `useGetHangLocations()` and expose `hangLocations` (mirror the
  `travelPlanLocations` wiring).
- **`utils/mapSnapshot.ts`** (new): `buildStaticMapUrl(lng, lat, { width, height })` →
  Mapbox **Static Images API** URL with a coral pin
  (`pin-s+FF6B6B(<lng>,<lat>)`), matching the app's existing Mapbox style and reusing the same
  access token as `components/LocationSearchInput.tsx`. Used by the feed banner + detail hero.

---

## Stage C — UI (per `docs/hang-mockups/`)

### Create / Edit — modeled on `app/(protected)/edit-profile.tsx`
- **Menu + routes**: `app/(protected)/(tabs)/create.tsx` → add `{ label: "Hang", emoji: "🎉",
  route: "/create-hang" }` to `MENU_ITEMS`. Register `create-hang`, `edit-hang`, `hang/[hangId]`
  in `app/(protected)/_layout.tsx`.
- **`app/(protected)/create-hang.tsx`** (new): follow edit-profile's structure — `Stack.Screen
  options={{ title: "Create Hang" }}`, `View flex-1 bg-cream`, `KeyboardAwareScrollView`
  (`contentContainerClassName="px-6 pt-6 pb-12"`, `gap-5`), `useForm` + `zodResolver`, `Controller`
  + `Input` fields, `LocationSearchInput` for location, the **`DateTimePicker` toggle pattern**
  from edit-profile (a `showPicker` state, iOS spinner + Save) but `mode="datetime"`,
  `minimumDate=now`, `maximumDate=now+7d`. Defaults: `startsAt = new Date()`, `location =
  useLocationStore.currentLocation` (seed `{ name: "Current location", lat, lng }`). Primary
  **coral** `Button` (`disabled={!isValid || isPending}`); `Alert` on success/error → `router.back()`.
  Zod: `title` required ≤80; `description` ≤500 optional; `location` required; `startsAt` refined
  not-past and ≤7 days.
- **`app/(protected)/edit-hang.tsx`** (new): same form, seeded from `useGetHangDetail(hangId)`,
  calls `useUpdateHang`. Host-only (reached from the detail screen). Extract the shared form body
  as `components/HangForm.tsx` to avoid duplication.

### Feed card — *Scene* (`design-system/HangCard.tsx`, new; model on `TravelPlanCard.tsx`)
Same props as `TravelPlanCardProps` so `FeedView` passes identical callbacks; reads `post.hang`.
- **Map banner** (full width ~152px): `buildStaticMapUrl(...)` image + coral pin + bottom
  legibility gradient. Overlaid: `HANG` badge (white on `rgba(0,0,0,.34)`) top-left; clock +
  `Today · 5:00 PM` bottom-left; place name bottom-right.
- **Body** (p16, gap12): host row (`Avatar` 40 → `/profile?userId=` + name + "invited you · 2h
  ago" + ⋯ menu); title (18/700); one-line description; `AvatarStack` (3×26) + "X going" + like
  count (right); **full-width coral `I'm Going` CTA** (plus icon).
- **States**: default = filled coral `I'm Going`; going = check + "Going", stack adds the user,
  "X going" increments live. Toggle via `useRsvpToHang`/`useRemoveHangRsvp` keyed by `post.hang.id`
  with optimistic feed-cache update (mirror the like optimistic pattern). Likes/comments/save row
  reuses TravelPlanCard's handlers. Card body → `router.push('/hang/[hangId]')`; ⋯ menu routes
  host to edit/delete.
- **`components/FeedView.tsx`**: `renderItem` → `item.hang ? <HangCard/> : isTravelPlanPost(item)
  ? <TravelPlanCard/> : <PostCard/>`.

### Detail — *Scene* (`app/(protected)/hang/[hangId].tsx`, new; model on `list/[listId].tsx`)
- **Hero (full-bleed ~308px)**: `buildStaticMapUrl(...)` + top/bottom gradients. Frosted **back**
  (left) and **share** (right) circles. Bottom overlay: `HANG · TODAY` eyebrow · title (27/700,
  white) · host row (`Avatar` + "Hosted by …") — **host tappable → `/profile?userId=`**.
- **Content sheet** (white, rounded top, overlaps hero ~22px; p24/20, gap18):
  - **Date row**: coral calendar icon + "Thursday, June 12" / "5:00–8:00 PM · ends in Xh"
    (computed from `starts_at` and `starts_at + 3h`; native `Date`/`toLocaleString`).
  - **Location row**: coral pin icon + place name / address + chevron → **Google Maps** via
    `Linking` (`https://www.google.com/maps/search/?api=1&query=<lat>,<lng>`, `comgooglemaps://`
    first on iOS — copy the pattern from `list/[listId].tsx`).
  - **Going · N** header + "See all" → attendee `AvatarStack` (30px, +N overflow chip), **each
    tappable → profile**.
  - **About** + description.
  - **Quick actions row**: bordered tiles `Calendar` (→ Stage D calendar util) + `Maps` (coral icons).
  - **Sticky bottom bar**: full-width coral `I'm Going` CTA (invitee, toggles "Going ✓" / removes
    RSVP). **Host** variant: replace with **Edit · Delete** (also in the header via iOS
    `Stack.Toolbar` pencil/trash gated on `viewer_is_host`; trash → `Alert` confirm →
    `useDeleteHang` → `router.back()`).
- **Realtime**: `useEffect` → `useSubscribeToHangAttendees()(hangId, () => invalidate
  hangs.detail(hangId))`; cleanup on unmount → live attendee count/list.

### Map marker — *Quiet* (`components/HangMarker.tsx`, new; model on `components/MapMarker.tsx`)
Use Mapbox **`MarkerView`** (per-marker, interactive) — not the GeoJSON `ShapeSource` approach —
so the marker can show a preview callout.
- **Idle pin**: host avatar (36px, black/white initials) in a white 50px circle with a **2px coral
  ring** + soft shadow; a 12–16px **coral dot** (white border) bottom-right marks "Hang".
- **Selected → preview callout**: white rounded card above the pin with a downward pointer —
  `HANG` pill + "X going", title, coral clock + `Today · 5:00 PM`. Tap pin → callout; tap callout →
  `router.push('/hang/[hangId]')`.
- **`components/MapView.tsx`**: render `HangMarker`s from `useMapData().hangLocations`. Only
  active/non-expired render (the RPC already filters).
- **Map filter**: add a **"Hangs"** entry to the filter set — `MapFilter` union in
  `stores/mapStore.ts` + a badge in the filter row in `app/(protected)/(tabs)/map.tsx`, gating
  `<HangMarker>` on `mapFilter === "hangs"` (alongside how travel plans render).

---

## Stage D — Notifications, realtime, calendar

- **`supabase/functions/notify-hangs/index.ts`** (new, mirror `send-push-notification/index.ts`,
  uses `SUPABASE_SERVICE_ROLE_KEY`). Branch on webhook `body.table`:
  - `hangs` INSERT → `rpc('get_friends_and_mutuals_of', { p_user_id: record.user_id })`, fetch
    their `push_tokens`, send `"<Host> created a Hang: <title>"`, `data: { hangId }`. **Chunk to
    100 messages/request** (Expo limit). Clean up `DeviceNotRegistered` tokens.
  - `hang_attendees` INSERT → skip if attendee is the host; else notify host `"<User> is going to
    your Hang."`, `data: { hangId }`.
  - Add `[functions.notify-hangs] verify_jwt = false` to `supabase/config.toml` if needed.
  - **Manual deploy** (webhooks are Dashboard-configured, not SQL): `supabase functions deploy
    notify-hangs`; create two DB webhooks (INSERT on `hangs` and on `hang_attendees`) → POST to the
    function URL with the service-role header.
- **`hooks/usePushNotifications.ts`**: extend the tap handler to route `data.hangId` →
  `/hang/[hangId]` (alongside the existing chat route).
- **`expo-calendar` + `utils/calendar.ts`** (new): request calendar permission, create a device
  calendar event — `title`, `notes = description`, `location = location_name`, `startDate =
  starts_at`, `endDate = starts_at + 3h`. Wire to the detail page's "Add to Calendar"; toast on
  success, handle denial. **Requires a native rebuild** (`npx expo run:ios` / `run:android`).

---

## Verification

**Automated** — `npm run lint`, `npm run test`.
- `__tests__/hooks/useHangs.test.tsx` (mirror existing hook tests w/ `mock-supabase` +
  `createTestWrapper`): create maps args & invalidates keys and rejects past / >7-day `starts_at`;
  detail returns `data[0]` & disabled w/o id; rsvp/unrsvp issue correct `hang_attendees` ops.
- `__tests__/rpc/hangs.test.ts` (live-Supabase, skipped w/o env): create makes post+hang+host
  attendee and rejects another user / out-of-window times; update/delete ownership; delete cascades
  attendees; `get_hang_detail` visibility (non-friend gets nothing; non-host gets nothing once
  expired); `get_active_hang_locations` excludes expired & respects friend/mutual; feed/saved
  functions embed `hang` and exclude expired; `hang_attendees` RLS hides others' rows and the INSERT
  `WITH CHECK` blocks expired RSVPs.

**Manual end-to-end** (`supabase start` applies migrations; deploy function + configure webhooks;
native rebuild for expo-calendar)
1. User A creates a Hang → datetime defaults to now, location to current location, 7-day cap
   enforced, host auto-"Going".
2. Hang card (Scene, with map banner) appears in A's feed; Quiet pin on the map under the "Hangs"
   filter; tap pin → preview → detail. Detail hero/sheet renders; host clickable; calendar button
   writes to device calendar; location opens Google Maps.
3. User B (friend/mutual) sees it in feed + map; taps `I'm Going` → A's attendee count/stack update
   **live**; A gets the RSVP push; on create B got the "created a Hang" push.
4. B taps again → RSVP removed, live count update.
5. A edits (title/time/location) → feed/map/detail reflect it. A deletes → gone from both users'
   feed/map; B can't open detail; attendees deleted.
6. Expiration: set `starts_at` ~now (or past via SQL) → after `starts_at + 3h` it drops from feed +
   map and is inaccessible to B (host still sees it).

---

## Risks & sequencing
- **Order**: Stage 0 (tokens) → A (DB) → B (client) → C (UI); D's edge function/calendar proceed
  alongside C once A lands. Test A's RPCs before building the client.
- **Feed-function migration (A3) is highest blast radius** — a bug breaks the whole feed. Land/test
  in isolation; ensure `GROUP BY` includes every non-aggregated `hangs` column.
- **SECURITY DEFINER bypasses RLS** — `get_hang_detail`, `get_active_hang_locations`, and the feed
  functions must replicate the friend/mutual visibility predicate in their `WHERE` (copy verbatim).
- **`hang_attendees` SELECT visibility** relies on transitive RLS filtering through `hangs` — verify
  by test that a non-friend can't read another's attendees.
- **Map snapshots** add Mapbox Static Images API calls per card/hero — confirm the access token is
  available client-side and watch request volume in the feed (consider caching/`@2x` sizing).
- **Webhooks are manual/out-of-repo**; **expo-calendar** needs a native rebuild, not just a JS reload.
- **Tokens synced manually** to Paper (memory `design-system-code-vs-paper`) — code-side coral ramp
  is in scope; updating the Paper file is a separate manual step.
- **PRD follow-ups not in scope**: re-notifying attendees when the host edits time/location;
  hard-deleting expired rows (kept for possible future historical view).

## Key files to mirror
- `supabase/migrations/20251229000002_create_travel_plans.sql` · `..._travel_plan_rpc_functions.sql`
  · `20260316000001_fix_feed_and_saved_posts_functions.sql` (DB)
- `hooks/useTravelPlan.ts` + `hooks/useChat.ts` (hooks + realtime)
- `app/(protected)/edit-profile.tsx` (create/edit form screen)
- `design-system/TravelPlanCard.tsx` + `components/FeedView.tsx` (feed card + branching)
- `app/(protected)/list/[listId].tsx` (detail screen + iOS toolbar + Google-Maps Linking)
- `components/MapMarker.tsx` + `components/MapView.tsx` + `app/(protected)/(tabs)/map.tsx` (map + filter)
- `supabase/functions/send-push-notification/index.ts` (edge function)
- Design: `docs/hang-mockups/HANDOFF.md` + `docs/hang-mockups/selected.html`
