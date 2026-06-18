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
