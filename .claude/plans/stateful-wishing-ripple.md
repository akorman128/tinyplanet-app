# Add Tiny Planet Design System to Paper

## Context

The user wants their codebase's design system and components documented as a
visual reference inside the Paper file **"Tinyplanet"**
(`01KTQ6PBJVTTBX594T4Z6WEMTY`), which is currently empty (0 artboards). The goal
is a single, well-organized **style-guide board** that faithfully reproduces the
app's actual tokens and components — so design and code share one source of
truth. This is a code → design task: I am **documenting an existing system**, not
inventing one, so I will use the codebase's exact hex values, type scale, spacing,
and component styling rather than generating a new palette/mood brief.

Scope confirmed with user: **Comprehensive** (foundations + core primitives +
composite components). Format confirmed: **single style-guide reference board**.

## Source of truth (read these for exact values during build)

- `design-system/colors.ts` — purple scale + neutral + semantic hex values
- `global.css` — `@theme` color tokens (primary `#6b61f3`, cream `#faf9f5`, purple scale)
- `design-system/Typography.tsx` — the 8 text styles (sizes/weights/colors)
- `design-system/Button.tsx`, `Badge.tsx`, `Avatar.tsx` — already read; values below
- `design-system/Input.tsx`, `ChatInput.tsx`, `MessageBubble.tsx`, `TypingIndicator.tsx`,
  `TabBar.tsx`, `ScreenHeader.tsx`, `MenuRow.tsx`, `Slider.tsx`, `DateSeparator.tsx`
- `design-system/PostCard.tsx`, `TravelPlanCard.tsx`, `ListCard.tsx`,
  `ChannelListItem.tsx`, `FriendRequestItem.tsx`, `CommentItem.tsx`, `PlaceListItem.tsx`
- `design-system/IntroBanner.tsx`, `ActiveTravelPlanBanner.tsx`, `ListChip.tsx`,
  `VibeDisplay.tsx`, `EmptyState.tsx`
- `types/theme.ts` + `utils/themeDefaults.ts` — the 6 profile theme presets (Brat/Fat/Cat/Scat/Chat/Gyatt)

Read each component file immediately before building its specimen to capture exact
padding, radius, and colors — do not eyeball from screenshots.

## Design decisions

- **Font:** Helvetica Neue (confirmed available, all weights). This is the app's
  real iOS system font (`HelveticaNeue` in `global.css`). The 30 Google Fonts in
  `themeDefaults.ts` are a *user profile-customization feature*, not the system
  chrome — they belong in the "Profile theme presets" section, not the board's type scale.
- **Board ground:** white `#FFFFFF` for the documentation surface (clean, honest
  swatches). Cream `#faf9f5` is shown as a token swatch and used as the background
  behind component specimens that sit on cream in the app (cards, tab bar).
- **Artboard:** one desktop-width board, ~1680px wide, `height: fit-content`.
  Multi-column section bands with a consistent left-edge label lane.
- **No mood/palette invention** — the guide's design-brief step is for new designs;
  this reproduces the user's documented system verbatim.

## Confirmed token values (from files already read)

- **Purple scale:** 200 `#c7d2fe`, 400 `#6057db`, 500 `#564ec2`, **600 `#6b61f3` (primary)**,
  700 `#5a52d5`, 800 `#4a44b8`, 900 `#3a369a`
- **Neutrals:** cream `#faf9f5`, white `#ffffff`, gray-300 `#d1d5db`, gray-400/placeholder
  `#9ca3af`, gray-500 `#6b7280`, gray-600 `#4b5563`, gray-900 `#111827`
- **Semantic:** error/red-500 `#ef4444`; warning uses orange-100/700 family; secondary badge uses purple-100
- **Type scale (Helvetica Neue):** SuperHeading 48px/500, Heading 24px/700,
  SectionTitle 18px/500, Subheading 16px/400 gray-600, Body 16px/400, Label 14px/400(→600 in code uses gray-700),
  Caption 14px/400 gray-500, Meta 12px/400 gray-500
- **Spacing (Tailwind 4px base):** 4 / 8 / 12 / 16 / 20 / 24 / 32
- **Radius:** rounded-lg 8, rounded-xl 12, rounded-2xl 16, rounded-full
- **Button:** sm `py-2 px-4 rounded-lg text-sm`, md `py-3 px-6 rounded-xl text-base`,
  lg `py-4 px-8 rounded-xl text-lg`; primary `bg-#6b61f3 text-white`, secondary
  `bg-white border-2 #6b61f3 text-#6b61f3`; disabled primary `bg-gray-300 text-gray-500`
- **Badge:** small `py-0.5 px-2 rounded text-xs`, medium `py-2 px-4 rounded-lg text-sm`,
  semibold; variants default/primary/secondary/warning/error
- **Avatar:** circle, `bg-#6b61f3`, white initials semibold, `border-4 border-white` + shadow;
  sizes 24 / 40 / 55 / 80px
- **MessageBubble:** `max-w-75% rounded-2xl px-4 py-2`; own `bg-#6b61f3 text-white`,
  other `bg-gray-200 text-gray-900`; timestamp text-xs gray-500

## Board layout (top → bottom)

1. **Header band** — "Tiny Planet Design System" (large Helvetica Neue display),
   one-line subtitle, brand note. Asymmetric: big headline + small muted meta.
2. **Foundations**
   - **Color** — Primary purple scale (7 swatches, hex + token name), Neutrals row,
     Semantic row. Each swatch: color chip + name + hex.
   - **Typography** — the 8 named styles as live specimens with spec labels (name / size / weight / color).
   - **Spacing** — 4→32 scale as proportional bars with px labels.
   - **Radius** — 4 sample squares (8/12/16/full) labeled.
   - **Elevation** — shadow-lg and shadow-xl sample cards.
3. **Components** (grouped, each group a labeled sub-band)
   - **Buttons** — primary & secondary × sm/md/lg + disabled states.
   - **Badges** — default/primary/secondary/warning/error × small & medium.
   - **Avatars** — 24/40/55/80 with initials, purple bg, white border.
   - **Form controls** — Input (default / focused / error + label + char count),
     Select, OptionSelector, Slider, ChatInput.
   - **Messaging** — own + other MessageBubble, TypingIndicator, DateSeparator.
   - **Navigation** — TabBar (active/inactive), ScreenHeader, MenuRow.
   - **Cards** — PostCard (avatar+name+time+text+like/comment/save+ListChip),
     TravelPlanCard (orange-50), ListCard (mini-map placeholder + title + category badge + place count).
   - **List rows** — ChannelListItem (unread badge), FriendRequestItem (accept/decline),
     CommentItem (with nested reply), PlaceListItem.
   - **Banners & chips** — IntroBanner, ActiveTravelPlanBanner, ListChip.
   - **States** — EmptyState, VibeDisplay (emoji + count badges).
4. **Profile theme presets** — the 6 fun palettes (Brat/Fat/Cat/Scat/Chat/Gyatt) as
   labeled bg+text color pairs, pulled from `types/theme.ts` / `themeDefaults.ts`.

Repeated rows (color swatches, list rows, type specimens) use **fixed-width slots**
(`flexShrink: 0`) for chips/icons/labels so columns form clean vertical lanes.

## Build sequence (Paper MCP)

Guide already loaded; basic info + fonts already checked. Then:

1. `create_artboard` — white board ~1680px wide, fit-content height.
2. Build **one visual group per `write_html` call** (header → each foundation block →
   each component group). Use `duplicate_nodes` + `update_styles` + `set_text_content`
   for repeated swatches/rows/badges to save tokens.
3. **Mandatory review checkpoints** — `get_screenshot` after each major section
   (foundations done; components done; presets done). Critique spacing, typography,
   contrast, alignment (trace vertical lanes through repeated rows), artboard fit.
   Targeted fixes only — never delete and restart a section.
4. If content clips or leaves a large gap, set artboard `height: fit-content` via
   `update_styles` rather than guessing fixed heights.
5. `finish_working_on_nodes` when complete (mandatory).

## Verification

- Final `get_screenshot` of the whole board; confirm against this checklist:
  primary purple reads as `#6b61f3`; type hierarchy is legible (no <12px body);
  swatch hex labels match `colors.ts`; component specimens match their source files
  (button padding/radius, bubble alignment, avatar sizes, badge variants).
- Spot-check 2–3 specimens with `get_computed_styles` to confirm rendered hex/radius
  match the codebase values.
- Confirm vertical-lane alignment across repeated rows via screenshot trace.
- Report completion to the user with a screenshot; no raw node IDs in user-facing text.
