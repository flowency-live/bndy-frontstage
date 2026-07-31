# bndy Gig Map — Full Technical & UX Specification

**Product:** bndy — Keeping LIVE music ALIVE  
**Feature:** Temporal Gig Map  
**Version:** 1.0  
**Date:** April 2026  

---

## 1. Overview

The Gig Map is a full-screen, mobile-first interactive map that lets users discover live music events by scanning a geographic view of NW England. Its distinguishing idea is **time encoded as colour and size**: pins on the map visually convey how soon each event is relative to a user-controlled "focus point" on a timeline scrubber. Dragging the scrubber in real-time repaints every pin on the map without a page reload.

---

## 2. UX Design Specification

### 2.1 Layout

```
┌───────────────────────────────────────────────────┐
│ HEADER  ← back │ Title + subtitle │ [N in focus] ‹ › │
├───────────────────────────────────────────────────┤
│                                                   │
│                                                   │
│              LEAFLET MAP (flex-1)                 │
│         Circle markers coloured by                │
│         temporal state                            │
│                                                   │
│                          ┌──────────────────────┐ │
│                          │ LEGEND (bottom-right) │ │
│                          └──────────────────────┘ │
│   ┌──────────────────────────────────────┐        │
│   │  EVENT CARD (animates in on pin tap) │        │
│   └──────────────────────────────────────┘        │
├───────────────────────────────────────────────────┤
│ TIMELINE PANEL                                    │
│  Focus: 2 May 2026           Window: 3d [7d] 14d  │
│  · · · · · · · · · · · · · · · (date dots)       │
│  ━━━━━━━━━●──────────────────── (range slider)    │
│  2 May                              20 Jun        │
└───────────────────────────────────────────────────┘
```

- Full viewport height (`100dvh`), no scroll. Map fills all available vertical space between header and timeline panel.
- All layers (header, legend, event card, timeline) are CSS-positioned above the map using `z-index` layering.
- Map uses `pointer-events: auto` only on its own layer; overlays are positioned on top.

---

### 2.2 Temporal State System

The entire UX is built around one mental model: **how soon is this gig from where you are looking on the timeline?**

| State | Label | Colour | Hex | Pin Radius | Fill Opacity | Use |
|-------|-------|--------|-----|-----------|-------------|-----|
| Spotlight | "Next Up" | Orange | `#FF6B00` | 16px | 1.0 | Within the active focus window |
| Soon | "Soon" | Amber | `#F59E0B` | 12px | 0.92 | 0–21 days beyond focus window |
| Later | "Later" | Emerald | `#10B981` | 9px | 0.75 | 21–45 days beyond focus |
| Distant | "Distant" | Teal | `#00C2B2` | 7px | 0.55 | 45+ days beyond focus |
| Past | "Past" | Grey | `#6B7280` | 6px | 0.25 | Before the focus date |

**Design rationale:**
- Larger = more urgent. Users can scan the map at a glance and understand urgency by pin size alone.
- Opacity fades with temporal distance. Spotlight events are fully opaque; past events are barely visible ghosts.
- The orange-to-teal gradient maps intuitively to "hot" (imminent) → "cool" (far future).

---

### 2.3 Focus Window

The **focus window** is a number of days (3, 7, or 14) that defines the "spotlight" zone — events falling within `[focusDate, focusDate + windowDays]` are highlighted as Spotlight. The three window sizes appear as pill buttons in the timeline panel.

Changing the window size instantly re-classifies all events and repaints all pins.

---

### 2.4 Timeline Panel

Fixed to the bottom of the screen. Contains:

**Row 1 — Focus label + Window selector**
- Calendar icon + "Focus: 2 May 2026" (updates as slider moves)
- Window buttons: `3d`, `7d`, `14d` — active button uses brand orange, inactive are muted grey

**Row 2 — Event date dots**
- One coloured dot per unique event date, positioned proportionally along the timeline's width
- Dot colour matches the event's current temporal state
- Tapping a dot jumps the focus to that exact date (on mobile, makes it easy to snap to gig clusters)
- Dots use the same PALETTE colours as map pins for visual consistency

**Row 3 — Range slider**
- HTML `<input type="range">` with `step = 86,400,000ms` (one day per step)
- Orange thumb, styled to match brand. Grab cursor on hover.
- Coloured fill track (grey→orange gradient) from left edge to thumb position
- Moving the slider calls `setFocusMs()`, which triggers `useMemo` recomputation of all pin states — no network request, instant

**Row 4 — Start / End labels**
- `2 May` and `20 Jun` (earliest and latest event dates in the dataset)

---

### 2.5 Header

| Element | Behaviour |
|---------|-----------|
| ← back button | Navigates to `/` (events list) using wouter `setLocation` |
| Title "Tour Map" | Static |
| Subtitle | Shows total event count, region |
| `N in focus` badge | Count of events with state = Spotlight. Displayed in orange. Hidden if 0. |
| `‹` / `›` arrows | Step focus backward/forward one event date at a time through the sorted unique date list |

---

### 2.6 Event Detail Card

Triggered by tapping any map pin. Animated slide-up using Framer Motion (`y: 20 → 0`, `opacity: 0 → 1`, `scale: 0.95 → 1`). Positioned just above the timeline panel.

Contents:
- Avatar circle — artist initials (max 2 chars), background = temporal state colour
- State badge — "Next Up" (spotlight), "Soon", "Later", "Distant", or "Past"
- Artist name (bold, large)
- Venue (teal, with MapPin icon)
- Date, time, town (muted, small)
- × close button (top-right)

Tapping the same pin again toggles the card off. Tapping a different pin replaces the card (AnimatePresence handles exit animation).

---

### 2.7 Map Legend

Fixed to the bottom-right, above the timeline panel. Semi-transparent card with backdrop blur. Lists all 5 temporal states with their colour dot and label.

---

### 2.8 Light / Dark Mode

The map tile source switches automatically:
- **Dark:** `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`
- **Light:** `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png`

Pin colours are fixed (they don't change between modes) — they are vivid enough to read on both tile styles.

All overlays (header, legend, card, timeline) use CSS variables from the bndy design token system (`bg-background`, `text-foreground`, etc.) which automatically switch with the `.dark` class on `<html>`.

---

### 2.9 Coordinate Jitter

When multiple events are in the same town, their pins are spread slightly using a golden-angle spiral jitter formula so they do not stack on top of each other:

```
angle = (index × 137.5°) × (π / 180)
lat   = baseLat + sin(angle) × 0.008
lng   = baseLng + cos(angle) × 0.008
```

The 137.5° increment is the golden angle — it distributes points in an even sunflower pattern with no two pins ever doubling up.

---

### 2.10 Map Auto-fit

On initial render, the map auto-fits to show all event coordinates using `L.latLngBounds()` with 40px padding on all sides. This is handled by a small `<FitBounds>` component that calls `useMap()` inside a `useEffect`.

---

## 3. Technical Specification

### 3.1 Stack

| Concern | Library | Version |
|---------|---------|---------|
| Framework | React + Vite | React 19, Vite 7 |
| Routing | wouter | latest |
| Map engine | Leaflet + react-leaflet | 1.9.x + 4.x |
| Animation | Framer Motion | 12.x |
| Styling | Tailwind CSS v4 | 4.x |
| Icons | lucide-react | latest |
| Theme | Custom ThemeProvider (localStorage + CSS class toggle) | — |

---

### 3.2 File Structure

```
artifacts/bndy-events/src/
├── App.tsx                  ← Router: / → EventsPage, /tour-map → TourMapPage
├── pages/
│   ├── EventsPage.tsx       ← Events list with "Tour Map" nav button
│   └── TourMapPage.tsx      ← Tour Map (self-contained, ~420 LOC)
├── data/
│   └── events.ts            ← Event data + TOWN_COORDS + parseEventDate + getEventCoords
└── components/
    └── ThemeProvider.tsx    ← Theme context (dark/light/system)
```

---

### 3.3 Data Model

```typescript
interface Event {
  id: string;
  date: string;        // "Sat 2nd May" — human-readable, parsed by parseEventDate()
  time: string;        // "9:00PM"
  artist: string;
  venue: string;
  town: string;        // Key into TOWN_COORDS
  price: string;
  group: 'This Week' | 'Next Week' | 'Coming Soon';
}

// Internal enriched type (not exported)
interface EnrichedEvent extends Event {
  parsedDate: Date;          // Parsed from `date` string
  coords: [number, number];  // [lat, lng] with jitter applied
  state: TemporalState;      // Computed on each focusMs change
  style: PinStyle;           // Derived from state
}
```

---

### 3.4 State

All state lives in the single `TourMapPage` component — no global store required.

| State | Type | Default | Description |
|-------|------|---------|-------------|
| `focusMs` | `number` | `minMs` (earliest event) | Unix timestamp in ms for the focus date |
| `windowDays` | `number` | `7` | Size of spotlight window in days |
| `selectedId` | `string \| null` | `null` | ID of the tapped event for the detail card |

---

### 3.5 Core Logic Functions

#### `temporalState(eventDate, focusDate, windowDays) → TemporalState`

```typescript
function temporalState(eventDate: Date, focusDate: Date, windowDays: number): TemporalState {
  const diff = (eventDate.getTime() - focusDate.getTime()) / 86_400_000; // days
  if (diff < 0)              return 'past';
  if (diff <= windowDays)    return 'spotlight';
  if (diff <= 21)            return 'soon';
  if (diff <= 45)            return 'later';
  return 'distant';
}
```

#### `pinStyle(state) → PinStyle`

Returns Leaflet `CircleMarker` path options + radius for the given temporal state.

#### `parseEventDate(dateStr) → Date`

Parses strings like `"Sat 2nd May"` or `"Fri 19th Jun"` by:
1. Splitting on space → `[dayOfWeek, ordinalDay, month]`
2. Stripping ordinal suffix (`parseInt` handles `"2nd"`, `"15th"` etc.)
3. Looking up the month in a static map → `new Date(2026, month, day)`

#### `getEventCoords(town, index) → [lat, lng]`

1. Looks up base coordinates in `TOWN_COORDS`
2. Applies golden-angle jitter using the event's array index to avoid pin stacking

---

### 3.6 Key `useMemo` Chains

```
events (static)
    ↓ once on mount
enriched[]  (parsedDate + coords added)
    ↓ on focusDate or windowDays change
enrichedWithState[]  (state + style added per event)
    ↓ drives
CircleMarkers (map pins)  +  EventCard  +  eventDates (timeline dots)
```

All recomputation is synchronous and in-memory — no async, no network calls on interaction.

---

### 3.7 Map Configuration

```typescript
<MapContainer
  center={[53.38, -2.35]}    // Approximate centroid of NW England
  zoom={9}                   // Shows ~80km radius — covers all venues
  style={{ width: '100%', height: '100%' }}
  zoomControl={false}        // Hidden — map auto-fits on load
  attributionControl={false} // Attribution shown via TileLayer prop
>
```

**Tile provider:** CartoDB (free, no API key required for reasonable usage)  
**Tile subdomains:** a, b, c, d (default)  
**Attribution:** © CARTO, © OpenStreetMap contributors

---

### 3.8 Z-Index Layering

| Layer | z-index | Notes |
|-------|---------|-------|
| Leaflet map | 0 | flex-1 div with `z-index: 0` |
| Leaflet internal panes | 200–600 | Managed by Leaflet |
| Legend | 1000 | Absolute, bottom-right |
| Timeline panel | 1000 | Fixed bottom overlay |
| Event card | 1001 | Renders above timeline |
| Header | 1002 | Renders above everything |

---

### 3.9 Dependencies (package.json additions)

```json
{
  "leaflet": "^1.9.4",
  "react-leaflet": "^4.2.1",
  "@types/leaflet": "^1.9.x"
}
```

The `leaflet/dist/leaflet.css` is imported at the top of `TourMapPage.tsx` — this is required or markers/tiles will not render correctly.

---

### 3.10 Performance Notes

- All 31 events (~50 with jitter variants) render as SVG `<circle>` elements inside Leaflet's overlay pane. No canvas mode needed at this scale.
- `useMemo` on `enrichedWithState` prevents re-mapping all events on every render. Only `focusDate` or `windowDays` change triggers it.
- Timeline slider uses `step={86_400_000}` (1-day granularity) to limit the number of slider positions to ~50, avoiding high-frequency repaints.
- `key={${event.id}-${event.state}}` on `CircleMarker` forces React to remount markers when state changes, ensuring Leaflet's path options update correctly.

---

## 4. Interaction Flows

### Flow A — Browse map on load
1. Page renders → `FitBounds` runs once → map zooms to show all 31 event pins
2. Focus = earliest event date (2 May) with 7-day window
3. Events 1–2 (2 May) appear as large orange Spotlight pins
4. Events on 9 May appear amber (7 days out, "Soon")
5. Later events appear green/teal and small

### Flow B — Drag timeline to explore
1. User drags orange thumb right toward June
2. `onChange(ms)` fires → `setFocusMs(ms)`
3. `enrichedWithState` recomputes → all pins update colour + size
4. "N in focus" badge count updates
5. Focus date label updates
6. User can see which gig cluster lights up as they move through time

### Flow C — Tap a date dot
1. User taps a coloured dot above the slider track
2. `onChange(ms)` fires with that event's exact date
3. Slider thumb jumps to that position
4. Map repaints with those events in Spotlight

### Flow D — Inspect an event
1. User taps a CircleMarker on the map
2. `setSelectedId(event.id)` fires
3. `EventCard` animates up from below the map
4. Shows artist, venue, date, time, town with temporal badge
5. Tap × or tap the same pin again to dismiss

### Flow E — Step through event dates
1. User taps `›` (ChevronRight) in header
2. `stepFwd()` finds the next event date after current `focusMs`
3. `setFocusMs(next.parsedDate.getTime())`
4. Slider jumps, map repaints — like a slideshow of gig clusters

---

## 5. Accessibility

| Concern | Implementation |
|---------|----------------|
| Back button | `aria-label="Back"` |
| Theme toggle | `aria-label="Toggle theme"` |
| Date step buttons | `aria-label="Previous date"` / `"Next date"` |
| Range slider | Native `<input type="range">` — keyboard-accessible (arrow keys work) |
| Date dot buttons | `title={label}` tooltip on hover |
| Event card close | Focusable `<button>`, keyboard operable |
| Colour-only legend | Text labels accompany every colour dot |

---

## 6. Brand Tokens Used

| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `#FF6B00` | Spotlight pins, badges, slider thumb, active window button |
| `--secondary` | `#00C2B2` | Distant pins, venue text |
| `--background` | `#0A0F1E` (dark) / `#F8F9FA` (light) | Page + overlay backgrounds |
| `--foreground` | `#F0F2F7` (dark) / `#1A1D2E` (light) | All body text |
| `--muted` | `#1E2640` (dark) / `#E9ECEF` (light) | Inactive buttons, track |
| `--border` | `rgba(255,255,255,0.08)` (dark) | Card and panel borders |

---

## 7. Future Enhancements

| Enhancement | Notes |
|-------------|-------|
| Artist filter | Filter pins by artist — add multi-select chip row below header |
| Cluster markers | Use `react-leaflet-markercluster` for dense areas at low zoom |
| Live data | Replace static `events.ts` with API endpoint; add SWR/react-query |
| Directions | "Get directions" button in EventCard → opens Google Maps / Apple Maps deeplink |
| Share link | Encode `focusMs` + `windowDays` in URL query params for shareable state |
| Venue photos | Add a venue image field to Event; show thumbnail in EventCard |
| Geolocation | Auto-set focusDate to today; animate map to user's nearest events |
| Push notifications | "Remind me" button → subscribe to Web Push for events in Spotlight window |
