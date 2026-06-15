# Fix Purple Scale + Recolor Buttons (in code)

## Context

The "Tiny Planet" purple color system is inconsistent: the scale skips `100` and `300`, and its values don't ramp light→dark — `purple-600 #6b61f3` (the brand) is actually *lighter* than `purple-500 #564ec2` and `purple-400 #6057db`, so the ramp dips light in the middle. (Originally this was a Paper design-file task, but the Paper MCP weekly limit was hit, so we're applying the equivalent changes **directly in the codebase** instead.)

**Stack:** Expo / React Native with Tailwind via **Uniwind**. Colors live in two coordinated places, buttons in one:
- `global.css` — `@theme` CSS custom properties (the Tailwind tokens `bg-purple-600`, etc.)
- `design-system/colors.ts` — JS hex constants (`colors.hex.purple600`) for RN components that need raw hex
- `design-system/Button.tsx` — `primary` / `secondary` variants

**Confirmed with user:** full **9-step ramp 100→900**, brand `#6b61f3` kept at **purple-600**; primary button = **black bg + white text**; secondary button = **gray-300 bg + black text, no border**.

**Key risk control:** `purple-600 #6b61f3` (the brand, 50+ usages) is **unchanged**. Only the lighter/darker steps shift and 100/300 are added, so the dominant brand color is stable and regression risk is low.

---

## Part 1 — Fix the purple ramp

New monotonic light→dark ramp (hue ≈ 245°, brand anchored at 600). Average-brightness is strictly decreasing 50→900, so it's guaranteed monotonic:

| Step | New hex | vs. current |
|------|---------|-------------|
| purple-50  | `#f7f6fe` | **new** (consistency add — see note) |
| purple-100 | `#efedfe` | **new** |
| purple-200 | `#dedbfd` | was `#c7d2fe` |
| purple-300 | `#c7c1fb` | **new** |
| purple-400 | `#a79ef8` | was `#6057db` |
| purple-500 | `#8b81f6` | was `#564ec2` |
| purple-600 | `#6b61f3` | **unchanged (brand)** |
| purple-700 | `#5249c9` | was `#5a52d5` |
| purple-800 | `#3c359b` | was `#4a44b8` |
| purple-900 | `#29246e` | was `#3a369a` |

> **Note on purple-50:** Not in the literal "100→900" ask, but the app uses `purple-50` in ~9 places and it currently falls back to Tailwind's off-hue default `#faf5ff` (pinkish). Defining it in-hue keeps the light end coherent. Included but easy to drop if unwanted.

### Edit `global.css` (the `@theme` block, lines 12–29)
Replace the purple scale with the 10 steps above, and re-sync the two brand aliases that mirror ramp steps:
- `--color-primary-light: #c7d2fe` → `#dedbfd` (tracks purple-200)
- `--color-primary-dark: #5a52d5` → `#5249c9` (tracks purple-700)
- `--color-primary: #6b61f3` stays.

### Edit `design-system/colors.ts` (the `hex` object, lines 38–45)
Update the purple hex values to match the table and add `purple50`, `purple100`, `purple300`. Keep `purple600: "#6b61f3"`. Existing consumers of `purple200/400/500/700/800/900` will shift to the new ramp values — intended.

---

## Part 2 — Recolor buttons (`design-system/Button.tsx`)

Three one-line edits in the style maps (lines 15, 16, 26); leave the `disabled*` maps untouched:

| Line | Current | New |
|------|---------|-----|
| 15 `variantStyles.primary` | `bg-purple-600 active:bg-purple-700` | `bg-black active:bg-gray-800` |
| 16 `variantStyles.secondary` | `bg-white border-2 border-purple-600 active:bg-gray-50` | `bg-gray-300 active:bg-gray-400` |
| 26 `textStyles.secondary` | `text-purple-600` | `text-black` |

- Primary text (`textStyles.primary: "text-white"`, line 25) is already white — **no change**.
- Secondary's `border-2 border-purple-600` is dropped entirely ("remove the border color").
- `active:` states keep a subtle press feedback (one shade darker). `bg-black`/`text-black`/`gray-800` resolve from Tailwind defaults (the codebase already uses `black` and the gray scale).

### Out of scope
- `disabled` button styles — not mentioned; left as-is.
- Ad-hoc `bg-purple-600` buttons elsewhere (inline `TouchableOpacity`s, if any) — the design-system `Button` is the target. Sweeping inline buttons can be a follow-up if desired.

---

## Verification

1. **Typecheck / lint** the three changed files (e.g. `npx tsc --noEmit` and the project's lint script) — confirms `colors.ts` and `Button.tsx` are valid and no references broke.
2. **Grep** for `purple-50`, `purple-100`, `purple-300`, `colors.hex.purple100/300` usages to confirm the newly-defined steps render as intended rather than Tailwind fallbacks.
3. **Run the app** (Expo) and visually confirm:
   - Primary `Button` = solid black, white label; secondary = gray-300 fill, black label, no purple outline.
   - A screen using the purple scale shows a smooth light→dark ramp with no mid-ramp light dip; brand purple-600 surfaces look unchanged.
4. Spot-check that brand-heavy screens (the ~50 `purple-600` usages) are visually unchanged, since that token didn't move.
