# Ship PR #1 (staff-review fixes) — with a blocking migration fix first

## Context

PR #1 (`feat/staff-review-fixes`) implements 9 staff-review recommendations. The
headline is a security migration
(`supabase/migrations/20260610120000_enforce_auth_uid_in_security_definer_rpcs.sql`)
that adds an `auth.uid()` guard to 20 `SECURITY DEFINER` RPCs to close an IDOR.
The goal of this task is to ship that PR safely: review the migration, install
the new deps, smoke-test the behavior-changing auth guards, then apply to prod
and merge.

While reviewing (the user specifically asked me to sanity-check `get_profile`), I
found a **blocking false positive**: the migration as written breaks login and
cold-boot for every user. That must be fixed before anything is applied. The rest
of the migration (19/20 guards) and the RLS migration are correct.

---

## 🔴 Blocking finding — `get_profile` guard breaks login (must fix before push)

`get_profile(p_user_id UUID, p_current_user_id UUID DEFAULT NULL)` correctly
guards the **viewer** param (`p_current_user_id`), not the profile being viewed.
But the guard is too strict:

```sql
IF p_current_user_id IS DISTINCT FROM auth.uid() THEN  -- current (broken)
```

`p_current_user_id` is an **optional** param (`DEFAULT NULL`); the function body
already handles NULL via `CASE WHEN p_current_user_id IS NOT NULL THEN
count_mutual_friends(...) ELSE 0 END`. Three client paths pass `null` on purpose
when fetching your **own** profile (mutual-count is irrelevant for yourself):

- `hooks/useSignIn.ts:42` — OTP sign-in → `fetchProfile(supabase, user.id, null)`
- `hooks/useSignIn.ts:67` — password sign-in → `fetchProfile(supabase, data.user.id, null)`
- `app/_layout.tsx:129` — session restore w/ no cached profile → `fetchProfile(supabase, session.user.id, null)`

Because `NULL IS DISTINCT FROM auth.uid()` is `TRUE`, all three now raise
`forbidden (42501)` → **login + cold boot break for everyone.**
(`app/_layout.tsx:104` and `hooks/useLocation.ts:283` pass a real id and are fine.)

### Fix (one line, in the migration on the branch)

```sql
IF p_current_user_id IS NOT NULL AND p_current_user_id IS DISTINCT FROM auth.uid() THEN
  RAISE EXCEPTION 'forbidden: user mismatch' USING ERRCODE = '42501';
END IF;
```

- Allows the documented NULL "no viewer context" sentinel (login/boot paths work).
- Still rejects a **non-null** spoofed viewer id — so the IDOR it actually closes
  (using `get_profile` to compute `count_mutual_friends` between arbitrary users)
  stays closed. Compatible with `__tests__/rpc/authz.test.ts`, which passes a
  non-null other-user id and still expects rejection.
- Nothing is applied yet (no `supabase/.temp` link, migration only on the branch),
  so **amend the migration file in place** on `feat/staff-review-fixes` — no
  follow-up/superseding migration needed.

The other 19 guards are correct: their acting param is the required data-owner and
every client call site passes the real id (`profileState!.id` / session id), gated
by React Query `enabled`. The RLS migration (`...120100_add_missing_rls_policies.sql`)
adds only the `friendships` DELETE policy `useUnfriend` needs — correct and idempotent.

---

## Environment facts that shape the plan

- **No separate staging Supabase.** `config.toml` → `project_id = "tinyplanet"`;
  `.env` → one project URL; no `supabase/.temp/project-ref` (not linked). The
  authz suite + the disabled `rpc-tests` CI job both boot a **local** Supabase
  (ports 54321/54322). → Smoke-test locally (default). Local Supabase provides its
  own service-role key, which the tests need (the app `.env` only has the anon key).
- **Deps were installed on `main`'s working tree, not the branch.** Main now has
  `@sentry/react-native@~7.11.0` (SDK-55-matched, the version the PR recommends) +
  `expo-image` (unrelated WIP). The branch pins `@sentry/react-native@^7.2.0` +
  `babel-plugin-transform-remove-console@^6.9.4`. Expect a package.json/lockfile
  conflict on the sentry line at merge — keep `7.11.0`, add the babel plugin.
- **WIP overlap.** PR touches `app/(public)/_layout.tsx` and `design-system/TabBar.tsx`,
  which are also uncommitted on `main`. Expect minor conflicts there at merge.

---

## Ship steps

Defaults (user didn't pick at plan time; adjust at approval): smoke-test on **local
Supabase**; I do steps 0–3 + local verification, then **pause and hand off** the
irreversible step 4 (prod push) and step 5 (merge).

### 0. Fix the blocker (on `feat/staff-review-fixes`)
- Edit `get_profile` in `...120000_enforce_auth_uid_in_security_definer_rpcs.sql`:
  add `p_current_user_id IS NOT NULL AND` to the guard (above).
- Commit to the branch: `fix(security): allow NULL viewer in get_profile guard`.

### 1. Deps
- On the branch: `npm install` (branch lockfile is already synced → builds locally).
- Optional polish: bump branch `@sentry/react-native` to `~7.11.0` to match SDK 55
  + main, so merge has no version conflict.

### 2. Sentry DSN (safe, local only)
- Add to local `.env` (gitignored):
  `EXPO_PUBLIC_SENTRY_DSN=https://50f4affdd4751f2071279dc53ef05388@o4511548759801856.ingest.us.sentry.io/4511548766093312`
- Confirm `.env.example` (modified by PR) has the empty `EXPO_PUBLIC_SENTRY_DSN=`
  placeholder; monitoring is a no-op without the DSN, so this is opt-in.

### 3. Local smoke test (the "staging" step)
- `supabase start`; migrations apply via `supabase db reset`.
- Export `SUPABASE_URL/ANON_KEY/SERVICE_ROLE_KEY` from `supabase status -o env`,
  then `npx vitest run __tests__/rpc` — exercises the #1 authz contract incl.
  `get_profile` (must pass with the fix).
- Run the app against local and verify behavior changes end-to-end:
  - **Login works** (this is what the fix restores), own feed/messages/locations load.
  - **Unfriend works** (the new `friendships` DELETE RLS policy).
  - Viewing another user's profile still works (target ≠ viewer).

### 4. Prod apply — HAND OFF (irreversible)
Provide exact commands for the user to run with their own credentials:
```
supabase login            # if not already (interactive — run with `! supabase login`)
supabase link --project-ref <tinyplanet ref>
supabase db push          # applies BOTH new migrations
```
Then re-verify login + unfriend in the live app before proceeding.

### 5. Merge PR #1 — HAND OFF
- `gh pr merge 1` after step 4 is verified.
- Reconcile the `package.json`/lockfile sentry-version conflict (keep `7.11.0`) and
  the `_layout.tsx` / `TabBar.tsx` WIP conflicts. User's uncommitted WIP on `main`
  is preserved and can be committed separately whenever.

---

## Verification

- `npx vitest run __tests__/rpc` green against local Supabase (authz contract,
  incl. `get_profile`).
- Manual: login succeeds; own feed/messages/map load; unfriend succeeds; another
  user's profile loads. Before the fix, login would throw `forbidden` — diffing
  that behavior proves the fix.
- `npx tsc --noEmit` + `npx eslint .` stay green on the branch after the edit.

## Optional follow-ups (separate PRs, per user)
- `supabase link` → `npm run gen:types`, adopt `typedRpc` per `docs/SUPABASE_TYPES.md`.
- Enable the `rpc-tests` CI job (remove `if: false`) once comfortable booting local
  Supabase in CI.
- Ratchet the 3 downgraded lint rules (`react/display-name`,
  `react/no-unescaped-entities`, `import/namespace`) back to `error` after a
  map/marker cleanup.

## Lessons (per CLAUDE.md self-improvement loop)
- Record in `tasks/lessons.md`: a blanket `IS DISTINCT FROM auth.uid()` guard on an
  **optional** RPC param breaks legitimate NULL callers; guards on optional/viewer
  params must allow NULL. Always trace every call site (esp. auth-bootstrap paths
  that run before state hydration) before applying behavior-changing auth migrations.
