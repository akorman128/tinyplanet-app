# Extract inline ShapeSources in MapView into their own Marker components

## Context

`components/MapView.tsx` already delegates its avatar/list markers to dedicated
components (`MapMarker`, `HometownMarker`, `ListMarker`), but four Mapbox
`ShapeSource` blocks are still written inline inside the `Mapbox.MapView` JSX:

1. **User location marker** (`id="user-location"`, lines ~161–211) — a Point with
   two `CircleLayer`s and a `SymbolLayer` "You" label.
2. **User→Friend connection lines** (`id="user-to-friend-lines"`, ~214–228) — a
   solid `LineLayer`.
3. **Friend→Mutual connection lines** (`id="friend-to-mutual-lines"`, ~231–246) —
   a dashed `LineLayer` (`lineDasharray: [2, 2]`).
4. **Travel plan destinations** (`id="travel-plan-destinations"`, ~264–310) — a
   `CircleLayer` + rocket `SymbolLayer` + label `SymbolLayer`, with `onPress`.

This makes `MapView.tsx` long and mixes layer styling with map orchestration.
The goal is to move each inline `ShapeSource` into its own component file (the
same organizational pattern as `ListMarker`), leaving `MapView` to compose
markers and own data/handlers only.

Unlike `ListMarker`/`MapMarker`/`HometownMarker` (which use `MarkerView` +
React Native views), these four genuinely need Mapbox `ShapeSource` + layers
(lines, icon labels, text halos). **The extraction is organizational** — the new
components keep the `ShapeSource`/layer approach; we are not rewriting them as
`MarkerView`.

## Approach

Create three new components in `components/` (the two connection-line sources
collapse into one reusable component per the chosen design). Each renders only
its `ShapeSource` + layers; data transforms, visibility conditions, and handlers
stay in `MapView`.

### New: `components/UserLocationMarker.tsx`
- Props: `{ coordinate: [number, number] }`
- Renders the `ShapeSource id="user-location"` exactly as today: builds the inline
  Point Feature from `coordinate` (`properties: { name: "You" }`), with the two
  `CircleLayer`s (`user-marker`, `user-marker-center`) and the `SymbolLayer`
  (`user-label`). Hardcoded styling moves with it (green `#53d769`, white center,
  black halo label).
- `React.memo`, no `onPress`. Mirror `ListMarker`'s file layout (imports → props
  interface → `React.memo` component). Keep `colors` import from `@/design-system`.

### New: `components/ConnectionLines.tsx`
- Props: `{ id: string; shape: GeoJSON.FeatureCollection; dashed?: boolean }`
- Renders a `ShapeSource id={`${id}-lines`}` with one `LineLayer`
  (`id={`${id}-line-layer`}`) styled `lineColor: colors.black, lineWidth: 2,
  lineOpacity: 0.6`, plus `lineDasharray: [2, 2]` only when `dashed`.
- `React.memo`, no `onPress`.

### New: `components/TravelPlanMarker.tsx`
- Props: `{ shape: GeoJSON.FeatureCollection; onPress: (event: { features: GeoJSON.Feature[] }) => void }`
- Renders the `ShapeSource id="travel-plan-destinations"` with its `onPress` and
  the three layers exactly as today: `CircleLayer` (`travel-plan-marker-circles`),
  rocket `SymbolLayer` (`travel-plan-markers`, `iconImage: "rocketIcon"`), and the
  label `SymbolLayer` (`travel-plan-labels`).
- `React.memo`.
- **`<Images>` (rocket icon) stays in `MapView`** — `@rnmapbox/maps` expects image
  registration as a child of `Mapbox.MapView`, and keeping it there avoids
  re-registration churn. `TravelPlanMarker` only references the registered
  `"rocketIcon"` by name.

### Edit: `components/MapView.tsx`
- Add imports for the three new components alongside the existing marker imports.
- Keep the `useMemo` transforms (`connectionLines`, `userToFriendLinesGeoJSON`,
  `friendToMutualLinesGeoJSON`, `travelPlanGeoJSON`), the recenter/camera logic,
  the `<Images>` registration, and all handlers (`handleMarkerPress`) in place.
- Replace the four inline `ShapeSource` blocks with the new components, preserving
  the surrounding render conditions:
  - `{userLocation && <UserLocationMarker coordinate={userLocation} />}`
  - `{mapFilter === "friends" && userToFriendLinesGeoJSON && (`
    `<ConnectionLines id="user-to-friend" shape={userToFriendLinesGeoJSON} />)}`
  - `{mapFilter === "friends" && friendToMutualLinesGeoJSON && (`
    `<ConnectionLines id="friend-to-mutual" shape={friendToMutualLinesGeoJSON} dashed />)}`
  - `{mapFilter === "friends" && travelPlanGeoJSON && (`
    `<TravelPlanMarker shape={travelPlanGeoJSON} onPress={handleMarkerPress} />)}`

### Notes / conventions
- New files use **direct relative imports** (`import { X } from "./X"`), matching
  how `ListMarker`/`MapMarker`/`HometownMarker` are imported. `components/index.ts`
  does **not** export the markers, so it needs no change.
- Preserve every layer `id`, style value, font array, and offset verbatim so the
  rendered map is byte-for-byte identical — this is a pure refactor.

## Critical files
- Create: `components/UserLocationMarker.tsx`
- Create: `components/ConnectionLines.tsx`
- Create: `components/TravelPlanMarker.tsx`
- Edit: `components/MapView.tsx` (imports + replace 4 inline `ShapeSource` blocks)
- Reference pattern: `components/ListMarker.tsx`

## Verification
- **Type check**: run `npx tsc --noEmit` (or the project's typecheck script) — must
  pass with no new errors; confirms props/GeoJSON types line up.
- **Lint**: run the project's eslint if configured.
- **Run the app** (Expo) and confirm, by switching the map filter, that behavior is
  unchanged from `main`:
  - User location: green dot + white center + "You" label renders at the user's
    position.
  - Friends filter with connection lines enabled: solid User→Friend lines and
    dashed Friend→Mutual lines draw identically.
  - Friends filter: travel-plan rocket markers render with their labels and tapping
    one navigates to the profile (`handleMarkerPress`).
- **Diff check**: visually compare against `main` — the only changes should be the
  extraction; no style/id/offset values altered.
