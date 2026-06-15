# Hangs — Design Handoff

Implementation spec for the **Hang** feature (a lightweight, real-world meetup users create and invite friends/mutuals to). This covers the **selected** visual design for the three surfaces. Behavior is governed by the product PRD; this doc maps that behavior onto concrete UI.

## Files

| File | What it is |
|---|---|
| `docs/hang-mockups/selected.html` | **The chosen design.** Open in a browser. Three frames: Quiet marker + Scene card + Scene detail. |
| `docs/hang-mockups/index.html` | Full exploration — all 3 directions × 3 components, plus the token legend. Reference only. |

Each frame in those files is wrapped in a `<!-- PAPER ARTBOARD · ... -->` comment and a `layer-name`. The markup is intentionally **inline-styled, flex/padding/gap only, SVG icons** — it can be lifted directly, or fed into Paper via `write_html`.

> The mockups render map imagery as a **CSS stylization** (abstract blocks) for portability. In production, replace those with a **real static map snapshot** of the Hang's location — see [Map snapshots](#map-snapshots).

---

## The selected combination

| Surface | Direction | Why |
|---|---|---|
| **Map marker** | **Quiet** (minimal) | A calm pin reads cleanly on a busy map; expands into the richer card/detail. |
| **Feed card** | **Scene** (media-forward) | Leads with a snapshot of the place — the meetup's location is the hook. |
| **Detail view** | **Scene** (map hero) | Full-bleed location hero + overlapping content sheet; premium, place-led. |

Signature accent is **coral**, shared across all three (distinct from Travel-Plans orange and the purple brand).

---

## Design tokens

Add a **Hang accent ramp**. Per the project's token convention, mirror these in **`global.css` (`@theme`)** and **`design-system/colors.ts`** (and the Paper file) — they are synced manually, there are no live tokens.

| Role | Hex | Usage |
|---|---|---|
| `hang` / coral | `#FF6B6B` | Primary CTA fill, pin ring/dot, "Hang" badge text/tint, accent icons (detail) |
| coral pressed | `#E8475F` | Active/pressed CTA state |
| coral tint | `#FFEDEC` | "Hang" badge background, soft surfaces |
| CTA shadow | `rgba(255,107,107,0.4)` | Drop shadow under the filled coral button |

**Reused from the existing system (do not redefine):**

| Role | Hex |
|---|---|
| Cream ground (feed bg) | `#faf9f5` |
| Ink / avatar bg | `#111827` (avatars are **black bg, white initials** — matches the current placeholder style) |
| Body text | `#111827` |
| Muted text | `#6b7280` · captions `#9ca3af` |
| Hairline divider | `#f0f0f0` · borders `#e5e7eb` / `#ececec` |
| Brand purple (unchanged) | `#6b61f3` |

**Type** (Tailwind default sans / `Helvetica Neue` / system-ui): display 700, label 600, body 400. Scale: **27/24** screen titles · **18** card title · **15** row title/name · **14** body · **13** meta · **11–12** small caps. Letter-spacing slightly tight (`-0.01em`) on large display; `0.06–0.12em` on uppercase labels.

**Radii:** card `20`, sheet/artboard `22–24`, buttons `13–14`, tint chips/badges `9999`. **Avatar:** `9999` (circle).

---

## 1. Hang map marker — *Quiet*

**Model on:** `components/MapMarker.tsx` (Mapbox `MarkerView`). New file e.g. `components/HangMarker.tsx`.

**Idle pin:** host avatar (36px, black/white initials) inside a **white circle (50px) with a 2px coral ring** and soft shadow; a **12–16px coral dot** (white border) bottom-right = "this is a Hang."

**Selected → preview callout:** a clean white rounded card (radius 14, hairline border, shadow) above the pin with a small downward pointer:
- `HANG` pill (coral on `#FFEDEC`) · "X going" (muted)
- Title (14/600)
- Clock icon (coral) + `Today · 5:00 PM`

**Behavior:**
- Tap pin → show preview callout. Tap callout → push the **Hang detail** screen.
- Add a **"Hangs"** entry to the map filter set (`MAP_FILTERS` in `app/(protected)/(tabs)/map.tsx`), alongside Travel Plans.
- **Only active, non-expired, non-deleted** Hangs render. Drop the marker the moment a Hang is deleted or its end time passes.

---

## 2. Hang feed card — *Scene*

**Model on:** `design-system/TravelPlanCard.tsx` (it already establishes the "category card" pattern). Rendered by `components/FeedView.tsx`. New file e.g. `design-system/HangCard.tsx`.

**Structure (top → bottom):**
1. **Map banner** (full width, ~152px): static map snapshot of the Hang location + coral pin, with a bottom **legibility gradient** (`linear-gradient(180deg, transparent 45%, rgba(0,0,0,.5))`). Overlaid:
   - `HANG` badge top-left (white on `rgba(0,0,0,.34)`, blurred)
   - Clock + `Today · 5:00 PM` bottom-left (white)
   - Place name bottom-right (white)
2. **Body** (padding 16, gap 12):
   - Host row: avatar 40 + name (15/600) + "invited you · 2h ago" (12/muted) + ⋯ menu
   - Title (18/700)
   - One-line description (14/`#4b5563`)
   - Attendee stack (3× 26px overlapped, 2px white border) + "X going" + like count (right)
   - **Full-width `I'm Going` CTA** (coral fill, white, radius 14, plus icon)

**States:**
- **Not going (default):** filled coral `I'm Going`.
- **Going:** button shows a check + "Going"; attendee stack adds the user; "X going" increments **in real time**.

---

## 3. Hang detail view — *Scene*

**Model on:** `app/(protected)/list/[listId].tsx` (mini-map-topped detail screen). Suggested route `app/(protected)/hang/[hangId].tsx`.

**Hero (full-bleed, ~308px):** static map of the location + top-and-bottom gradient.
- Status bar (white) · floating **back** (left) and **share** (right) in frosted circles
- Bottom overlay: `HANG · TODAY` eyebrow · title (27/700, white) · host row (avatar + "Hosted by Maya Chen") — **host is tappable → profile**

**Content sheet** (white, rounded top, overlaps hero by ~22px; padding 24/20, gap 18):
- **Date row:** calendar icon (coral) + "Thursday, June 12" / "5:00–7:00 PM · ends in 2h"
- **Location row:** pin icon (coral) + "Dolores Park" / address + chevron → **opens Google Maps** (`https://www.google.com/maps/search/?api=1&query=<lat>,<lng>`)
- divider
- **Going · N** header + "See all" → attendee avatar row (30px, +N overflow chip). **All attendee avatars tappable → profile.**
- divider
- **About** + description paragraph
- **Quick actions row:** `Calendar` (Add to Calendar) + `Maps` (Open in Maps), bordered tiles, coral icons
- **Sticky bottom bar:** full-width coral `I'm Going` CTA

**Variants:**
- **Invitee:** sticky `I'm Going` (toggles to "Going ✓" + removes RSVP on second tap).
- **Host:** replace the RSVP bar with **Edit · Delete**; surface them in the header too. Host is auto-"Going".

---

## Behaviors (from PRD) — quick reference

- **Create:** title, description, location (default = current location), date/time (default = now, **max 7 days out**). Host auto-Going. On create → notify eligible friends + mutuals, insert card into their feeds, drop map pin.
- **RSVP:** Going / remove. Updates attendee count + list **in real time**; notifies host on a new Going.
- **Edit (host):** title, description, location, date/time.
- **Delete (host):** remove from feed, map, and all detail views; delete RSVPs; revoke access for recipients.
- **Expiration:** once start/end time passes → remove from map + feed surfaces (no historical view for now).
- **Notifications copy:** create → "*[Host] created a Hang: [Title]*"; RSVP → "*[User] is going to your Hang.*"
- **Permissions:** Host = create/edit/delete/view attendees. Friend/Mutual = view, RSVP, view attendees; **cannot** edit/delete.

**Suggested data model** (mirror `travelPlan`): `hangs` (id, host_id, title, description, lat, lng, place_name, starts_at, ends_at, created_at) + `hang_attendees` (hang_id, user_id, status, created_at). Expiry = `ends_at < now()`.

---

## Reusable building blocks

| Need | Use |
|---|---|
| Avatars (incl. overlap stacks) | `design-system/Avatar.tsx` (black/white). Stacks: overlap via absolute positioning, 2px ground-colored border. |
| Badges / pills | `design-system/Badge.tsx` (add a coral variant) |
| Buttons | `design-system/Button.tsx` (add coral primary) |
| Icons | Existing `Icons` set: clock, calendar, pin, users, chevron, heart, comment, bookmark, share, more, plus/check |
| Map | Mapbox (same as `MapMarker.tsx` / `TravelPlanMarker.tsx`) |

## Map snapshots

Card banner + detail hero need a static image of the Hang's location. Use the **Mapbox Static Images API**:

```
https://api.mapbox.com/styles/v1/<style>/static/pin-s+FF6B6B(<lng>,<lat>)/<lng>,<lat>,14/780x304@2x?access_token=<token>
```

Match the app's existing Mapbox style. Keep the bottom **gradient overlay** for text legibility. (The mockups fake this with CSS blocks — swap for the real snapshot.)
