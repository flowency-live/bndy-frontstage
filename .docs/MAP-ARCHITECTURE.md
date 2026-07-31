# BNDY Map Architecture - Technical Reference

> **Stable reference commit:** `eb233d9` (before Deck.gl experiments)
> **Last updated:** 2026-07-03

---

## Data Loading Summary

**YES - All data is API-driven at runtime.**

| Dataset | API Call | When Fetched | Record Count |
|---------|----------|--------------|--------------|
| All Venues | `GET /api/venues` | On first render | **1,431 venues** |
| Events (date range) | `GET /api/events/public?startDate=X&endDate=Y` | On first render + when date filter changes | **~297/week** |
| All Future Events | `GET /api/events/public?startDate=today` (no endDate) | On first render (for venue highlighting) | **2,434 events** |

### Data Loading Triggers

1. **First Render:** All three queries fire immediately via react-query
2. **Date Filter Change:** Only the "Events (date range)" query re-fetches
3. **Mode Toggle (Events↔Venues):** No new fetch - data already cached
4. **Stale Time:** Events 5min, Venues 10min (then background refetch)

### Full Payload Files

See these files for actual API responses:
- [venues_full_payload.json](.docs/venues_full_payload.json) - 1,431 venues
- [events_thisweek_payload.json](.docs/events_thisweek_payload.json) - 297 events (2026-07-03 to 2026-07-10)
- [events_allfuture_payload.json](.docs/events_allfuture_payload.json) - 2,434 future events

---

## Overview

The map supports two modes controlled by `mapMode` in `ViewToggleContext`:
1. **Events Mode** - Plots live events for a selected date range, grouped by venue location
2. **Venues Mode** - Plots all venues, highlighting those with future events

Both modes use:
- **Mapbox GL JS** for WebGL-based tile rendering
- **GeoJSON sources** with built-in clustering
- **Diffed HTML markers** (not native Mapbox symbols) for neon styling
- **Info overlays** for click interaction

---

## 1. Events Map View

### 1.1 Data Flow

```
User selects date → useAllPublicEvents(startDate, endDate) → API call
                                   ↓
                          Transform DynamoDB → Event[]
                                   ↓
                          Apply date filter (isDateInRangeUniversal)
                                   ↓
                          Apply search filter (artist/venue fuzzy match)
                                   ↓
                          Group by locationKey ("lat,lng")
                                   ↓
                          Convert to GeoJSON (eventsToGeoJSON)
                                   ↓
                          Mapbox source with clustering
                                   ↓
                          useDiffedMarkers → HTML markers
```

### 1.2 API Endpoint

**URL:** `GET /api/events/public?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`

**Response format from DynamoDB:**
```typescript
interface DynamoDBEvent {
  id: string;
  title?: string;           // Event name (newer)
  name?: string;            // Event name (legacy)
  date: string;             // "YYYY-MM-DD"
  startTime?: string;       // "HH:MM" (defaults to "21:00" if missing)
  endTime?: string;
  venueId: string;
  venueName?: string;
  venueCity?: string;
  venue?: { city?: string };
  artistId?: string;
  artistName?: string;
  geoLat: number;           // Venue latitude
  geoLng: number;           // Venue longitude
  description?: string;
  ticketed?: boolean;
  ticketinformation?: string;
  ticketUrl?: string;
  eventUrl?: string;
  source?: string;          // "bndy.live" | "user" | "bndy.core"
  status?: string;          // "pending" | "approved" | "rejected"
  createdAt: string;
  updatedAt: string;
  isOpenMic?: boolean;
  postcode?: string;
  hasCustomTitle?: boolean;
}
```

### 1.3 Frontend Event Type (After Transformation)

```typescript
interface Event {
  id: string;
  name: string;             // title || name || 'Unnamed Event'
  date: string;
  startTime: string;
  endTime?: string;
  venueId: string;
  venueName: string;
  venueCity?: string;
  artistIds: string[];      // [artistId] if exists
  artistName?: string;
  location: {
    lat: number;
    lng: number;
  };
  description?: string;
  ticketed?: boolean;
  ticketinformation?: string;
  ticketUrl?: string;
  eventUrl?: string;
  source: EventSource;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
  isOpenMic?: boolean;
  postcode?: string;
  hasCustomTitle?: boolean;
}
```

### 1.4 Date Filtering

The `dateRange` state can be:
- `"today"` / `"thisWeek"` / `"thisWeekend"` / `"nextWeek"` / `"nextWeekend"` - Named ranges
- `"YYYY-MM-DD"` - Specific date (from MapDateStrip picker)

Filtering logic in `MapboxMap.tsx`:
```typescript
const { startDate, endDate } = getFormattedDateRangeUniversal(dateRange);
// Then: useAllPublicEvents({ startDate, endDate })

// Additional client-side filter for UI consistency:
let dateFiltered = eventsOnly.filter((event) => {
  const eventDate = new Date(event.date);
  return isDateInRangeUniversal(eventDate, dateRange);
});
```

### 1.5 Location Grouping

Multiple events at the same venue are grouped by `locationKey`:

```typescript
const locationGroups: Record<string, Event[]> = {};
searchFiltered.forEach((event) => {
  if (!event.location) return;
  const locationKey = `${event.location.lat},${event.location.lng}`;
  if (!locationGroups[locationKey]) {
    locationGroups[locationKey] = [];
  }
  locationGroups[locationKey].push(event);
});
```

Only **one marker per location** is rendered; clicking opens all events at that location.

### 1.6 GeoJSON Conversion

```typescript
// MapboxMarkers.ts
function eventsToGeoJSON(events): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: events
      .filter((e) => e.location?.lat && e.location?.lng)
      .map((event) => ({
        type: "Feature",
        properties: {
          id: event.id,
          name: event.name,
          date: event.date,
          venueName: event.venueName,
          locationKey: `${event.location.lat},${event.location.lng}`,
        },
        geometry: {
          type: "Point",
          coordinates: [event.location.lng, event.location.lat],
        },
      })),
  };
}
```

### 1.7 Mapbox Source Configuration

```typescript
map.addSource("events", {
  type: "geojson",
  data: eventsToGeoJSON(events),
  cluster: true,
  clusterMaxZoom: 11,      // Stop clustering at zoom 12+
  clusterRadius: 40,       // Pixels
});

// Invisible anchor layer (keeps tiles processed for querySourceFeatures)
map.addLayer({
  id: "event-anchors",
  type: "circle",
  source: "events",
  paint: { "circle-radius": 1, "circle-opacity": 0 },
});
```

### 1.8 Marker Rendering (useDiffedMarkers)

The `useDiffedMarkers` hook:
1. Queries features from the GeoJSON source on `moveend`/`sourcedata`
2. Builds marker specs (clustered vs single)
3. Diffs against previous render
4. Creates/removes/repositions HTML marker elements

**Cluster marker spec:**
```typescript
{
  key: `ec:${clusterId}`,
  lngLat: [lng, lat],
  opts: { type: "cluster", count: pointCount, kind: "gig" },
  onClick: () => expandCluster(clusterId),
}
```

**Single event marker spec:**
```typescript
{
  key: `e:${locationKey}`,
  lngLat: [exactLng, exactLat],
  opts: {
    type: "gig",
    isTonight: date.startsWith(todayISO),
    label: count > 1 ? venueName : eventName,
    sub: count > 1 ? `${count} gigs` : venueName,
  },
  onClick: () => onEventClick(eventsAtLocation),
}
```

### 1.9 Event Info Overlay

When a marker is clicked:
```typescript
const handleEventClick = (events: Event[]) => {
  // Sort by date then startTime
  const sortedEvents = [...events].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA.getTime() - dateB.getTime();
    }
    if (a.startTime && b.startTime) {
      return a.startTime.localeCompare(b.startTime);
    }
    return 0;
  });
  setSelectedEvents(sortedEvents);
  setShowEventOverlay(true);
};
```

`EventInfoOverlay` receives all events at that location, displays the first as the "hero" and others as tappable sibling rows.

---

## 2. Venues Map View

### 2.1 Data Flow

```
Page load → useVenues() → GET /api/venues
                ↓
        Transform DynamoDB → Venue[]
                ↓
        Apply search filter (name fuzzy match)
                ↓
        Compute venueIdsWithEvents (from allFutureEvents)
                ↓
        Convert to GeoJSON (venuesToGeoJSON)
                ↓
        Mapbox source with clustering + clusterProperties
                ↓
        useDiffedMarkers → HTML markers (pink=live, cyan=idle)
```

### 2.2 API Endpoint

**URL:** `GET /api/venues`

**Response format (array of venues):**
```typescript
interface DynamoDBVenue {
  id: string;
  name: string;
  nameVariants?: string[];
  googlePlaceId?: string;
  location_object?: { lat: number; lng: number };
  latitude?: number;        // Legacy
  longitude?: number;       // Legacy
  address: string;
  city?: string;
  postcode?: string;
  description?: string;
  profileImageUrl?: string;
  phone?: string;
  email?: string;
  website?: string;
  socialMediaUrls?: any[];
  facilities?: string[];
  validated: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### 2.3 Frontend Venue Type (After Transformation)

```typescript
interface Venue {
  id: string;
  name: string;
  nameVariants?: string[];
  googlePlaceId?: string;
  location: {               // Normalized from location_object OR lat/lng
    lat: number;
    lng: number;
  };
  address: string;
  city?: string;
  postcode?: string;
  description?: string;
  profileImageUrl?: string;
  phone?: string;
  website?: string;
  socialMediaUrls?: any[];
  facilities?: string[];
  validated: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### 2.4 Venue Highlighting (hasEvents)

Two separate event queries:
1. **Current date range events** - for event markers
2. **All future events** (no endDate) - for venue highlighting

```typescript
// Fetch ALL future events (for venue highlighting)
const { data: allFutureEvents = [] } = useAllPublicEvents({
  startDate: todayStr,
  endDate: undefined,  // No end date = all future
  enabled: true,
});

// Compute which venues have ANY future events
const venueIdsWithEvents = useMemo(() => {
  const ids = new Set<string>();
  allFutureEvents.forEach(event => {
    if (event.venueId) ids.add(event.venueId);
  });
  return ids;
}, [allFutureEvents]);
```

### 2.5 GeoJSON Conversion

```typescript
// MapboxMarkers.ts
function venuesToGeoJSON(venues, venueIdsWithEvents?: Set<string>): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: venues
      .filter((v) => v.location?.lat && v.location?.lng)
      .map((venue) => ({
        type: "Feature",
        properties: {
          id: venue.id,
          name: venue.name,
          hasEvents: venueIdsWithEvents?.has(venue.id) ?? false,
        },
        geometry: {
          type: "Point",
          coordinates: [venue.location.lng, venue.location.lat],
        },
      })),
  };
}
```

### 2.6 Mapbox Source Configuration

```typescript
map.addSource("venues", {
  type: "geojson",
  data: venuesToGeoJSON(venues, venueIdsWithEvents),
  cluster: true,
  clusterMaxZoom: 10,      // Stop clustering at zoom 11+
  clusterRadius: 30,
  clusterProperties: {
    // Aggregate: cluster is "live" if ANY member has events
    hasLive: ["any", ["to-boolean", ["get", "hasEvents"]]],
  },
});
```

### 2.7 Marker Rendering

**Cluster marker spec:**
```typescript
{
  key: `vc:${clusterId}`,
  lngLat: [lng, lat],
  opts: {
    type: "cluster",
    count: pointCount,
    kind: hasLive ? "venue-live" : "venue-idle"  // Pink vs cyan
  },
  onClick: () => expandCluster(clusterId),
}
```

**Single venue marker spec:**
```typescript
{
  key: `v:${venueId}`,
  lngLat: [exactLng, exactLat],
  opts: {
    type: "venue",
    hasGigs: Boolean(hasEvents),     // Pink if true, cyan if false
    label: venueName,
    sub: hasGigs ? "live gigs" : undefined,
    labeled: zoom >= 13 || (hasGigs && zoom >= 11),  // Show name pill
  },
  onClick: () => onVenueClick(venue),
}
```

### 2.8 Venue Info Overlay

```typescript
const handleVenueClick = (venue: Venue) => {
  setSelectedVenue(venue);
  setShowVenueOverlay(true);
};

// VenueInfoOverlay receives:
<VenueInfoOverlay
  venue={selectedVenue}
  isOpen={showVenueOverlay}
  onClose={handleVenueOverlayClose}
  position="map"
  upcomingEvents={allFutureEvents}  // For "upcoming gigs" section
  onEventSelect={(event) => handleEventClick([event])}
/>
```

---

## 3. Marker Styling

CSS classes in `src/styles/markers.css`:

| Class | Usage |
|-------|-------|
| `.bndy-mk` | Base marker container |
| `.bndy-mk-gig` | Event marker (orange glow) |
| `.bndy-mk-gig.tonight` | Tonight's event (brighter pulse) |
| `.bndy-mk-venue` | Venue marker |
| `.bndy-mk-venue.live` | Venue with events (pink glow) |
| `.bndy-mk-venue.idle` | Venue without events (cyan, dimmer) |
| `.bndy-mk-cluster` | Cluster marker with count badge |

---

## 4. Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `MapView.tsx` | `src/components/` | Outer container, date strip, filters |
| `MapboxMap.tsx` | `src/components/mapbox/` | Main map logic, data fetching, overlays |
| `EventMarkerLayer.tsx` | `src/components/mapbox/` | Event GeoJSON source + marker rendering |
| `VenueMarkerLayer.tsx` | `src/components/mapbox/` | Venue GeoJSON source + marker rendering |
| `useDiffedMarkers.ts` | `src/components/mapbox/` | Efficient HTML marker diffing |
| `MapboxMarkers.ts` | `src/components/mapbox/` | GeoJSON conversion functions |
| `EventInfoOverlay.tsx` | `src/components/overlays/` | Event detail sheet |
| `VenueInfoOverlay.tsx` | `src/components/overlays/` | Venue detail sheet |

---

## 5. Data Payload Examples

### 5.1 Events API Response (Condensed)

```json
{
  "events": [
    {
      "id": "evt_abc123",
      "title": "Rock Night",
      "date": "2026-07-05",
      "startTime": "20:00",
      "venueId": "ven_xyz789",
      "venueName": "The Blue Moon",
      "artistId": "art_def456",
      "artistName": "The Rockers",
      "geoLat": 53.4808,
      "geoLng": -2.2426,
      "ticketed": true,
      "ticketUrl": "https://tickets.example.com/123",
      "isOpenMic": false,
      "source": "bndy.live",
      "status": "approved"
    }
  ]
}
```

### 5.2 Venues API Response (Condensed)

```json
[
  {
    "id": "ven_xyz789",
    "name": "The Blue Moon",
    "address": "123 High Street",
    "city": "Manchester",
    "postcode": "M1 1AA",
    "location_object": { "lat": 53.4808, "lng": -2.2426 },
    "googlePlaceId": "ChIJxyz123",
    "validated": true,
    "website": "https://bluemoon.pub"
  }
]
```

### 5.3 GeoJSON for Events Source

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": "evt_abc123",
        "name": "Rock Night",
        "date": "2026-07-05",
        "venueName": "The Blue Moon",
        "locationKey": "53.4808,-2.2426"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-2.2426, 53.4808]
      }
    }
  ]
}
```

### 5.4 GeoJSON for Venues Source

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": "ven_xyz789",
        "name": "The Blue Moon",
        "hasEvents": true
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-2.2426, 53.4808]
      }
    }
  ]
}
```

### 5.5 ACTUAL Venue Record (from API)

```json
{
  "id": "b8181b19-bfdf-4c6f-829d-422add0bfd0d",
  "name": "Shavington Social Club",
  "address": "116 Crewe Rd, Shavington, Crewe CW2 5DL, UK",
  "city": null,
  "latitude": 53.064808299999996,
  "longitude": -2.444134,
  "location": {
    "lng": -2.444134,
    "lat": 53.064808299999996
  },
  "googlePlaceId": "ChIJq4Jj8YH1ekgRbdA5PS8mobo",
  "website": "https://www.facebook.com/shavington.club/",
  "validated": true,
  "nameVariants": [],
  "phone": "",
  "postcode": "",
  "facilities": [],
  "socialMediaUrls": ["https://www.facebook.com/shavington.club/"],
  "profileImageUrl": null,
  "externalIds": [],
  "standardTicketed": false,
  "standardTicketInformation": "",
  "standardTicketUrl": "",
  "enrichment_status": "high_confidence",
  "enrichment_date": "2025-11-30T14:08:41.232Z"
}
```

### 5.6 ACTUAL Event Record (from API)

```json
{
  "artistId": "d80e3e0a-78ca-4b8c-ae55-4b270b85930a",
  "membershipId": null,
  "createdByUserId": null,
  "date": "2026-07-03",
  "artistIds": ["d80e3e0a-78ca-4b8c-ae55-4b270b85930a"],
  "venueId": "ed1384a2-4c95-4072-8b22-1f9b25da0e0a",
  "isPublic": true,
  "id": "ed1f126f-0fe8-4937-8439-c951ff19b4c1",
  "isAllDay": false,
  "artistNames": ["No band on tonight"],
  "geoLat": 54.9546512,
  "createdAt": "2026-06-29T03:05:53.838Z",
  "external_ids": [
    {
      "id": "2026-07-03_no-band-on-tonight_crown-and-cannon-winlaton",
      "source": "onthecase-daily-import"
    }
  ],
  "source": "onthecase-daily-import",
  "verifiedByArtist": false,
  "verifiedByVenue": false,
  "startTime": "21:00",
  "geohash4": "gcyb",
  "endTime": "00:00",
  "artist_id": "d80e3e0a-78ca-4b8c-ae55-4b270b85930a",
  "updatedAt": "2026-07-03T11:01:57.805Z",
  "collaboratingArtistIds": [],
  "geoLng": -1.7276318,
  "geohash6": "gcyb8s",
  "title": "No band on tonight @ Crown and Cannon",
  "type": "gig",
  "artistName": "No band on tonight",
  "venueName": "Crown and Cannon",
  "venue": {
    "city": "Winlaton"
  }
}
```

---

## 6. Performance Considerations

1. **No viewport filtering** - All events/venues loaded at once, clustering handles density
2. **Stale time** - Events: 5min, Venues: 10min (react-query)
3. **Marker diffing** - Only creates/removes markers that changed
4. **Invisible anchor layer** - Keeps GeoJSON tiles processed for `querySourceFeatures`
5. **Refs for callbacks** - Prevents closure stale data in async handlers

---

## 7. Known Limitations

1. **Events grouped by exact coordinates** - Two venues at slightly different coords show separate markers
2. **Cluster expansion** - Uses Mapbox's `getClusterExpansionZoom`, may over-zoom
3. **HTML markers** - More expensive than native symbols, but required for neon CSS effects
4. **Single event query per mode** - No progressive loading or pagination
