# design-sync notes — Tiny Planet (React Native / uniwind)

This repo is an **Expo / React Native** app, not a web component library. design-sync
renders in a browser, so the sync uses a **react-native-web + uniwind harness** that
pre-compiles the curated components to a browser ESM, which is then fed to the normal
`package-build.mjs` converter via `--entry`.

## Architecture (Path B — hybrid)
- `.ds-sync/vite.lib.config.mjs` builds `.ds-sync/ds-dist/index.mjs` (ESM) + `style.css`:
  - `uniwind/vite` aliases `react-native` → uniwind web components → react-native-web;
    `className` is resolved to DOM class attributes at runtime.
  - `@tailwindcss/vite` compiles the utility classes the components use into `style.css`
    (the bundle is NOT self-styling — this CSS is mandatory; it becomes `_ds_bundle.css`).
  - `react`/`react-dom`/`react/jsx-runtime` are EXTERNAL (kept as bare imports) so the
    converter's esbuild shims them to `window.React`. Everything else is inlined.
- `package-build.mjs --entry .ds-sync/ds-dist/index.mjs --node-modules ./node_modules`
  re-bundles the ESM to the `window.TinyPlanet` IIFE and emits the DS layout. `cfg.cssEntry`
  points at the Vite-built `style.css`.

## Gotchas / decisions
- `.ds-sync/package.json` intentionally has **no `name`** so the converter's entry walk-up
  lands on the repo-root package.json (PKG_DIR = repo) — that's what makes `srcDir`,
  `componentSrcMap`, and `cssEntry` resolve against the repo.
- `@/utils` is aliased to `.ds-sync/utils-web.mjs` because the real barrel re-exports
  `./haptics` (→ native `expo-haptics`). The web alias re-exports the pure helpers and
  stubs the haptic functions (no-ops — they only fire on press, irrelevant to static cards).
- `ThemeTextContext` defaults to `{}`, so components using `useThemeTextStyle()` need NO
  provider. `cfg.provider` is unset.
- `Typography.tsx` exports 8 text styles (SuperHeading/Heading/Subheading/SectionTitle/
  Body/Label/Caption/Meta) — each is a separate component. `GlassInfoCard.tsx` also exports
  `GlassInfoItem` (omitted; subcomponent of GlassInfoCard).
- The `uniwind/vite` plugin rewrites `uniwind-types.d.ts` on every build (cosmetic) — it was
  already dirty (`M`) at session start; left as-is.

## Excluded from scope (won't render faithfully in a browser)
Components depending on reanimated / gesture-handler / Mapbox / svg-animation / `@/hooks` /
Supabase: HangCard, PostCard, TravelPlanCard, MemberCard*, Map*/markers, ColorPicker,
VerticalToggle, AnimatedEmojiBorder, ContactCard, swipeable list items, etc.

## Build/verify recipe (calibrated)
- **Vite CSS is incomplete without an explicit `@source`.** Tailwind's module-graph
  auto-detection missed several component files in the lib build (Avatar/Input classes were
  dropped → invisible components). Fix: `.ds-sync/ds.css` imports `../global.css` AND adds
  `@source "../design-system/**/*.{tsx,ts}"`; `ds-entry.jsx` imports `./ds.css`. Rebuild Vite
  whenever component sources change so the CSS stays complete.
- **Build order**: (1) `node node_modules/vite/bin/vite.js build --config .ds-sync/vite.lib.config.mjs`
  (only when component sources/CSS change) → (2) `node .ds-sync/package-build.mjs --config
  .design-sync/config.json --node-modules ./node_modules --entry ./.ds-sync/ds-dist/index.mjs
  --out ./ds-bundle`.
- **Preview format**: `.design-sync/previews/<Name>.tsx`, each named export = a Capitalized
  component function (rendered via `h(window.__dsPreview[Key])`), importing the component from
  `"tiny-planet"` (→ window.TinyPlanet). Use plain `<div>` wrappers for layout.
- **Props**: auto-extraction yields `[key:string]:unknown` (findTypesRoot lands on repo/types
  which has no component .d.ts). Use `cfg.dtsPropsFor.<Name>` with the meaningful own-props.
- **Grading without Playwright**: screenshot the real card HTML over `file://` with the
  system Chrome — works because the cards use classic scripts (no ES-module CORS):
  `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu
  --force-device-scale-factor=2 --window-size=W,H --virtual-time-budget=2500
  --screenshot=out.png "file://.../ds-bundle/components/general/<Name>/<Name>.html"`.

## Known render warns / limitations (triaged — not defects)
- **Slider**: the thumb/filled-track position can't be captured in HEADLESS screenshots — the
  component measures track width via `onLayout` (ResizeObserver), which doesn't fire under
  headless virtual-time, so `fraction` stays 0 and the thumb pins near the minimum. It renders
  correctly in a real browser (the claude.ai/design DS pane). The preview adds a post-mount
  re-render (`useSettled`) which helps real browsers. Don't "fix" the thumb in static captures.
- **TypingIndicator**: the three dots animate opacity from 0, so they're invisible in a still
  capture; the typing bubble + "<name> is typing…" caption still identify the component.

## Bundle exports beyond the 29 cards
- `ds-entry.jsx` also exports `Icons` (the icon object) and `GlassInfoItem` (GlassInfoCard's
  child) onto `window.TinyPlanet` so previews can compose with them. They are NOT in
  `componentSrcMap`, so they get no card — but previews/agent code can import them.

## Grouping
- Cards are grouped via stub category docs in `.design-sync/groups/<Name>.md`
  (`---\ncategory: <Group>\n---`) wired through `cfg.docsMap`. Groups: Actions, Inputs, Display,
  Typography, Avatars, Navigation.

## Verification note
- `package-validate.mjs` is run with `--no-render-check` (no Playwright installed). Render
  verification was done by screenshotting each card's HTML over `file://` with the system Chrome
  (see recipe above). The `[RENDER_SKIPPED]` warn is expected and is the "1 warning" validate
  reports.

## Re-sync risks
- The harness depends on `react-native-web@0.21.2` + the `inline-style-prefixer`/
  `css-in-js-utils` `lib→es` aliases. If RNW or uniwind upgrades, re-verify the spike render.
- Adding components may surface new RNW CJS deps needing `lib→es` aliases (watch for
  `*.default is not a function` at build) or new native deps to stub.
- Tailwind utility coverage comes from scanning the component sources via the Vite module
  graph — a class built by runtime string concatenation would be missed (these components use
  literal class strings, so OK today).
