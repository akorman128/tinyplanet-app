# Edit Contact (reuse the create form)

Goal: let a user edit one of their own contacts, reusing the create form. Mirror the
existing `TravelPlanForm` / `create-travel-plan` / `edit-travel-plan` precedent.

## Plan

- [x] 1. **Types** — extend `UpdateContactInput.location` to allow `null` (clear) in `types/contact.ts`.
- [x] 2. **Hook** — `useUpdateContact` in `hooks/useContacts.ts`: handle `location: null` by
      nulling `location` + `location_name`. Keep `undefined` = leave untouched.
- [x] 3. **Test (TDD)** — added 4 `useUpdateContact` tests to `__tests__/hooks/useContacts.test.tsx`
      (clear-location test written red first). Query/mutation tests only — no UI tests, per repo convention.
- [x] 4. **Shared form** — new `components/ContactForm.tsx`: exports `contactSchema` + `ContactFormData`
      (location folded into schema), renders all fields + `LocationSearchInput`. Props: `control`, `errors`.
- [x] 5. **Refactor create** — `add-contact.tsx` now consumes `ContactForm`; location moved from
      `useState` into the form; import-from-phone + `useCreateContact` behavior unchanged.
- [x] 6. **Edit screen** — new `app/(protected)/edit-contact.tsx` (flat route, `?contactId=`).
- [x] 7. **Entry point** — pencil button in the contact detail header/toolbar, next to trash, `isOwnContact`-gated.
- [x] 8. **Verify** — `tsc --noEmit` clean; ESLint clean on changed files; 73/73 hook tests pass; prettier clean.

## Review

### What changed (7 files)
- **`types/contact.ts`** — `UpdateContactInput.location` widened to `{...} | null` (undefined=untouched,
  null=clear, object=set).
- **`hooks/useContacts.ts`** — `useUpdateContact` now nulls both `location` + `location_name` on
  `location: null`; unchanged otherwise.
- **`components/ContactForm.tsx`** (new) — shared form mirroring `TravelPlanForm`: owns `contactSchema`
  (location folded in as an optional nullable `{name,latitude,longitude}`), renders the 5 inputs +
  `LocationSearchInput` via `Controller`, takes only `control` + `errors`.
- **`app/(protected)/add-contact.tsx`** — replaced inline schema + field JSX + `contactLocation`
  `useState` with `<ContactForm/>`; location now flows through the form. Behavior identical.
- **`app/(protected)/edit-contact.tsx`** (new) — loads the contact via `useGetContacts()` find-by-id
  (the only query exposing lat/lng), `reset()`-prefills, submits via `useUpdateContact`, `router.back()`.
- **`app/(protected)/contact/[contactId].tsx`** — pencil edit button next to trash (Android headerRight
  row + iOS toolbar), gated by `isOwnContact`, routes to `/edit-contact`.
- **`__tests__/hooks/useContacts.test.tsx`** — 4 new `useUpdateContact` tests.

### Notable decisions
- **Location coords on edit** sourced from `useGetContacts()` (RPC returns `ST_X/ST_Y`) rather than
  `useGetContact` (raw PostGIS, no coords) — avoids a new migration and WKB parsing.
- **Prefill gated on coordinates, not name** — so legacy contacts with coords but a null
  `location_name` (pre-`location_name`-column data) don't get their location silently cleared on save.

### Not mine — left untouched
- Pre-existing ESLint warning `'err' is defined but never used` in the contact detail delete handler
  (unrelated to this change; minimal-impact).

---

# Design System Hardening — 4 Slices

Goal: tighten the boundary between the published design system (RN-web-renderable,
synced via `.design-sync/config.json`) and app-level code. Sequence by risk-adjusted
value: tokens → adoption → relocation → one earned abstraction.

Boundary rule applied throughout:
- **In DS** = presentational, renders standalone under react-native-web (no provider,
  no native module), within the token vocabulary.
- **Shared but not DS** = data-coupled or native-dependent → `components/` (+ new `components/map/`).
- Tailwind `rounded-*`/`shadow-*` utility classes already ship in the bundle and are left alone;
  only inline RN `StyleSheet`/`style={{}}` literals are tokenized (no visual regressions: adopt
  only exact-value matches).

## Slice 1 — Tokens (foundation, zero indirection)
- [x] Add `design-system/tokens.ts`: `radius`, `shadow`, `iconSize` scales
- [x] Export tokens from `design-system/index.ts`
- [x] `Button.tsx`: replace local `iconSizes` with shared `iconSize`
- [x] Adopt color tokens for inline literals that already have a token:
      `#faf9f5`→`cream` (_layout, comments, create-{post,list,intro,travel-plan}, map SVG),
      `#9CA3AF`→`placeholder` (Input, ListForm), `#111827`→`gray900` (_layout, ScreenHeader),
      `text-[#9ca3af]`→`text-gray-400` shipped class (GlassInfoCard, InfoRow)
- [x] Adopt `shadow.md` in `create.tsx` (ITEM_SHADOW exact match). list/[listId] & Select
      shadows left inline — NOT exact-value matches, forcing a preset would change visuals
- [x] Adopt `radius.*` for exact-match inline `borderRadius` (Select 8, ColorPicker 12/8, MemberCard 20, theme-editor 16)
- [x] `tsc --noEmit` clean

## Slice 2 — Adoption pass (use already-shipped components)
- [x] Replace full-screen inline `ActivityIndicator` with `LoadingState`:
      search, mutuals, friends, all-vibes (left header save-spinners in
      theme-editor/edit-profile; left boot loader in _layout — different semantics)
- [x] Add `multiline` support to `Input` (textAlignVertical top when multiline)
- [x] Convert create-intro message textarea to `Input multiline` (left specialized emoji/numeric inputs)
- [x] `tsc --noEmit` clean

## Slice 3 — Relocate, correctly
- [x] Move onboarding trio (`ProgressDots`, `PledgeToggle`, `OnboardingBackground`) → `design-system/` (git mv)
- [x] Export trio from `design-system/index.ts`; rewire `sign-up/onboarding.tsx`
- [x] Create `components/map/`; move 7 markers into it (git mv)
- [x] Rewire importers (only `MapView.tsx` imported markers; `map.tsx` did not)
- [x] `tsc --noEmit` clean
- Note: registering trio in `.design-sync/config.json` + recapturing previews is a follow-up
  (runs the sync/capture pipeline) — out of scope for this code change.

## Slice 4 — Extract the one earned abstraction: FormField
- [x] Add `design-system/FormField.tsx` (label + control slot + error), styled to match `Input`
- [x] Export from `design-system/index.ts`
- [x] Adopt in HangForm (`startsAt`) and TravelPlanForm (`startDate`) date pickers — the only
      hand-rolled label+control+error wrappers. PostForm/VibePhoneForm are pure `Input`
      (label/error built in) so they need nothing — NOT force-fitted.
- [x] `tsc --noEmit` clean

## Final verification
- [x] `tsc --noEmit` across project: 0 errors
- [x] ESLint (no --fix) on changed files: clean (tidied 2 pre-existing unused imports in files I touched)
- [x] `vitest run` design-system + components + utils: 24/24 pass (RPC suites need local DB; not touched)

---

## Review

### What changed (≈30 files)
- **Slice 1 — tokens:** new `design-system/tokens.ts` (`radius`, `shadow`, `iconSize`), exported
  from the barrel. `Button` now uses the shared `iconSize`. Inline hex literals that duplicated
  existing tokens swapped to `colors.hex.*`; two arbitrary `text-[#9ca3af]` classes (which would
  NOT ship in the RN-web bundle CSS) swapped to the standard `text-gray-400` class. Adopted
  `shadow.md`/`radius.*` only where the inline value matched a scale step exactly (no visual regressions).
- **Slice 2 — adoption:** 4 full-screen loaders → existing `LoadingState`; `Input` gained
  `multiline` support; create-intro textarea normalized to `Input`.
- **Slice 3 — relocation:** onboarding trio → `design-system/`; 7 Mapbox markers → new
  `components/map/` (native `@rnmapbox/maps` dep means they can never be DS-bundle members).
- **Slice 4 — FormField:** one new presentational wrapper, adopted in the two divergent
  date-picker fields (HangForm used `Body`/`Text`/gray-900; TravelPlanForm used `Label`/`Caption`)
  — now both render identically to `Input` fields.

### Boundary established
The DS = RN-web-renderable + provider-free + presentational + token-vocabulary. The *synced*
bundle is the `.design-sync/config.json` `componentSrcMap` (curated; ~29 of ~50 exports).
Markers fail the native-dep test → `components/map/`. Promotion gate documented at top of file.

### Verification
`tsc --noEmit` clean after every slice and at the end. ESLint clean on changed files. 24/24
non-DB tests pass. RPC suites require a local Supabase and have pre-existing GoTrue-clobber
failures (see lessons.md) — untouched by this frontend-only change.

### Not mine — flagged, left untouched
- `components/VibePhoneForm.tsx`: a pre-existing working-tree edit (dropped `onSelectContact &&`
  guard + double-space typo) was already present when I first read the file. Not my change; left as-is.
- `uniwind-types.d.ts`: pre-existing generated-file diff from session start.

### Follow-ups (deferred by design, behind the gate)
- Register the onboarding trio + `FormField` in `componentSrcMap` and recapture previews (runs the
  sync pipeline; out of scope for a code-only change).
- Deferred new primitives still failing the semantic rule-of-three: `Divider`, `ModalDialog`,
  `StickyFooter`, `InfoCard`, `IconButton`. Closest fast-follows: `ScreenContainer` (5× identical
  cream safe-area wrapper) and the `mx-6` list separator (3× identical).

---

# Remove purple → adopt brand blue

Decision (confirmed via AskUserQuestion): **re-anchor brand to base 500 = #007AFF** (iOS blue).
Rename token scale `purple-*` → `blue-*` so no token is named "purple" while holding blue.

## New blue ramp (global.css @theme + design-system/colors.ts)
blue-50 #F0F7FF (lightest tint, defined — extends the given ramp, replaces purple-50) ·
blue-100 #E6F2FF · blue-200 #C7E2FF (primary.light) · blue-300 #94C7FF · blue-400 #4DA2FF ·
**blue-500 #007AFF (base/brand, primary.DEFAULT)** · blue-600 #0064D1 (pressed/primary.dark) ·
blue-700 #004EA3 · blue-800 #003875 · blue-900 #002247 (darkest)

## Re-anchor mapping (old purple level → new blue token)
50→50 · 100→100 · 200→200 · 300→300 · 400→400 · 500→400 · **600→500 (brand)** · 700→600 · 800→700 · 900→900

## Steps
- [ ] Rewrite `global.css` @theme: blue scale + primary tokens + comments
- [ ] Rewrite `design-system/colors.ts`: hex.blueNNN + primary.{light,DEFAULT,dark} + comments
- [ ] Bulk rename across app/ components/ design-system/ (skip 4 manual files)
- [ ] `OnboardingBackground.tsx`: recolor hex constants + comments (SKY_DEEP plum → deep navy)
- [ ] `LocationPermissionScreen.tsx`: `to-purple-50` → `to-blue-100` (don't flatten gradient)
- [ ] `.design-sync/conventions.md` + `NOTES.md`: doc references
- [ ] Verify: 0 remaining purple / old hexes; typecheck/lint
- [ ] Follow-up note: re-sync DS to claude.ai/design (untracked `.ds-sync`) — user-initiated

## Review (purple→blue) — DONE

**Outcome:** 53 files recolored. `purple-*` token scale renamed to `blue-*` with the provided
ramp; brand re-anchored from purple-600 to **base blue-500 #007AFF**. Zero `purple` left in code;
no old purple hex values remain. `tsc --noEmit` clean; ESLint/Prettier clean on all touched files.

**How:**
- `global.css` @theme: `--color-blue-50…900` (added blue-50 #F0F7FF) + `--color-primary`=#007AFF,
  `--color-primary-dark`=#0064D1, `--color-primary-light`=#C7E2FF.
- `design-system/colors.ts`: `hex.blue50…900` + `primary.{light:blue-200, DEFAULT:blue-500, dark:blue-600}`.
- Bulk re-anchor rename (per the mapping above) across app/ + components/ + design-system/ —
  perl with `(?![0-9])` lookaheads so `purple-50` never ate `purple-500`. Opacity suffixes
  (`/15`, `/70`…) preserved.
- `OnboardingBackground.tsx`: SVG hex constants remapped (sky navy, planet blue, SKY_DEEP plum
  → deep navy #001530, near-white `YOU` de-tinted to #F0F7FF).
- `LocationPermissionScreen.tsx`: gradient `to-purple-50` → `to-blue-100` (kept a gradient
  instead of flattening to from/to-blue-50).
- `.design-sync/conventions.md` + `NOTES.md` doc references updated.

**Verified:** repo-wide grep (0 purple tokens/hex in code) · tsc clean · eslint+prettier clean
on touched files · headless-Chrome swatch+component preview rendered (ramp, brand button #007AFF,
pressed #0064D1, banner/chips/badge, progress dots, onboarding sky) — all read as intended blue.

**Two prettier errors I introduced & fixed:** shorter `blue-*` names let two wrapped JSX strings
fit on one line (PostForm, ActiveTravelPlanBanner); fixed with targeted `prettier --write` (NOT
`expo lint --fix`, which rewrites the whole repo). theme-editor/edit-profile fail prettier at HEAD
too (pre-existing) — left untouched.

**Left untouched (flagged, not in scope):** historical `.claude/plans/*` archives and two dated
design docs (`docs/superpowers/specs/2026-06-16-onboarding-flow-design.md`,
`docs/hang-mockups/HANDOFF.md`) still describe the old purple brand.

**Follow-ups (user-initiated):**
- The Paper design file + the untracked `.ds-sync/ds-dist` build still hold purple — re-sync to
  push blue to claude.ai/design.
- Optionally update the two dated `docs/` specs above for full doc parity.
