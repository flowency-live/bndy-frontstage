# Add Venue Functionality Documentation

> **Last Updated:** 2026-04-30
> **Scope:** bndy-frontstage, bndy-backstage, bndy-serverless-api

This document provides a complete technical audit of the venue creation functionality across the BNDY platform, with code evidence for all assertions.

---

## Table of Contents

1. [Overview](#overview)
2. [UI Entry Points](#ui-entry-points)
3. [Client-Side Deduplication](#client-side-deduplication)
4. [Server-Side Deduplication (find-or-create)](#server-side-deduplication)
5. [Google Places Integration](#google-places-integration)
6. [Data Flow Diagrams](#data-flow-diagrams)
7. [API Endpoints](#api-endpoints)
8. [Venue Data Schema](#venue-data-schema)

---

## Overview

The BNDY platform implements a multi-layered deduplication strategy to prevent duplicate venues:

| Layer | Location | Method | Confidence |
|-------|----------|--------|------------|
| Client UI | VenueAutocomplete | Name + Address exact match | Visual prevention |
| Client UI | venue-search.ts | 3-tier: PlaceID → 50m distance → 85% name | Pre-filter |
| Server | find-or-create | 4-level: PlaceID → Location+Name → Name+Address → Create | Authoritative |

---

## UI Entry Points

### 1. Frontstage: Event Wizard (Map-Based)

**File:** [VenueMapStep.tsx](../src/components/wizard/steps/VenueMapStep.tsx)

Users search for venues using Google Places Text Search, with real-time status checking against the BNDY database.

```typescript
// VenueMapStep.tsx:96-105 - Google Places Text Search
const request: any = {
  textQuery: query,
  fields: ['displayName', 'formattedAddress', 'location', 'id'],
  maxResultCount: 20,
  // No location bias - search UK-wide for better results
};

const { places } = await (google.maps.places.Place as any).searchByText(request);
```

**Status Check (Lines 168-190):**
```typescript
// VenueMapStep.tsx:168-183 - Check venue existence
setVenueStatus('checking');
const response = await fetch('https://api.bndy.co.uk/api/venues/find-or-create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: venue.name,
    address: venue.address,
    googlePlaceId: venue.googlePlaceId,
    latitude: venue.location.lat,
    longitude: venue.location.lng,
  }),
});

if (response.ok) {
  const data = await response.json();
  setVenueStatus(data.matchMethod === 'google_place_id' ? 'existing' : 'new');
}
```

Visual feedback displayed (Lines 315-323):
- "Checking..." - while API call in progress
- "Existing BNDY venue" - venue already in database
- "New venue (will be created)" - venue will be created on event submit

---

### 2. Frontstage: Event Wizard Submit

**File:** [EventWizard.tsx](../src/components/wizard/EventWizard.tsx)

On form submission, the wizard uses `find-or-create` to either match an existing venue or create a new one.

```typescript
// EventWizard.tsx:49-69 - Find or create venue on submit
const venueResponse = await fetch('https://api.bndy.co.uk/api/venues/find-or-create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: formData.venue.name,
    address: formData.venue.address,
    googlePlaceId: formData.venue.googlePlaceId,
    latitude: formData.venue.location?.lat,
    longitude: formData.venue.location?.lng,
  }),
});

if (!venueResponse.ok) {
  throw new Error('Failed to find or create venue');
}

const venue = await venueResponse.json();
const venueId = venue.id;
```

---

### 3. Backstage: Artist CRM - Add Venue Modal

**File:** `bndy-backstage/client/src/pages/venues/components/AddVenueModal.tsx`

Artists can add venues to their CRM. Handles both existing BNDY venues and new Google Places venues.

```typescript
// AddVenueModal.tsx:60-76 - Create artist-venue relationship
return venueCRMService.createArtistVenue(artistId, {
  venueId: selectedVenue.id || '', // If isNew, backend will create venue first
  notes: notes.trim() || undefined,
  // Include Google Places data if this is a new venue
  ...(selectedVenue.isNew && {
    newVenueData: {
      name: selectedVenue.name,
      address: selectedVenue.address,
      city: selectedVenue.city,
      postcode: selectedVenue.postcode,
      googlePlaceId: selectedVenue.googlePlaceId,
      latitude: selectedVenue.latitude || 0,
      longitude: selectedVenue.longitude || 0,
      socialMediaUrls: socialMediaUrls.length > 0 ? socialMediaUrls : undefined,
    }
  }),
});
```

Visual distinction (Lines 193-220):
- Blue styling + "NEW VENUE" badge for Google Places results
- Green styling for existing BNDY venues

---

### 4. Backstage: Godmode Admin - Venue Creation

**File:** `bndy-backstage/client/src/pages/godmode/components/VenueAddModal.tsx`

Admin interface with comprehensive duplicate prevention and name variants support.

```typescript
// VenueAddModal.tsx:50-72 - Block existing venue selection
const handleVenueSelect = (placeId: string, name: string, address: string, location?: { lat: number; lng: number }, venue?: any) => {
  // If an existing venue was selected from BNDY database
  if (venue) {
    setExistingVenue(venue);
    // ... reset form data ...
    toast({
      title: 'Venue Already Exists',
      description: `"${venue.name}" is already in the database. Please select a different venue or search again.`,
      variant: 'destructive',
    });
    return;
  }
  // Clear existing venue warning
  setExistingVenue(null);
  // ... populate form with Google Places data ...
};
```

Save button is disabled when duplicate detected (Lines 445-448):
```typescript
<Button
  onClick={handleSave}
  disabled={saving || !!existingVenue}  // BLOCKED if existingVenue is set
  variant="default"
>
```

---

## Client-Side Deduplication

### VenueAutocomplete Component

**File:** `bndy-backstage/client/src/components/ui/venue-autocomplete.tsx`

Searches BNDY database first, then Google Places, with duplicate filtering.

```typescript
// venue-autocomplete.tsx:150-166 - Filter duplicates from Google results
const filteredGoogleMatches = googleMatches.filter(g => {
  const placeName = (g.name || '').trim().toLowerCase();
  const placeAddr = (g.address || '').trim().toLowerCase();

  const isDuplicate = bndyVenuesRef.current.some(v => {
    const vName = (v.name || '').trim().toLowerCase();
    const vAddr = (v.address || '').trim().toLowerCase();
    return vName === placeName && vAddr === placeAddr;  // EXACT match required
  });

  if (isDuplicate) {
    console.log('[VenueAutocomplete] Filtering out duplicate:', g.name, g.address);
  }
  return !isDuplicate;
});
```

Search fields (Lines 94-105):
```typescript
// Searches: name, address, city, postcode, AND nameVariants
const nameMatch = v.name?.toLowerCase().includes(searchLower);
const addressMatch = v.address?.toLowerCase().includes(searchLower);
const cityMatch = (v as any).city?.toLowerCase().includes(searchLower);
const postcodeMatch = v.postcode?.toLowerCase().includes(searchLower);

// Check name variants (also known as names)
const variantsMatch = v.nameVariants && Array.isArray(v.nameVariants) &&
  v.nameVariants.some(variant => variant.toLowerCase().includes(searchLower));

return nameMatch || addressMatch || cityMatch || postcodeMatch || variantsMatch;
```

---

### Frontstage: venue-search.ts (Three-Tier Detection)

**File:** [venue-search.ts](../src/lib/utils/venue-search.ts)

```typescript
// venue-search.ts:97-139 - Three-tier duplicate detection
export function filterDuplicates(
  bndyVenues: Venue[],
  googleVenues: GoogleVenue[]
): SearchResult {
  const filteredGoogleVenues: GoogleVenue[] = [];

  for (const googleVenue of googleVenues) {
    let isDuplicate = false;

    for (const bndyVenue of bndyVenues) {
      // Tier 1: Google Place ID match
      if (bndyVenue.googlePlaceId && bndyVenue.googlePlaceId === googleVenue.placeId) {
        isDuplicate = true;
        break;
      }

      // Tier 2: Coordinates within 50m
      if (bndyVenue.location && googleVenue.location) {
        const distance = calculateDistance(bndyVenue.location, googleVenue.location);
        if (distance < 50) {
          isDuplicate = true;
          break;
        }
      }

      // Tier 3: Name similarity >85%
      const similarity = calculateNameSimilarity(bndyVenue.name, googleVenue.name);
      if (similarity > 85) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      filteredGoogleVenues.push(googleVenue);
    }
  }

  return { bndyVenues, googleVenues: filteredGoogleVenues };
}
```

**Haversine Distance Calculation (Lines 24-40):**
```typescript
export function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
```

**Levenshtein Name Similarity (Lines 46-89):**
```typescript
export function calculateNameSimilarity(name1: string, name2: string): number {
  // Normalize: lowercase, trim, normalize punctuation
  const normalize = (str: string) =>
    str
      .toLowerCase()
      .trim()
      .replace(/&/g, 'and')        // "Fish & Chips" → "Fish and Chips"
      .replace(/[^\w\s]/g, '');    // Remove punctuation

  const s1 = normalize(name1);
  const s2 = normalize(name2);

  if (s1 === s2) return 100;

  // Levenshtein distance algorithm
  const matrix: number[][] = [];
  // ... matrix population ...

  const maxLength = Math.max(s1.length, s2.length);
  const distance = matrix[s2.length][s1.length];
  const similarity = ((maxLength - distance) / maxLength) * 100;

  return Math.round(similarity);
}
```

---

## Server-Side Deduplication

### The find-or-create Endpoint

**File:** `bndy-serverless-api/venues-lambda/handler.js`

This is the authoritative deduplication layer with four confidence levels.

```javascript
// handler.js:667-922 - handleFindOrCreateVenue

// === LEVEL 1: Exact googlePlaceId match (100% confidence) ===
// handler.js:688-735
if (venueData.googlePlaceId) {
  const googlePlaceMatch = existingVenues.find(v =>
    v.google_place_id === venueData.googlePlaceId
  );

  if (googlePlaceMatch) {
    console.log('[SUCCESS] LEVEL 1 MATCH: Google Place ID exact match');

    // Merge incoming externalIds into existing venue
    const mergedExternalIds = mergeExternalIds(
      googlePlaceMatch.external_ids || [],
      venueData.externalIds || []
    );

    // Update if externalIds changed
    if (venueData.externalIds && venueData.externalIds.length > 0) {
      await dynamodb.update({
        TableName: 'bndy-venues',
        Key: { id: googlePlaceMatch.id },
        UpdateExpression: 'SET external_ids = :extIds, updated_at = :now',
        ExpressionAttributeValues: {
          ':extIds': mergedExternalIds,
          ':now': new Date().toISOString()
        }
      }).promise();
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        id: googlePlaceMatch.id,
        matchConfidence: 100,
        matchMethod: 'google_place_id'
      })
    };
  }
}
```

```javascript
// === LEVEL 2: Location + Name fuzzy match (90% confidence) ===
// handler.js:738-799
if (venueData.latitude && venueData.longitude) {
  for (const venue of existingVenues) {
    if (venue.latitude && venue.longitude) {
      const withinRadius = isWithinDistance(
        venueData.latitude,
        venueData.longitude,
        venue.latitude,
        venue.longitude,
        50 // 50 meters radius
      );

      if (withinRadius) {
        const nameSimilarity = calculateSimilarity(venueData.name, venue.name);

        if (nameSimilarity >= 80) {
          console.log(`[SUCCESS] LEVEL 2 MATCH: Location + Name (${nameSimilarity.toFixed(1)}% similarity)`);
          return {
            statusCode: 200,
            body: JSON.stringify({
              id: venue.id,
              matchConfidence: 90,
              matchMethod: 'location_and_name',
              matchDetails: { nameSimilarity: nameSimilarity.toFixed(1) }
            })
          };
        }
      }
    }
  }
}
```

```javascript
// === LEVEL 3: Name + Address token overlap (70% confidence) ===
// handler.js:801-855
for (const venue of existingVenues) {
  if (venue.name && venue.address && venueData.address) {
    const nameSimilarity = calculateSimilarity(venueData.name, venue.name);
    const addressOverlap = calculateAddressOverlap(venueData.address, venue.address);

    // Match if name is very similar AND address has decent overlap
    if (nameSimilarity >= 85 && addressOverlap >= 50) {
      console.log(`[WARNING] LEVEL 3 MATCH: Name + Address tokens`);
      return {
        statusCode: 200,
        body: JSON.stringify({
          id: venue.id,
          matchConfidence: 70,
          matchMethod: 'name_and_address_tokens',
          matchDetails: {
            nameSimilarity: nameSimilarity.toFixed(1),
            addressOverlap: addressOverlap.toFixed(1)
          }
        })
      };
    }
  }
}
```

```javascript
// === LEVEL 4: Create new venue (no match found) ===
// handler.js:857-916
console.log('[NEW] LEVEL 4: No match found - creating new venue');

const newVenue = {
  id: require('crypto').randomUUID(),
  name: venueData.name,
  address: venueData.address,
  // ... all other fields ...
  validated: false,  // NEW venues are NOT validated
  created_source: venueData.created_source || 'backstage_wizard'
};

await dynamodb.put({
  TableName: 'bndy-venues',
  Item: newVenue
}).promise();

// Trigger enrichment in background
await triggerVenueEnrichment(newVenue.id);

return {
  statusCode: 201,
  body: JSON.stringify({
    id: newVenue.id,
    matchConfidence: 0,
    matchMethod: 'new_venue_created'
  })
};
```

### Helper Functions

**Haversine Distance (handler.js:30-40):**
```javascript
function isWithinDistance(lat1, lng1, lat2, lng2, meters) {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance <= meters;
}
```

**Levenshtein Similarity (handler.js:43-47):**
```javascript
function calculateSimilarity(str1, str2) {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLength = Math.max(str1.length, str2.length);
  return ((maxLength - distance) / maxLength) * 100;
}
```

**Address Token Overlap (handler.js:50-56):**
```javascript
function calculateAddressOverlap(addr1, addr2) {
  const tokens1 = new Set(addr1.toLowerCase().split(/[\s,]+/));
  const tokens2 = new Set(addr2.toLowerCase().split(/[\s,]+/));
  const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
  const union = new Set([...tokens1, ...tokens2]);
  return (intersection.size / union.size) * 100;
}
```

---

## Google Places Integration

### Frontend Integration Points

| Application | File | API Used |
|-------------|------|----------|
| Frontstage VenueMapStep | VenueMapStep.tsx | `Place.searchByText()` (New API) |
| Backstage VenueAutocomplete | venue-autocomplete.tsx | `PlacesService.textSearch()` |
| Backstage Places Service | places-service.ts | `Place.searchByText()` with fallback |

**Frontstage - New Places API (VenueMapStep.tsx:96-111):**
```typescript
const request: any = {
  textQuery: query,
  fields: ['displayName', 'formattedAddress', 'location', 'id'],
  maxResultCount: 20,
};
const { places } = await (google.maps.places.Place as any).searchByText(request);
```

**Backstage - PlacesService.textSearch (venue-autocomplete.tsx:133-148):**
```typescript
placesServiceRef.current.textSearch(
  {
    query: searchTerm,
    type: 'establishment'
  },
  (results: any, status: any) => {
    if (status === google.maps.places.PlacesServiceStatus.OK && results) {
      const googleMatches = results.slice(0, 5).map((place: any) => ({
        id: place.place_id,
        type: 'google' as const,
        name: place.name || '',
        address: place.formatted_address || '',
        placeId: place.place_id,
      }));
      // ... filter duplicates ...
    }
  }
);
```

**Place Details Fetch (venue-autocomplete.tsx:239-262):**
```typescript
placesServiceRef.current.getDetails(
  {
    placeId: result.placeId,
    fields: ['name', 'formatted_address', 'geometry'],
  },
  (place: any, status: any) => {
    if (status === google.maps.places.PlacesServiceStatus.OK && place) {
      const location = place.geometry?.location ? {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      } : undefined;

      onChange(
        result.placeId!,
        place.name || result.name,
        place.formatted_address || result.address,
        location
      );
    }
  }
);
```

---

## Data Flow Diagrams

### Frontstage Event Creation Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FRONTSTAGE EVENT CREATION                            │
└─────────────────────────────────────────────────────────────────────────────┘

User types venue name
        │
        ▼
┌───────────────────────┐
│  VenueMapStep.tsx     │
│  Google Places API    │
│  Place.searchByText() │
└───────────────────────┘
        │
        ▼
User selects venue from list
        │
        ▼
┌───────────────────────┐    POST /api/venues/find-or-create
│  Check venue status   │ ─────────────────────────────────►  ┌────────────────┐
│  (VenueMapStep:168)   │                                     │  venues-lambda │
└───────────────────────┘ ◄─────────────────────────────────  │  handler.js    │
        │                      { matchMethod: ... }           └────────────────┘
        ▼
┌───────────────────────┐
│ Display status badge  │
│ "Existing" or "New"   │
└───────────────────────┘
        │
        ▼
User clicks "Continue" → Proceeds through wizard
        │
        ▼
┌───────────────────────┐    POST /api/venues/find-or-create
│  EventWizard.tsx      │ ─────────────────────────────────►  ┌────────────────┐
│  handleSubmit()       │                                     │  venues-lambda │
│  (line 49-69)         │ ◄─────────────────────────────────  │  4-level match │
└───────────────────────┘      { id: venue.id }               └────────────────┘
        │
        ▼
┌───────────────────────┐    POST /api/events/community
│  Create event with    │ ─────────────────────────────────►  Events API
│  venueId              │
└───────────────────────┘
```

### Backstage Artist CRM Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BACKSTAGE ARTIST CRM                                 │
└─────────────────────────────────────────────────────────────────────────────┘

User opens AddVenueModal
        │
        ▼
┌────────────────────────────────────────────────┐
│  VenueAutocomplete.tsx                          │
│  1. Load all BNDY venues on mount (line 51-61) │
│  2. Search BNDY venues locally (line 93-106)   │
│  3. Search Google Places (line 133-177)        │
│  4. Filter duplicates (line 150-166)           │
└────────────────────────────────────────────────┘
        │
        ├─── BNDY venue selected (has venue.id)
        │           │
        │           ▼
        │    ┌──────────────────────┐
        │    │  isNew: false        │
        │    │  venueId: existing   │
        │    └──────────────────────┘
        │
        └─── Google venue selected (no venue.id)
                    │
                    ▼
             ┌──────────────────────┐
             │  isNew: true         │
             │  newVenueData: {...} │
             └──────────────────────┘
        │
        ▼
User clicks "Add Venue" / "Create & Add"
        │
        ▼
┌───────────────────────┐    POST /api/artists/{id}/crm/venues
│  venueCRMService      │ ─────────────────────────────────►  ┌──────────────────┐
│  createArtistVenue()  │                                     │  venue-crm-lambda │
│                       │                                     │                   │
│  If isNew=true:       │                                     │  If newVenueData: │
│    sends newVenueData │                                     │    Create venue   │
└───────────────────────┘                                     │    first          │
                                                              └──────────────────┘
```

---

## API Endpoints

### Venue Lambda Endpoints

| Method | Endpoint | Handler | Purpose |
|--------|----------|---------|---------|
| GET | `/api/venues` | `handleGetAllVenues` | List all venues with event counts |
| GET | `/api/venues/:id` | `handleGetVenueById` | Get single venue |
| POST | `/api/venues` | `handleCreateVenue` | Create standalone venue |
| POST | `/api/venues/find-or-create` | `handleFindOrCreateVenue` | **Deduplication endpoint** |
| PUT | `/api/venues/:id` | `handleUpdateVenue` | Update venue |
| DELETE | `/api/venues/:id` | `handleDeleteVenue` | Delete venue |
| GET | `/api/venues/by-external-id` | `handleGetVenueByExternalId` | Lookup by external ID |
| POST | `/api/integration/venues` | `handleIntegrationCreateVenue` | API key protected |

### Venue CRM Lambda Endpoint

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/artists/{artistId}/crm/venues` | Create artist-venue relationship (can create new venue) |

---

## Venue Data Schema

### DynamoDB Schema (bndy-venues table)

```javascript
// handler.js:465-491 - Venue creation schema
{
  id: UUID,                          // Primary key
  name: string,                      // Official venue name
  name_variants: string[],           // Alternative names (Also Known As)
  address: string,                   // Full address
  city: string | null,               // Extracted city
  postcode: string | null,           // UK postcode
  latitude: number,                  // GPS latitude
  longitude: number,                 // GPS longitude
  location_object: { lat, lng },     // Location as object
  google_place_id: string,           // **KEY FOR DEDUPLICATION**
  website: string,                   // Venue website
  phone: string,                     // Contact phone
  social_media_urls: string[],       // Social media links
  profile_image_url: string | null,  // Profile image
  facilities: string[],              // Venue facilities
  validated: boolean,                // **FALSE for community-created**
  standard_ticketed: boolean,        // Default ticketing setting
  standard_ticket_information: string,
  standard_ticket_url: string,
  external_ids: Array<{source, id}>, // Integration mappings
  ai_created: boolean,               // Created by AI/integration
  needs_review: boolean,             // Flagged for review
  created_source: string,            // Origin of creation
  enrichment_status: string,         // AI enrichment status
  enrichment_data: object,           // AI enrichment results
  created_at: ISO timestamp,
  updated_at: ISO timestamp
}
```

### API Response Format

```typescript
// Formatted venue response
{
  id: string,
  name: string,
  nameVariants: string[],
  address: string,
  city: string | null,
  latitude: number,
  longitude: number,
  location: { lat: number, lng: number },
  googlePlaceId: string,
  website: string,
  phone: string,
  postcode: string,
  validated: boolean,
  facilities: string[],
  socialMediaUrls: string[],
  profileImageUrl: string | null,
  externalIds: Array<{source: string, id: string}>,
  eventCount: number,            // Only in list responses
  matchConfidence?: number,      // Only in find-or-create
  matchMethod?: string,          // Only in find-or-create
  createdAt: string,
  updatedAt: string
}
```

---

## Summary

The BNDY venue creation system implements robust deduplication through:

1. **Google Place ID as primary key** - Venues selected from Google Places carry a unique `googlePlaceId` that provides 100% confidence matching

2. **Multi-layer client-side filtering** - VenueAutocomplete and venue-search.ts prevent duplicates from being shown to users

3. **Authoritative server-side matching** - The `find-or-create` endpoint uses four confidence levels:
   - Level 1: Exact Place ID (100%)
   - Level 2: Within 50m + 80% name similarity (90%)
   - Level 3: 85% name similarity + 50% address overlap (70%)
   - Level 4: No match - create new (0%)

4. **Visual feedback** - Users see clear status badges indicating whether a venue exists or will be created

5. **Name variants support** - The `nameVariants` field allows venues to be found by alternative names

This multi-layered approach ensures venue data integrity while providing a smooth user experience across both public (frontstage) and admin (backstage) interfaces.
