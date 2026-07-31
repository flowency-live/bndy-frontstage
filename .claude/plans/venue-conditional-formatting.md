# Venue Map Conditional Formatting - Performance Plan

## Problem Statement
Venue map pins should visually indicate whether the venue has future events scheduled. Currently all venue pins look identical regardless of activity.

## Architecture Analysis

### Current Data Flow
```
MapboxMap.tsx
├── useAllPublicEvents({ enabled: mapMode === "events" })  // Only fetches in events mode
├── useVenues()  // Always fetches (10min cache)
└── VenueMarkerLayer
    └── venuesToGeoJSON(venues)  // No event relationship
        └── Mapbox GeoJSON source → GPU rendering
```

### Key Performance Constraints
1. ~250 venues, ~100-300 events at any time
2. Mapbox clustering handles rendering at GPU level
3. Events already cached (5min staleTime)
4. Both marker layers stay mounted (visibility toggled)

---

## Recommended Approach: Client-Side Join

**Why this approach:**
- Zero backend changes required
- Events data already cached in React Query
- Single useMemo to create venueIds Set = O(n) one-time cost
- Mapbox data-driven styling = GPU-level rendering
- No additional API calls

### Performance Budget
| Operation | Cost |
|-----------|------|
| Extract venueIds from events | O(n) ~0.1ms for 300 events |
| Create Set | O(n) ~0.05ms |
| Pass Set to GeoJSON | O(m) ~0.2ms for 250 venues |
| Mapbox repaint | GPU, <16ms |

---

## Implementation Plan

### Phase 1: Enable Events Fetch in Venue Mode

**File:** `src/components/mapbox/MapboxMap.tsx`

Currently events only fetch when `mapMode === "events"`:
```typescript
const { data: allEvents = [] } = useAllPublicEvents({
  startDate,
  endDate,
  enabled: mapMode === "events",  // ← Change this
});
```

**Change to:** Always fetch (uses cache anyway)
```typescript
const { data: allEvents = [] } = useAllPublicEvents({
  startDate,
  endDate,
  enabled: true,  // Always fetch, cache handles efficiency
});
```

### Phase 2: Create venueIdsWithEvents Set

**File:** `src/components/mapbox/MapboxMap.tsx`

Add memoized Set creation:
```typescript
// Compute venue IDs that have upcoming events
const venueIdsWithEvents = useMemo(() => {
  const ids = new Set<string>();
  allEvents.forEach(event => {
    if (event.venueId) ids.add(event.venueId);
  });
  return ids;
}, [allEvents]);
```

### Phase 3: Pass Set to VenueMarkerLayer

**File:** `src/components/mapbox/MapboxMap.tsx`

```typescript
<VenueMarkerLayer
  venues={filteredVenues}
  venueIdsWithEvents={venueIdsWithEvents}  // ← New prop
  onVenueClick={handleVenueClick}
  visible={mapMode === "venues"}
/>
```

### Phase 4: Update VenueMarkerLayer Props

**File:** `src/components/mapbox/VenueMarkerLayer.tsx`

```typescript
interface VenueMarkerLayerProps {
  venues: Venue[];
  venueIdsWithEvents: Set<string>;  // ← New prop
  onVenueClick: (venue: Venue) => void;
  visible: boolean;
}
```

### Phase 5: Update venuesToGeoJSON

**File:** `src/components/mapbox/MapboxMarkers.ts`

Add `hasEvents` property to GeoJSON features:
```typescript
export function venuesToGeoJSON(
  venues: Array<{ id: string; name: string; location: { lat: number; lng: number } }>,
  venueIdsWithEvents?: Set<string>
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: venues
      .filter((v) => v.location?.lat && v.location?.lng)
      .map((venue) => ({
        type: "Feature" as const,
        properties: {
          id: venue.id,
          name: venue.name,
          hasEvents: venueIdsWithEvents?.has(venue.id) ?? false,  // ← New property
        },
        geometry: {
          type: "Point" as const,
          coordinates: [venue.location.lng, venue.location.lat],
        },
      })),
  };
}
```

### Phase 6: Data-Driven Styling in VenueMarkerLayer

**File:** `src/components/mapbox/VenueMarkerLayer.tsx`

Update unclustered layer paint to use conditional colors:
```typescript
map.addLayer({
  id: VENUE_UNCLUSTERED_LAYER,
  type: "circle",
  source: VENUE_SOURCE_ID,
  filter: ["!", ["has", "point_count"]],
  paint: {
    // Larger radius for venues with events
    "circle-radius": [
      "case",
      ["get", "hasEvents"], 8,  // Has events: larger
      6                          // No events: default
    ],
    // Green for venues with events, pink for no events
    "circle-color": [
      "case",
      ["get", "hasEvents"], "#22C55E",  // Green = has upcoming events
      "#FF1493"                          // Pink = no events
    ],
    "circle-stroke-width": [
      "case",
      ["get", "hasEvents"], 2,  // Thicker stroke for emphasis
      1.5
    ],
    "circle-stroke-color": "#FFFFFF",
  },
});
```

### Phase 7: Update Source Data with Set

**File:** `src/components/mapbox/VenueMarkerLayer.tsx`

Update all calls to `venuesToGeoJSON` to include the Set:
```typescript
// In init:
map.addSource(VENUE_SOURCE_ID, {
  type: "geojson",
  data: venuesToGeoJSON(venues, venueIdsWithEvents),
  cluster: true,
  clusterMaxZoom: 11,
  clusterRadius: 30,
});

// In data update effect:
source.setData(venuesToGeoJSON(venues, venueIdsWithEvents));
```

### Phase 8: Keep venueIdsWithEvents Ref Updated

**File:** `src/components/mapbox/VenueMarkerLayer.tsx`

```typescript
const venueIdsWithEventsRef = useRef(venueIdsWithEvents);

useEffect(() => {
  venueIdsWithEventsRef.current = venueIdsWithEvents;
}, [venueIdsWithEvents]);
```

### Phase 9: Add Data Update Effect for Events Changes

**File:** `src/components/mapbox/VenueMarkerLayer.tsx`

```typescript
// Update GeoJSON when events change (affects hasEvents property)
useEffect(() => {
  if (!map || !isMapReady) return;

  try {
    const source = map.getSource(VENUE_SOURCE_ID) as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(venuesToGeoJSON(venues, venueIdsWithEvents));
    }
  } catch {
    // Source not ready
  }
}, [map, isMapReady, venueIdsWithEvents]);
```

---

## Visual Design Options

### Option A: Color Differentiation (Recommended)
- **Has events:** Green (#22C55E) - 8px radius, 2px stroke
- **No events:** Pink (#FF1493) - 6px radius, 1.5px stroke

### Option B: Opacity Differentiation
- **Has events:** Full opacity (1.0)
- **No events:** Faded (0.4)

### Option C: Size Only
- **Has events:** 10px radius
- **No events:** 6px radius

---

## Files Changed Summary

| File | Changes |
|------|---------|
| `src/components/mapbox/MapboxMap.tsx` | Enable events fetch always, create venueIdsWithEvents Set, pass to VenueMarkerLayer |
| `src/components/mapbox/VenueMarkerLayer.tsx` | Accept new prop, update refs, pass Set to GeoJSON, add events update effect |
| `src/components/mapbox/MapboxMarkers.ts` | Add optional venueIdsWithEvents param to venuesToGeoJSON, add hasEvents property |

---

## Testing

1. **Visual verification:**
   - Create test event for a venue
   - Verify venue pin changes color/size
   - Delete event, verify pin reverts

2. **Performance verification:**
   - Open venue mode with 250 venues
   - Should render <100ms
   - Toggle events/venues mode - no flicker

3. **Edge cases:**
   - Venue with 0 events (pink)
   - Venue with 1+ events (green)
   - Events in past (should NOT highlight)
   - Events loading state (show default until loaded)

---

## Rollback Plan

If performance issues arise, the changes are isolated:
1. Remove `venueIdsWithEvents` prop from VenueMarkerLayer
2. Revert venuesToGeoJSON signature
3. Remove conditional paint expressions
