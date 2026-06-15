# Lessons

## "Remove the header" on a screen = overlay, not delete

When the user references a transparent-header screen (e.g. `list/[listId]` with
`headerTransparent: true`) and asks to "remove the headers" from other pages,
the intent is: **the header should overlay the content instead of occupying
vertical space**, and screen titles aren't needed.

- Don't offer a "hide it completely vs make it transparent" binary — default to
  transparent overlay so back/action buttons stay accessible.
- For in-component title bars (tab screens), delete the title and add a top
  safe-area inset (`useSafeAreaInsets`) to the scroll/list content so the first
  row clears the notch.
- For native Stack headers, use `headerTransparent: true` + transparent
  `headerStyle` + `headerShadowVisible: false`, and pad the content past the
  floating header (`insets.top + ~64`).

## Auth-guard migrations: never blanket-guard an OPTIONAL RPC param

A `SECURITY DEFINER` IDOR guard of the form
`IF <param> IS DISTINCT FROM auth.uid() THEN RAISE 'forbidden'` is correct only
for a **required data-owner** param. For an **optional** param (`DEFAULT NULL`,
e.g. `get_profile.p_current_user_id` — the viewer, not the profile owner) it
breaks every legitimate NULL caller, because `NULL IS DISTINCT FROM auth.uid()`
is TRUE. Here the auth-bootstrap paths (`useSignIn` OTP/password,
`app/_layout` session-restore) call `fetchProfile(self, null)`, so the blanket
guard would `forbidden` every login + cold boot.

- Fix: `IF <param> IS NOT NULL AND <param> IS DISTINCT FROM auth.uid()` —
  permits the documented NULL sentinel, still rejects a non-null spoof.
- Always trace EVERY call site before shipping a behavior-changing auth
  migration — especially imperative calls that run before state/React-Query
  gating hydrates (login, boot), which pass `null` for "no context".
- Service-role test clients (`adminClient`) have `auth.uid() = NULL`, so any
  `adminClient.rpc(<acting_param non-null>)` now fails under these guards. The
  meaningful contract test must authenticate (`signInWithPassword` → JWT), like
  `__tests__/rpc/authz.test.ts`. The pre-existing `adminClient`-based rpc suites
  need converting to authenticated clients (a follow-up); they're `if:false` in CI.

## Running tools in a git worktree: use the tool's own workdir flag

The Bash tool's cwd is the primary repo, not a worktree, and a `cd` is easy to
drop from the command string. To act on a worktree reliably, prefer the tool's
own path flag over `cd`:
- git: `git -C <worktree> ...`
- supabase CLI: `npx supabase --workdir <worktree> ...`
- npm: `npm --prefix <worktree> ci`
`npx vitest`/`npx tsc` resolve config from the worktree automatically when its
`node_modules` is installed there.

## "Emulator" ≠ Android — confirm platform before platform-specific fixes

The user said "emulator" and I assumed Android, shipping an Android-only fix
(`@rnmapbox/maps` `surfaceView={false}`) for what was actually an **iOS
Simulator** bug. On macOS "emulator" loosely covers the iOS Simulator too.
Confirm iOS vs Android before any platform-gated change.

Debugging signature notes for "screen turns black in dev":
- Black that **survives a JS reload** and only clears on a **full app restart**
  = native-side state, not JS (a reload resets all JS/React/Reanimated state).
- But black on **every screen including ones with no map** + **silent (no red
  box, no Metro error)** rules out a single native view (Mapbox) and points at
  the **build/tooling layer** — prime suspects on a bleeding-edge stack:
  experimental **React Compiler** (`experiments.reactCompiler`, rewrites every
  component → breaks on every edit), the New-Arch Fabric Fast Refresh path, or
  the Metro CSS transformer (uniwind/nativewind).
- None of the app's own fallbacks render true black here (splash, loading,
  ErrorBoundary are all `bg-cream`) — a genuinely black screen is a strong tell
  it's the native host/renderer, not a React fallback state.

## ROOT CAUSE (confirmed): `global.css` imported in the provider-heavy root layout

The "black screen on every UI edit, needs full restart" bug was **uniwind +
Metro Fast Refresh**, not Mapbox / React Compiler / native renderer (all ruled
out first — three wrong guesses before instrumenting).

- `app/_layout.tsx` imported `../global.css` at the **root** module, which also
  holds every provider (ErrorBoundary→Supabase→Query→LocationPermission) and
  heavy module-level side effects (`initializeMapbox`, `initMonitoring`,
  `SplashScreen.preventAutoHideAsync`). Per the **uniwind FAQ**, importing
  `global.css` in a provider-heavy module makes Metro Fast Refresh unable to
  patch surgically, so it **re-executes the whole root module** on every UI
  edit → tears down/rebuilds the Fabric tree → black until a full process
  restart (a JS reload doesn't clear the wedged native splash/surface state).
- **Fix:** move `import global.css` out of the root into provider-free layouts
  (`app/(public)/_layout.tsx` + `app/(protected)/_layout.tsx`, which cover all
  routes). Then `npx expo start --clear`.

Debugging technique that cracked it (after Metro/red-box were silent):
- Capture the iOS Simulator **unified log** for just the app process:
  `xcrun simctl spawn booted log stream --predicate 'process == "TinyPlanet"'`
  (needs `dangerouslyDisableSandbox`). JS/Hermes errors do NOT appear there, but
  the lone app-level signal did: a CoreAnimation **"deleted thread with
  uncommitted CATransaction"** warning = view-tree manipulated off the main
  thread and torn down mid-commit → the silent black screen. That pointed at a
  Fast-Refresh-driven full root teardown, which the vendor FAQ then confirmed.
- After 3 failed fixes, STOP guessing and instrument (per systematic-debugging
  Phase 4.5). The unified-log capture + vendor-doc search found it in one pass.

## `post_visibility` enum can't express "friends + mutuals" — gate special posts by their own audience

The `post_visibility` enum (`'friends' | 'mutuals' | 'public'`) maps to mutually
exclusive feed branches in `get_feed_posts`: `'friends'` → direct friends only;
`'mutuals'` → friends-of-friends (FOAF) only — a `'mutuals'` post is **NOT**
shown to a direct friend who shares no mutual friend. So neither enum value means
"friends AND mutuals".

- When a feature's audience is the **union** (e.g. Hangs notify + show to friends
  AND mutuals), don't rely on a single `visibility` value. Add a feature-specific
  `WHERE` branch keyed off the joined object (e.g. `hang.hang_id IS NOT NULL AND
  (<direct-friend EXISTS> OR <mutual EXISTS>)`), independent of `post.visibility`.
- Caught only by an end-to-end check: create as host, RSVP/insert friendship,
  assert the **direct friend's** `get_feed_posts` returns the row. A unit test of
  the function shape would have missed it.

## plpgsql `RETURNS TABLE` column names shadow table columns → "column reference is ambiguous"

A `SECURITY DEFINER` function `RETURNS TABLE (… post_id uuid …)` puts `post_id`
in scope as an OUT variable. A bare `SELECT user_id, post_id INTO … FROM hangs`
then errors `42702: column reference "post_id" is ambiguous` (OUT var vs
`hangs.post_id`). The repo already had a `fix_*_ambiguous_post_id` migration for
travel plans — same trap.

- Always **alias the table** in SELECTs inside such functions:
  `SELECT h.user_id, h.post_id INTO … FROM hangs h WHERE h.id = …`.
- Functions `RETURNS void` (e.g. the delete RPC) don't create these vars, so the
  bare form is fine there — which is why only the update RPC tripped.
- plpgsql does NOT validate the inner `RETURN QUERY` SQL at `CREATE` — only at
  first execution. A clean `supabase db reset` proves syntax, **not** column
  refs / GROUP BY. Execute every read RPC once (psql or an RPC test) to flush
  these out.

## Supabase JS tests: signing in clobbers `adminClient` via the shared GoTrue storage key

`createClient` defaults to `persistSession: true` with a storage key derived from
the URL. Every client for the same local URL (anon, service-role `adminClient`,
per-user clients) shares that key. Calling `anonClient.auth.signInWithPassword`
writes the user's session there, and `adminClient` then sends **that user's JWT**
instead of the service-role key → RLS silently applies, so privileged reads
return null and privileged updates affect 0 rows (symptom: `42501 forbidden` /
"user mismatch", or silently-unchanged rows). The "Multiple GoTrueClient
instances" warning is the tell.

- Fix in tests: sign in with throwaway clients created with
  `{ auth: { persistSession: false, autoRefreshToken: false } }`, and bake the
  token into the per-user client via `global.headers.Authorization`. Then
  `adminClient` is never clobbered.
- This is why the full RPC suite has latent cross-file failures; run a single
  rpc file in isolation, or fix the shared sign-in helper, before trusting a
  red full-suite run. Diff against the baseline (temporarily remove your new
  migrations + `db reset`) to confirm a failure is pre-existing, not yours.
