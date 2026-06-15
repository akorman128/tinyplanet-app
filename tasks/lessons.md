# Lessons

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

## "Text not visible" on an image overlay = contrast/scrim, not glyph clipping

When a user reports overlay text (a hero title, caption over a photo/map) is
"not visible / not completely visible", the cause is almost always **white text
over a light/bright background**, not CSS line-height clipping the glyphs. I
guessed `leading-8` was clipping the Hang detail title; the real cause was the
white title sitting above the hero's bottom legibility gradient, over the bright
part of the static map → white-on-white.

- First check: text color vs the actual pixels behind it, and whether the
  gradient/scrim that's supposed to guarantee contrast actually **reaches** the
  text. Overlay blocks anchored at the bottom (`bottom-8`) often extend higher
  than a short scrim covers.
- Fix the legibility mechanism (extend/darken the scrim so it covers the whole
  text block; add a `textShadow` for safety), not the typography.
- Don't infer the cause of a visual bug from the code alone — the user can see
  the screen and you can't. Lead with their diagnosis, or actually render it.