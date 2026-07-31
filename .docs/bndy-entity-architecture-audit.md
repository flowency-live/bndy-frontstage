# BNDY Technical Audit: Events, Venues, and Artists Entity Management

**CTO-Level Technical Assessment**
**Date: 2026-05-04**

---

## Executive Summary

BNDY is a 100% serverless platform (Lambda + API Gateway + DynamoDB + Cognito + S3) managing live music events across the UK. This audit examines the complete data architecture and flow for the three core entities: **Events**, **Venues**, and **Artists**.

**Key Findings:**
- DynamoDB entity-specific tables (not true single-table design)
- UUID v4 for all primary keys (no composite keys for core entities)
- Events have many-to-many relationship with artists via `artistId` + `collaboratingArtistIds`
- Events have many-to-one relationship with venues via `venueId`
- Geospatial indexing via geohash fields for map-based queries
- External ID system for MCP integration and de-duplication

---

## 1. Record Counts & Data Health

**Snapshot Date:** 2026-05-04

### 1.1 Entity Totals

| Table | Total Records |
|-------|---------------|
| `bndy-events` | **1,644** |
| `bndy-venues` | **866** |
| `bndy-artists` | **775** |
| `bndy-users` | **16** |
| `bndy-artist-memberships` | **13** |
| `bndy-artist-venues` | **96** |

### 1.2 Event Type Breakdown

| Event Type | Count | % of Total |
|------------|-------|------------|
| `gig` | 1,522 | 92.6% |
| `unavailable` | 104 | 6.3% |
| `rehearsal` | 12 | 0.7% |
| `other` | 3 | 0.2% |
| `available` | 2 | 0.1% |
| `public_gig` | 1 | 0.1% |

### 1.3 Entity Usage Analysis

#### Venues

| Category | Count | % of Total |
|----------|-------|------------|
| **Total Venues** | 866 | 100% |
| Venues with events (active) | 579 | **66.9%** |
| Venues without events (orphaned) | 287 | **33.1%** |

#### Artists

| Category | Count | % of Total |
|----------|-------|------------|
| **Total Artists** | 775 | 100% |
| Artists with events (active) | 431 | **55.6%** |
| Artists without events (orphaned) | 344 | **44.4%** |

### 1.4 Data Health Observations

**Orphaned Entities:**
- **287 venues** (33%) have never been associated with an event
- **344 artists** (44%) have never been associated with an event

**Potential Causes:**
1. MCP-imported entities that haven't been matched to events yet
2. AI-created entities (`ai_created: true`) pending validation
3. Entities created for future use but never utilized
4. Failed event creation flows leaving partial data

**Recommendations:**
1. Add `needs_review` flag audit for orphaned entities
2. Consider cleanup job for entities older than 90 days with no events
3. Add GSI on `createdAt` for efficient orphan queries

---

## 2. Database Schema & IDs

### 1.1 Technology Stack

- **Database:** DynamoDB (eu-west-2)
- **Billing:** Pay-Per-Request
- **API:** HTTP API Gateway v2

### 1.2 Core Tables

| Table | Primary Key | Sort Key | Description |
|-------|-------------|----------|-------------|
| `bndy-events` | `id` (UUID) | - | All events: gigs, rehearsals, availability |
| `bndy-venues` | `id` (UUID) | - | Venue locations with Google Places |
| `bndy-artists` | `id` (UUID) | - | Artists/bands with profiles |
| `bndy-artist-memberships` | `id` (UUID) | - | User-to-artist relationships |
| `bndy-artist-venues` | `id` (UUID) | - | Artist-venue CRM relationships |
| `bndy-users` | `cognito_id` | - | User profiles |

### 1.3 ID Generation

**All IDs use UUID v4 via `crypto.randomUUID()`:**

```javascript
// events-lambda/handler.js:1095
const eventId = crypto.randomUUID();

// venues-lambda/handler.js:555
id: require('crypto').randomUUID(),
```

### 1.4 Global Secondary Indexes (GSIs)

**bndy-events Table:**

| GSI Name | Partition Key | Sort Key | Purpose |
|----------|---------------|----------|---------|
| `artistId-date-index` | `artistId` | `date` | Query artist events by date |
| `ownerUserId-date-index` | `ownerUserId` | `date` | Query user unavailability |
| `venueId-date-index` | `venueId` | `date` | Query venue events |
| `geohash4-date-index` | `geohash4` | `date` | Geo-spatial queries |

**bndy-artist-memberships Table:**

| GSI Name | Partition Key | Purpose |
|----------|---------------|---------|
| `user_id-index` | `user_id` | Find all artists a user belongs to |
| `artist_id-index` | `artist_id` | Find all members of an artist |

**Note:** `bndy-venues` and `bndy-artists` use table scans (no GSIs).

---

## 3. Entity Data Models

### 3.1 Event

**Source:** `bndy-serverless-api/events-lambda/handler.js`

```typescript
interface Event {
  // Primary Key
  id: string;                      // UUID v4

  // Entity Type (XOR - sparse GSI pattern)
  artistId?: string;               // If present: artist event
  ownerUserId?: string;            // If present: user event

  // Core Fields
  type: 'gig' | 'public_gig' | 'practice' | 'available' | 'unavailable';
  date: string;                    // YYYY-MM-DD
  title?: string;
  startTime?: string;              // HH:MM
  endTime?: string;
  endDate?: string;                // Multi-day events

  // Venue Relationship
  venueId?: string;                // FK to bndy-venues

  // Multi-Artist Support
  collaboratingArtistIds?: string[]; // Additional artists

  // Geospatial (public events)
  geoLat?: number;
  geoLng?: number;
  geohash6?: string;               // 6-char precision
  geohash4?: string;               // 4-char for GSI

  // Metadata
  isPublic: boolean;
  isAllDay: boolean;
  notes?: string;
  source?: string;                 // 'bndy.live' | 'frontstage' | 'mcp'
  external_ids?: Array<{source: string; id: string}>;

  // Recurring Events
  recurring?: {
    type: 'day' | 'week' | 'month' | 'year';
    interval: number;
    duration: 'forever' | 'count' | 'until';
    count?: number;
    until?: string;
  };

  // Timestamps
  createdAt: string;
  updatedAt: string;
}
```

### 3.2 Venue

**Source:** `bndy-serverless-api/venues-lambda/handler.js`

```typescript
interface Venue {
  // Primary Key
  id: string;                      // UUID v4

  // Core Fields
  name: string;
  address: string;
  city?: string;
  postcode?: string;

  // Location
  latitude: number;
  longitude: number;
  location_object?: { lat: number; lng: number };
  google_place_id?: string;

  // Profile
  website?: string;
  phone?: string;
  profile_image_url?: string;
  social_media_urls?: Array<{platform: string; url: string}>;
  facilities?: string[];

  // Name Variants (for fuzzy matching)
  name_variants?: string[];

  // Ticket Defaults
  standard_ticketed?: boolean;
  standard_ticket_information?: string;
  standard_ticket_url?: string;

  // Enrichment
  validated: boolean;
  ai_created?: boolean;
  needs_review?: boolean;
  created_source?: string;
  enrichment_status?: string;
  enrichment_data?: object;
  enrichment_date?: string;

  // External Integration
  external_ids?: Array<{source: string; id: string}>;

  // Timestamps
  created_at: string;
  updated_at: string;
}
```

### 3.3 Artist

**Source:** `bndy-serverless-api/artists-lambda/handler.js`

```typescript
interface Artist {
  // Primary Key
  id: string;                      // UUID v4

  // Core Fields
  name: string;
  artist_type?: 'band' | 'solo' | 'duo' | 'trio' | 'group' | 'dj' | 'collective';
  bio?: string;

  // Location
  location?: string;               // Text description
  locationLat?: number;
  locationLng?: number;
  locationType?: string;

  // Profile
  profileImageUrl?: string;
  displayColour?: string;          // Hex color for UI
  genres?: string[];
  actType?: ('originals' | 'covers' | 'tribute')[];
  acoustic?: boolean;

  // Social Media
  facebookUrl?: string;
  instagramUrl?: string;
  websiteUrl?: string;
  youtubeUrl?: string;
  spotifyUrl?: string;
  twitterUrl?: string;
  socialMediaUrls?: Array<{platform: string; url: string}>;

  // Settings
  publishAvailability?: boolean;
  showMemberVotes?: boolean;
  autoDiscardThreshold?: number;
  allowedEventTypes?: string[];

  // Ownership
  owner_user_id?: string;
  claimedByUserId?: string;

  // Verification
  isVerified: boolean;
  validated?: boolean;

  // External Integration
  external_ids?: Array<{source: string; id: string}>;
  source?: string;
  ai_created?: boolean;
  needs_review?: boolean;

  // Stats
  followerCount?: number;

  // Timestamps
  createdAt: string;
  updatedAt?: string;
}
```

---

## 4. Entity Relationships

### 4.1 Architecture Diagram

```
                          BNDY DATA ARCHITECTURE
============================================================================

                               [bndy-users]
                               PK: cognito_id
                                    |
                   +----------------+----------------+
                   |                                 |
                   v                                 v
         [bndy-artist-memberships]           [bndy-events]
         PK: id                              type: 'unavailable'
         GSI: user_id-index                  FK: ownerUserId
         GSI: artist_id-index
                   |
                   v
             [bndy-artists]
             PK: id
                   |
                   +------------------------+
                   |                        |
                   v                        v
           [bndy-events]              [bndy-artist-venues]
           type: 'gig'|'practice'     PK: id
           FK: artistId               FK: artist_id
           FK: venueId                FK: venue_id
                   |                        |
                   v                        v
             [bndy-venues] <----------------+
             PK: id

============================================================================

RELATIONSHIPS:
- User (1) ----< (N) Memberships (N) >---- (1) Artist
- Artist (1) ----< (N) Events
- Venue (1) ----< (N) Events
- Artist (N) ----< (N) Artist-Venues (N) >---- (N) Venues
- Event can have MULTIPLE artists via artistId + collaboratingArtistIds[]
```

### 4.2 Event-Artist Relationship

Events support **multi-artist** scenarios:

```javascript
// From events-lambda/handler.js:336
const existingArtistIds = [
  existingEvent.artistId,
  ...(existingEvent.collaboratingArtistIds || [])
].filter(Boolean);
```

The primary artist is stored in `artistId`, additional artists in `collaboratingArtistIds[]`.

### 4.3 Event-Venue Relationship

Events reference venues via `venueId` foreign key:

```javascript
// From events-lambda/handler.js:1122-1131
if (eventData.venueId) {
  newEvent.venueId = eventData.venueId;
}
```

When events are created, geohash fields are computed from venue location for geo-queries.

### 4.4 Venue Location Cascade

When venue location changes, events are updated:

```javascript
// From venues-lambda/handler.js:138
async function cascadeLocationToEvents(venueId, newLatitude, newLongitude) {
  // Query all events for this venue using the GSI
  const eventsResult = await dynamodb.query({
    TableName: 'bndy-events',
    IndexName: 'venueId-date-index',
    KeyConditionExpression: 'venueId = :venueId',
    // ... updates geoLat, geoLng, geohash6, geohash4
  });
}
```

---

## 5. Event Creation Flow

### 5.1 Authenticated Event Creation (Backstage)

**Endpoint:** `POST /api/artists/{artistId}/events`
**Handler:** `handleCreateArtistEvent` in `events-lambda/handler.js`

```
1. [Frontend] User submits event form
                |
2. [API Gateway] POST /api/artists/{artistId}/events
                |
3. [Lambda] Verify JWT from bndy_session cookie
                |
4. [Lambda] Check membership OR platformAdmin
                |
5. [Lambda] Validate required fields (type, date)
                |
6. [Lambda] If public event: validate venueId required
                |
7. [Lambda] If gig with venueId: ensureVenueRelationship()
                |
8. [Lambda] Generate UUID, set timestamps
                |
9. [DynamoDB] PUT event to bndy-events
                |
10. [Lambda] clearAvailabilityForDates() (async)
                |
11. [Lambda] triggerNotification() (async Lambda invoke)
                |
12. [Response] Return created event
```

### 5.2 Community Event Creation (Frontstage)

**Endpoint:** `POST /api/events/community`
**Purpose:** Public users can submit events without authentication

```
1. [Frontend] User fills community event form
                |
2. [API Gateway] POST /api/events/community
                |
3. [Lambda] No auth required
                |
4. [Lambda] Validate artistId, venueId, date, startTime
                |
5. [Lambda] Check for duplicate by externalId
                |
6. [Lambda] Check for duplicate by venue+date+artist
                |
7. [Lambda] Compute geohash from venue location
                |
8. [Lambda] ensureVenueRelationship() (auto-create CRM entry)
                |
9. [DynamoDB] PUT event with source='frontstage'
                |
10. [Response] Return {success: true, event: {...}}
```

### 5.3 Duplicate Detection

**By External ID:**

```javascript
// events-lambda/handler.js:283-332
const checkForDuplicateByExternalId = async (externalIds) => {
  // Scan all events with external_ids
  // Match by source + id
};
```

**By Venue + Date + Artist:**

```javascript
// events-lambda/handler.js:336-373
const checkForDuplicateEvent = async (venueId, date, artistIds) => {
  // Filter: venueId = :venueId AND date = :date
  // Check artistId overlap
};
```

---

## 6. API Layer

### 6.1 API Gateway Configuration

- **API ID:** `qry0k6pmd0`
- **Custom Domain:** `api.bndy.co.uk`
- **Type:** HTTP API (v2 payload format)

### 6.2 Lambda Functions and Routes

**Source:** `bndy-serverless-api/template.yaml`

| Lambda Function | Route Count | Key Endpoints |
|-----------------|-------------|---------------|
| `ArtistsFunction` | 12 | `/api/artists`, `/api/artists/{id}`, `/api/artists/search` |
| `EventsFunction` | 18 | `/api/events`, `/api/events/public`, `/api/events/community` |
| `CalendarFunction` | 6 | `/api/calendar/ical/{token}`, `/api/artists/{artistId}/calendar` |
| `VenuesFunction` | 7 | `/api/venues`, `/api/venues/{id}`, `/api/venues/find-or-create` |
| `MembershipsFunction` | 8 | `/api/memberships/me`, `/api/artists/{artistId}/members` |

### 6.3 Authentication

**Method:** JWT in `bndy_session` cookie
**Secret:** Stored in AWS Secrets Manager (`bndy/jwt-secret`) with SSM fallback

```javascript
// From events-lambda/handler.js:96-143
const requireAuth = async (event) => {
  // Extract session from cookie
  // Verify JWT with secret
  // Fetch user for platformAdmin flag
  // Return { user: {...} } or { statusCode: 401 }
};
```

### 6.4 Authorization Pattern

**Membership-Based Access:**

```javascript
// events-lambda/handler.js:146-159
const verifyMembership = async (userId, artistId) => {
  const result = await dynamodb.query({
    TableName: MEMBERSHIPS_TABLE,
    IndexName: 'user_id-index',
    KeyConditionExpression: 'user_id = :userId',
    FilterExpression: 'artist_id = :artistId'
  });
  return result.Items?.[0] || null;
};
```

**Platform Admin Bypass:**

```javascript
if (user.platformAdmin) {
  console.log('[EVENTS] Platform admin access granted');
}
```

### 6.5 CORS Configuration

```javascript
// From events-lambda/handler.js:60-66
const ALLOWED_ORIGINS = [
  'https://www.bndy.co.uk',
  'https://backstage.bndy.co.uk',
  'https://bndy.co.uk',
  'https://live.bndy.co.uk',
  'http://localhost:3000'
];
```

---

## 7. Frontend Integration

### 7.1 API Client Pattern

**Source:** `bndy-frontstage/src/lib/services/`

Services call either:
1. **Next.js API Routes** (for SSR/auth-aware requests)
2. **Direct DynamoDB API** (`https://api.bndy.co.uk`)

```typescript
// Direct API call (venue-service.ts)
const response = await fetch(`${API_BASE_URL}/api/venues`);

// Via Next.js route (artist-service.ts)
const response = await fetch(`/api/artists/${artistId}`, {
  credentials: 'include'
});
```

### 7.2 State Management

**TanStack React Query** for server state:

```typescript
// From hooks/useAllPublicEvents.ts
export function useAllPublicEvents({ startDate, endDate }) {
  return useQuery({
    queryKey: ['/api/events/public', { startDate, endDate }],
    queryFn: async () => {
      const response = await apiRequest('GET', url);
      // Transform DynamoDB format to frontend format
      return transformedEvents;
    },
    staleTime: 5 * 60 * 1000,  // 5 minutes
    gcTime: 10 * 60 * 1000,
  });
}
```

### 7.3 Data Transformation

Frontend transforms DynamoDB snake_case to camelCase:

```typescript
// From hooks/useAllPublicEvents.ts:66-94
const transformed = {
  id: event.id,
  name: event.title || event.name,
  venueName: event.venueName,
  artistIds: event.artistId ? [event.artistId] : [],
  location: { lat: event.geoLat, lng: event.geoLng },
  // ...
};
```

### 7.4 Type Definitions

**Source:** `bndy-frontstage/src/lib/types.ts`

Frontend types are documented with backend field mapping notes:

```typescript
// NOTE: Backend returns 'bio' not 'description'
// NOTE: Backend uses lowercase 'socialMediaUrls'
export interface Artist {
  id: string;
  name: string;
  bio?: string;  // Backend uses 'bio'
  socialMediaUrls?: any[];
  // ...
}
```

---

## 8. Technical Observations and Recommendations

### 8.1 Strengths

| Aspect | Implementation |
|--------|----------------|
| **Clean UUID Strategy** | Consistent `crypto.randomUUID()` across all entities |
| **Sparse GSI Pattern** | XOR between `artistId` and `ownerUserId` for event types |
| **Geospatial Indexing** | 4-character geohash GSI for efficient geo-queries |
| **External ID System** | Clean MCP integration with de-duplication |
| **Location Cascade** | Venue updates propagate to event geohash fields |

### 8.2 Areas for Improvement

| Issue | Impact | Recommendation |
|-------|--------|----------------|
| **Table Scans** | Venues and Artists use full table scans for search | Add GSI on `name` or implement DynamoDB search index |
| **Multi-Artist Events** | `collaboratingArtistIds` isn't indexed | Consider separate `bndy-event-artists` join table |
| **Frontend Type Safety** | Uses `any` types in some service functions | Generate types from backend schemas |
| **Validation** | No Zod schemas in backend (raw JSON.parse) | Add Zod validation per CLAUDE.md standards |
| **No Batch Operations** | Individual puts/updates | Use `BatchWriteItem` for bulk operations |

### 8.3 Security Considerations

1. **JWT in Cookie** - Good (HttpOnly, Secure implied)
2. **Platform Admin Bypass** - Documented and logged
3. **Membership Verification** - Enforced before artist operations
4. **MCP Endpoints** - No auth (by design for integration)

---

## 9. File References

### Backend (bndy-serverless-api)

| File | Purpose |
|------|---------|
| `template.yaml` | SAM template with all Lambda functions and API routes |
| `events-lambda/handler.js` | Events CRUD, calendar, availability (~1500 lines) |
| `venues-lambda/handler.js` | Venues CRUD, find-or-create, enrichment |
| `artists-lambda/handler.js` | Artists CRUD, search, MCP updates |
| `memberships-lambda/handler.js` | User-artist membership management |

### Frontend (bndy-frontstage)

| File | Purpose |
|------|---------|
| `src/lib/types.ts` | TypeScript type definitions |
| `src/lib/services/event-service.ts` | Event API calls |
| `src/lib/services/venue-service.ts` | Venue API calls |
| `src/lib/services/artist-service.ts` | Artist API calls |
| `src/hooks/useAllPublicEvents.ts` | React Query hook for public events |

---

## 10. Conclusion

The BNDY platform demonstrates a well-architected serverless system with clear separation of concerns. The DynamoDB schema effectively handles the core entities with appropriate indexing for the primary access patterns.

**Key Architectural Decisions:**
- UUID v4 for all entity IDs (no composite keys)
- Sparse GSI pattern for polymorphic events table
- Geohash-based spatial indexing for map queries
- External ID system for third-party integration
- JWT cookie-based authentication with membership authorization

The system is production-ready with optimization opportunities around search indexing and batch operations.

---

*Report Generated: 2026-05-04*
