# Tiny Planet — how to build with these components

Tiny Planet is a social app for planning low-key, real-world meetups ("hangs"), plus
travel plans, friends, and saved places. These components are the app's real React Native
design system, compiled to run in the browser via react-native-web.

## Setup — no provider needed
Components are available on `window.TinyPlanet.*` and render standalone. There is **no theme
provider to wrap** — render them directly. Load `styles.css` once (it `@import`s the compiled
tokens + utilities) and mount into a dedicated child node, e.g.:

```jsx
const { Button, Heading, Badge, InfoRow } = window.TinyPlanet;

<div style={{ background: "#faf9f5", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
  <Heading>Coffee at Ritual</Heading>
  <InfoRow label="When" value="Sat 7:00 PM" />
  <Badge variant="coral">Hang</Badge>
  <Button variant="primary">Join</Button>
</div>
```

## Styling idiom — uniwind (Tailwind-for-RN) classes
Components are styled internally with Tailwind utility classes (via uniwind) and most accept a
`className` prop to extend them. **Style with utility classes, not arbitrary CSS.** Only classes
the components already use ship in the stylesheet — stay within this vocabulary:

- **Brand colors** (from the `@theme` block): `coral` (#ff6b6b), `coral-pressed`, `coral-tint`;
  the brand purple ramp `purple-50` / `purple-100` / `purple-200` / `purple-600` (brand, #6b61f3)
  / `purple-700` / `purple-900`; `cream` (#faf9f5, the app background). Used as `bg-coral`,
  `text-purple-600`, `bg-purple-100`, etc., alongside standard `gray-*`, `white`, `black`,
  `red-*`, `orange-*`.
- **Layout / spacing**: `flex-row`, `items-center`, `justify-between`, `gap-1`…`gap-4`,
  `px-4`, `py-3`, `w-full`, `rounded-lg`, `rounded-xl`, `rounded-full`, `shadow-xs`.
- For one-off layout glue around components, plain inline `style={{ ... }}` is reliable
  (arbitrary Tailwind classes you invent will NOT be in the shipped CSS).

## The component set
- **Actions**: `Button` (`variant`: primary | secondary | coral; `size`: sm | md | lg),
  `ButtonGroup`, `OptionSelector` (segmented selectors).
- **Inputs**: `Input` (label/error/character-count), `Select`, `Slider`, `CommentInput`,
  `FormField` (label + error wrapper for custom controls like date pickers — matches `Input`'s label/error).
- **Typography**: `SuperHeading`, `Heading`, `Subheading`, `SectionTitle`, `Body`, `Label`,
  `Caption`, `Meta`, and the base `Text`.
- **Display**: `Badge` (six variants), `InfoRow`, `GlassInfoCard` (+ `GlassInfoItem` children),
  `IntroBanner`, `EmptyState`, `ErrorState`, `LoadingState`, `TypingIndicator`.
- **Avatars**: `Avatar` (initials or photo), `AvatarStack` (overlapping, with `+N` overflow).
- **Navigation**: `TabBar`, `MenuRow`, `ScreenHeader`, `ProgressDots` (stepper/pagination dots,
  designed for dark onboarding backgrounds). Icons are on `window.TinyPlanet.Icons.*`.

## Where the truth lives
Read `styles.css` (and the `_ds_bundle.css` it imports) for the exact compiled tokens and
utilities, and each component's `<Name>.d.ts` (its props) and `<Name>.prompt.md` (usage) before
composing.
