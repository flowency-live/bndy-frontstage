# FS-05: White Label Events List

**Status:** Specification Complete
**Priority:** Medium
**Created:** 2026-06-01
**Last Updated:** 2026-06-01

---

## Overview

Embeddable/white-label events list component that external sites (venues, promoters, tourism boards, local councils, music blogs) can embed to display BNDY events filtered to their geographic area.

---

## User Stories

### As a venue owner
I want to embed a list of upcoming gigs in my area on my website, so that visitors can discover live music nearby and see my venue featured.

### As a local council / tourism board
I want to embed a curated events feed for our region, so that visitors to our website can discover what's on in our area.

### As a music blog / magazine
I want to embed gig listings for specific postcode areas, so that our readers get relevant local content without us maintaining a separate database.

### As a promoter
I want to embed my events across multiple venue websites with consistent branding, so that tickets are discoverable everywhere.

---

## Geographic Configuration Options

The embed supports multiple methods for defining the geographic area. Consumers choose ONE primary method.

### Option 1: Postcode + Radius (Recommended for MVP)

Simple circular area centred on a UK postcode.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `center` | string | Yes | - | UK postcode (e.g., "M1 1AA", "L1 8JQ") |
| `radius` | number | No | 10 | Distance in miles (5, 10, 25, 50) |
| `unit` | string | No | "miles" | "miles" or "km" |

**Example:**
```html
<div id="bndy-events"
     data-center="M1 1AA"
     data-radius="25">
</div>
<script src="https://live.bndy.co.uk/embed.js"></script>
```

**Technical Implementation:**
- Use existing `getPostcodeLocation()` in [geo.ts](../../src/lib/utils/geo.ts) to resolve postcode to lat/lng
- Use existing `calculateDistance()` Haversine formula for filtering
- Cache postcode resolution (postcodes don't move)

---

### Option 2: Postcode Area(s)

Filter by postcode outward code (first part, e.g., "M", "M1", "CH", "L").

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `areas` | string | Yes | - | Comma-separated postcode areas |

**Example:**
```html
<div id="bndy-events"
     data-areas="M,SK,WA,OL">
</div>
<script src="https://live.bndy.co.uk/embed.js"></script>
```

**Postcode Area Coverage (UK):**
| Area | Region | Example |
|------|--------|---------|
| M | Manchester | M1, M15, M60 |
| L | Liverpool | L1, L8, L18 |
| CH | Chester/Wirral | CH1, CH41 |
| SK | Stockport | SK1, SK14 |
| WA | Warrington | WA1, WA16 |
| OL | Oldham | OL1, OL16 |

**Technical Implementation:**
- Extract outward code from venue postcode
- Simple string prefix match (no API needed)
- Venues table already has `postcode` field

---

### Option 3: Bounding Box

Rectangular area defined by southwest and northeast corners.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `bounds` | string | Yes | - | "swLat,swLng,neLat,neLng" |

**Example:**
```html
<div id="bndy-events"
     data-bounds="53.3,-2.4,53.6,-2.1">
</div>
<script src="https://live.bndy.co.uk/embed.js"></script>
```

**Technical Implementation:**
- Simple lat/lng comparison (no API needed)
- Most efficient for database queries (DynamoDB can filter on numeric ranges)

---

### Option 4: Named Region (Future)

Pre-defined boundaries for common regions.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `region` | string | Yes | - | Region identifier |

**Supported Regions:**
| ID | Name | Coverage |
|----|------|----------|
| `greater-manchester` | Greater Manchester | 10 boroughs |
| `merseyside` | Merseyside | Liverpool city region |
| `cheshire` | Cheshire | Cheshire East/West |
| `lancashire` | Lancashire | County boundary |

**Technical Implementation:**
- Requires ONS boundary data (GeoJSON polygons)
- Point-in-polygon check for each venue
- Cache region membership on venue record

---

### Option 5: Draw on Map (Future - Admin Tool)

Interactive polygon drawing for custom boundaries.

**Admin Flow:**
1. Consumer logs into BNDY partner portal
2. Draws polygon on map
3. Saves as named configuration
4. Gets embed code with config ID

**Example:**
```html
<div id="bndy-events"
     data-config="abc123">
</div>
<script src="https://live.bndy.co.uk/embed.js"></script>
```

**Technical Implementation:**
- Store polygon in DynamoDB as GeoJSON
- Turf.js for point-in-polygon checks
- Partner portal for configuration management

---

## Display Configuration

### Appearance Options

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `theme` | string | "light" | "light", "dark", "auto" |
| `accent` | string | "#6366f1" | Accent colour (hex) |
| `limit` | number | 20 | Max events to show |
| `days` | number | 30 | How far ahead to look |
| `genres` | string | - | Comma-separated genre filter |
| `show-venue` | boolean | true | Show venue name |
| `show-artist` | boolean | true | Show artist name |
| `show-tickets` | boolean | true | Show ticket links |
| `show-map` | boolean | false | Include mini-map |
| `show-branding` | boolean | true | "Powered by BNDY" |

### Layout Options

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `layout` | string | "list" | "list", "grid", "compact", "calendar" |
| `columns` | number | 1 | Grid columns (grid layout only) |
| `height` | string | "auto" | Container height ("auto", "400px", "100vh") |

---

## Full Example

```html
<!-- Manchester area gig listings with dark theme -->
<div id="bndy-events"
     data-center="M1 1AA"
     data-radius="15"
     data-theme="dark"
     data-accent="#ff6b35"
     data-limit="10"
     data-days="14"
     data-genres="rock,indie,punk"
     data-layout="compact"
     data-show-tickets="true"
     data-show-branding="true">
</div>
<script src="https://live.bndy.co.uk/embed.js" async></script>
```

---

## API Endpoint

### GET /api/embed/events

Returns events for embedding, filtered by geographic parameters.

**Query Parameters:**
All `data-*` attributes map to query params (without `data-` prefix).

**Response:**
```json
{
  "events": [
    {
      "id": "evt_123",
      "title": "Friday Night Blues",
      "date": "2026-06-15",
      "time": "20:00",
      "venue": {
        "name": "The Blue Note",
        "postcode": "M1 5QS"
      },
      "artists": [
        { "name": "John Smith Blues Band", "image": "..." }
      ],
      "ticketUrl": "https://...",
      "genre": "blues"
    }
  ],
  "meta": {
    "total": 42,
    "returned": 10,
    "center": { "lat": 53.483, "lng": -2.244 },
    "radius": 15
  }
}
```

**CORS:**
- Allow all origins (public embed)
- Rate limit: 100 req/min per origin

---

## Implementation Phases

### Phase 1: MVP (FS-05a)
- [x] Postcode + radius configuration
- [x] Basic list layout
- [x] Light/dark themes
- [x] "Powered by BNDY" branding
- [x] GET /api/embed/events endpoint

### Phase 2: Enhanced Config (FS-05b)
- [ ] Postcode area filtering
- [ ] Bounding box support
- [ ] Grid and compact layouts
- [ ] Genre filtering
- [ ] Custom accent colours

### Phase 3: Partner Portal (FS-05c)
- [ ] Partner registration
- [ ] Draw-on-map configuration
- [ ] Named region support
- [ ] Analytics dashboard
- [ ] Custom domain CNAME

---

## Technical Notes

### Existing Code to Leverage

| Utility | Location | Usage |
|---------|----------|-------|
| `getPostcodeLocation()` | [geo.ts:26](../../src/lib/utils/geo.ts#L26) | Postcode to lat/lng |
| `calculateDistance()` | [geo.ts:2](../../src/lib/utils/geo.ts#L2) | Radius filtering |
| Event card components | [components/](../../src/components/) | Reuse styling |
| Theme system | [tailwind.config.ts](../../tailwind.config.ts) | Dark mode support |

### New Infrastructure Required

| Component | Description |
|-----------|-------------|
| `/api/embed/events` | Lambda endpoint for filtered events |
| `embed.js` | Client-side embed script (~5KB) |
| CORS configuration | Allow all origins for embed endpoint |
| CDN caching | CloudFront for embed.js and API responses |

### Security Considerations

- No authentication required (public data)
- Rate limiting per origin
- No PII in responses
- HTTPS only
- CSP-compatible embed script

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Embed load time | < 500ms |
| Time to first event | < 1s |
| Embeds deployed | 10 in first month |
| Click-through rate | > 2% |

---

## Related Documents

- [Backlog](../BACKLOG.md)
- [Architecture Audit](../../.docs/bndy-entity-architecture-audit.md)
- [geo.ts utilities](../../src/lib/utils/geo.ts)
