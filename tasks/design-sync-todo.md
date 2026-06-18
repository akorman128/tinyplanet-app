# Design-sync: Tiny Planet RN design system → claude.ai/design

## Context / decision
- Repo is Expo/React Native; `design-system/*.tsx` use RN primitives + uniwind (Tailwind-for-RN).
- design-sync renders in a **browser**. Chosen approach: **curated static subset** via a
  react-native-web + uniwind/vite harness (user-approved).
- Architecture (**Path B — hybrid**): Vite pre-compiles components to a clean ESM
  (`react-native`→uniwind-web→RNW resolved; `react`/`react-dom` left external) → feed that ESM
  to the real `package-build.mjs` via `--entry`. Converter externalizes React→window.React and
  emits all contract artifacts (cards, _vendor, styles.css closure, _ds_sync, capture, validate).

## Feasibility — DONE
- [x] Confirmed RN/uniwind shape, no dist/storybook, no RNW.
- [x] Reverse-engineered uniwind web mechanism (vite plugin aliases RN→web components→RNW; className→style at runtime).
- [x] Read design-sync contract (bundle.mjs @ds-bundle header, package-build.mjs flow, source-kit package adapter).
- [x] **Spike PROVEN**: Vite + uniwind/vite + @tailwindcss/vite + RNW renders Button/Badge/Typography
      with correct styling in headless Chrome (verified screenshot). Bundle is NOT self-styling →
      needs compiled Tailwind CSS file (good: becomes _ds_bundle.css in styles.css closure).
      RNW CJS deps need lib→es aliases (inline-style-prefixer, css-in-js-utils).

## Build plan
- [ ] Confirm scope + project name with user
- [ ] Create Claude Design project; record projectId in .design-sync/config.json
- [ ] Harness: .ds-sync/ vite lib build → ESM + CSS (React external, @/utils web-safe alias)
- [ ] Write .design-sync/config.json (pkg, shape=package, srcDir=design-system, componentSrcMap, cssEntry, tsconfig, globalName)
- [ ] Stage converter scripts; run package-build.mjs --entry <vite esm>; self-heal loop until validate exits 0
- [ ] Author previews (.design-sync/previews/<Name>.tsx); capture + grade (headless Chrome); iterate to all-good
- [ ] Incremental upload (open plan at first clean build; push verified batches)
- [ ] conventions.md header; final rebuild; close-out (sentinel/writes/deletes/anchor)
- [ ] NOTES.md; offer commit/PR of durable sync inputs

## Build plan — DONE
- [x] Scope (29 components) + project "Tiny Planet" confirmed
- [x] Created Claude Design project 94270e55-7b6a-4d66-82c3-004b3f506ff3; pinned in config
- [x] Harness: .ds-sync/ Vite lib build → ESM + CSS (React external, @/utils web alias, @source for full CSS)
- [x] config.json (shape=package, srcDir, componentSrcMap, cssEntry, tsconfig, dtsPropsFor, docsMap groups)
- [x] Converter run + validate clean; bundle exports Icons + GlassInfoItem for preview composition
- [x] Authored 29 previews (7 solo + 7 typography by me, 15 via 3 parallel subagents)
- [x] Graded all 29 via headless-Chrome file:// screenshots; fixed Avatar(CSS @source), MenuRow/GlassInfoCard(Icons export), Slider(re-render)
- [x] Grouped into 6 sections; conventions.md header (names verified against built CSS)
- [x] Uploaded all 153 files; list_files confirms count

## Review
**Outcome**: 29 React Native components synced to claude.ai/design, rendering styled in the
browser via a react-native-web + uniwind/vite harness fed into design-sync's converter.
**Quality**: 27/29 graded unambiguously good; Slider + TypingIndicator have headless-capture-only
artifacts (correct in a real browser) — documented in NOTES.md.
**Durable inputs** (committable, reused by future re-syncs): .design-sync/{config.json, NOTES.md,
conventions.md, previews/, groups/}, plus harness files under .ds-sync/ (gitignored).
**Project URL**: https://claude.ai/design/p/94270e55-7b6a-4d66-82c3-004b3f506ff3
