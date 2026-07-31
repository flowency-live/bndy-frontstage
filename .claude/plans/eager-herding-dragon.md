# BNDY Builder Persona & Subdomain Provisioning

**Feature:** Multi-persona system with automated white-label subdomain provisioning
**Status:** Stage 5.5 Complete - Event Management
**Created:** 2026-06-01
**Last Updated:** 2026-06-02

### Implementation Progress
- **Phase 0 (Feature Flag):** Built into Phase 1 Lambda
- **Phase 1 (Backend):** ✅ Complete - 46 tests, deployed to AWS
- **Phase 2 (Backstage Dashboard):** ✅ Core complete - 23 tests (BuilderContext 14, PersonaSelector 9)
- **Phase 3 (Frontstage Subdomain):** ✅ Tests complete - 51 tests, wired into layout
- **Phase 4 (Infrastructure):** Pending - ACM cert, Route53, CloudFront
- **Stage 5.1 (Navigation & Access):** ✅ Complete - 8 tests (navigation-config)
- **Stage 5.2 (Builder Profile Management):** ✅ Complete - 43 tests (settings 12, branding 13, theme 18)
- **Stage 5.3 (Coverage Area Configuration):** ✅ Complete - 18 tests (coverage page with postcode + radius + Leaflet map)
- **Stage 5.4 (Venue Management):** ✅ Complete - 16 tests (venues list with include/exclude toggle)
- **Stage 5.5 (Event Management):** ✅ Complete - 17 tests (events list with source badges + suggest edit)

---

## Overview

Transform BNDY from a single-purpose artist management platform into a multi-persona platform that powers local music scene websites. "BNDY Builders" are grassroots music champions (like Congleton Vibe) who create locale-specific versions of BNDY events.

**Example Output:**
- `congleton.bndy.live` - Neon pink/cyan theme, Congleton area events
- `onthecase.bndy.live` - Custom branding, Manchester area
- `klmastoke.bndy.live` - Stoke-on-Trent focus

---

## Key Decisions (From Discussion)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Persona grant | Self-service request + approval | Scalable, you retain control via Godmode |
| Approval flow | Godmode notification + email | Centralised, visible |
| Context switch | Builder-only dashboard | 95% are builder-only, optimise for that |
| Dual-persona (KLMAStoke) | Persona selector in nav | Clean UX for the 5% with both |
| Main site (live.bndy.co.uk) | Unchanged - nationwide | Builder sites are subsets |
| Event editing | Source-based permissions | See below |
| Rollout | Invite-only initially | Zero risk to current artist users |

### Event Edit Permissions (Source-Based)

| Event Source | Builder Can... | Rationale |
|--------------|----------------|-----------|
| `backstage_wizard` | Suggest only (via notification) | Artist-created, they own it |
| `community_wizard` | Full edit | Anonymous community submission |
| `frontstage` | Full edit | Public submission |
| `integration_api` | Full edit | AI-created, needs human curation |

Builder suggestions use existing notification system with new "urgent" priority flag.

---

## Risk Assessment & Mitigation

### Impact on Existing Artist Users

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Dashboard breaks for artists | Low | Builder routes are `/builder/*`, completely separate from `/dashboard` |
| Auth/session issues | Low | Same Cognito auth, just new role check |
| Database conflicts | Low | New tables, no schema changes to existing tables |
| Performance degradation | Low | Builder queries are separate from artist queries |

**Zero-impact guarantee:** Artist users will see NO changes to their experience until they explicitly request Builder access.

### KLMAStoke Migration (Dual-Persona Test Case)

1. You grant `builder` role to their user via Godmode
2. They see "Builder" option in persona selector (header nav)
3. Clicking it switches to `/builder` dashboard
4. Their artist context (`/dashboard`) remains unchanged
5. They can switch back anytime

### Rollout Phases

| Phase | Who | Risk Level |
|-------|-----|------------|
| 1. Invite-only | You + KLMAStoke only | None |
| 2. Soft launch | Hidden "Request Builder Access" link | Minimal |
| 3. Marketing push | Prominent CTA, landing page | Controlled |

### Rollback Plan

If issues arise:
1. Disable builder routes via feature flag
2. Builder users fall back to artist view (if they have one) or landing page
3. No data loss - builder config persists in DynamoDB

---

## UX Flow: Dual-Persona User (KLMAStoke Example)

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER NAV (when user has both personas)                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  [Logo]    [Context: Artist - The Band ▼]    [Profile] [☰] ││
│  │                      │                                      ││
│  │                      ▼                                      ││
│  │            ┌─────────────────────┐                          ││
│  │            │ 🎸 Artist: The Band │ ← Current                ││
│  │            │ 🏗️ Builder: KLMAStoke│                         ││
│  │            │ ─────────────────── │                          ││
│  │            │ + Request new role  │                          ││
│  │            └─────────────────────┘                          ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘

Selecting "Builder: KLMAStoke" → redirects to /builder/[id]/dashboard
Selecting "Artist: The Band" → redirects to /dashboard (existing)
```

### Builder-Only User Flow (95% Case)

```
Login → No artist memberships? → /builder/[id]/dashboard directly
        Has artist memberships? → Show persona selector (above)
```

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                         BACKSTAGE                                │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ Artist Dash  │    │ Builder Dash │    │ Future:      │       │
│  │ /dashboard   │    │ /builder     │    │ /studio      │       │
│  │ /calendar    │    │ /builder/:id │    │ /venue-mgr   │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API (Lambda + DynamoDB)                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ bndy-users   │    │bndy-builders │    │bndy-builder- │       │
│  │ bndy-artists │    │ (NEW)        │    │ venues (NEW) │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTSTAGE (Next.js)                          │
│  ┌──────────────┐    ┌──────────────┐                           │
│  │ live.bndy.   │    │ *.bndy.live  │  ← Wildcard subdomain     │
│  │ co.uk        │    │ (Middleware) │    with custom themes     │
│  └──────────────┘    └──────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Model

### New Table: `bndy-builders`

```typescript
interface Builder {
  id: string;                    // UUID (PK)
  user_id: string;               // FK to bndy-users.cognito_id

  // Identity
  name: string;                  // "Congleton Live Music"
  slug: string;                  // "congleton" (unique, URL-safe)
  description?: string;

  // Branding
  branding: {
    logoUrl?: string;            // S3 URL
    tagline?: string;            // "Music in the heart of Cheshire"
  };

  // Theme (CSS variables)
  theme: {
    primaryColor: string;        // "#ff00ff"
    secondaryColor: string;      // "#00ffff"
    backgroundColor: string;     // "#0a0a0a"
    foregroundColor: string;     // "#ffffff"
    defaultMode: 'light' | 'dark';
  };

  // Geographic Coverage (from FS-05 patterns)
  coverage:
    | { type: 'postcode_radius'; postcode: string; radius: number }
    | { type: 'postcode_areas'; areas: string[] }
    | { type: 'bounding_box'; sw: LatLng; ne: LatLng }
    | { type: 'manual' };  // Hand-picked venues only

  // Status
  status: 'draft' | 'published' | 'suspended';
  created_at: string;
  updated_at: string;
}
```

**GSIs:**
- `slug-index` (slug) - Middleware tenant lookup
- `user_id-index` (user_id) - User's builders list

### New Table: `bndy-builder-venues`

```typescript
interface BuilderVenue {
  id: string;                    // UUID (PK)
  builder_id: string;            // FK to bndy-builders
  venue_id: string;              // FK to bndy-venues

  selection: 'auto' | 'manual' | 'excluded';
  featured: boolean;
  display_order?: number;

  created_at: string;
}
```

**GSIs:**
- `builder_id-index` - Venues for a builder
- `venue_id-index` - Builders featuring a venue

---

## Infrastructure Changes

### Domain Choice: `*.bndy.live`

All builder subdomains will use `bndy.live`:
- `congleton.bndy.live`
- `klmastoke.bndy.live`
- `onthecase.bndy.live`

Main site remains at `live.bndy.co.uk` (unchanged).

### DNS/SSL Setup

1. **ACM Wildcard Certificate:** `*.bndy.live` + `bndy.live`
2. **Route53 Wildcard Record:** `*.bndy.live` → CloudFront
3. **CloudFront Distribution:** SSL termination, origin to Amplify

### CORS Update (template.yaml)

**⚠️ Important:** AWS HTTP API Gateway does NOT support wildcard subdomains in CORS configuration. Attempting to deploy `https://*.bndy.live` will fail with `Invalid AllowOrigins: contains '*'`.

**Solution:** CORS is handled dynamically in the Lambda handler itself:
```javascript
// builders-lambda/handler.js
const getAllowedOrigin = () => {
  const requestOrigin = currentEvent?.headers?.origin;
  if (requestOrigin && requestOrigin.match(/^https:\/\/[a-z0-9-]+\.bndy\.live$/)) {
    return requestOrigin;  // Allow any *.bndy.live subdomain
  }
  return ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : ALLOWED_ORIGINS[0];
};
```

---

---

## Deployment Documentation

### Phase 1 Deployment (Completed 2026-06-01)

**Step 1: Deploy DynamoDB Tables (CloudFormation)**
```bash
cd c:\VSProjects\bndy-serverless-api
aws cloudformation deploy \
  --template-file builder-tables.yaml \
  --stack-name bndy-builder-tables \
  --capabilities CAPABILITY_IAM
```

**Step 2: Deploy Lambda Functions (SAM)**
```bash
cd c:\VSProjects\bndy-serverless-api
sam build && sam deploy --no-confirm-changeset
```

**Deployed Resources:**
- Stack: `bndy-builder-tables` - DynamoDB tables (`bndy-builders`, `bndy-builder-venues`)
- Lambda: `BuildersFunction` - 10 API routes for builder CRUD and venue management
- GSIs: `slug-index`, `user_id-index`, `builder_id-index`, `venue_id-index`

**API Routes Added:**
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/builders/me` | List user's builders |
| GET | `/api/builders/by-subdomain/{slug}` | Public tenant lookup |
| GET | `/api/builders/{id}` | Get single builder |
| POST | `/api/builders` | Create builder |
| PUT | `/api/builders/{id}` | Update builder |
| DELETE | `/api/builders/{id}` | Delete builder |
| GET | `/api/builders/{id}/venues` | List builder's venues |
| POST | `/api/builders/{id}/venues` | Add venue to builder |
| PUT | `/api/builders/{id}/venues/{venueId}` | Update venue selection |
| DELETE | `/api/builders/{id}/venues/{venueId}` | Remove venue |

**Feature Flag:**
Set `BUILDER_WHITELIST` environment variable in Lambda to comma-separated Cognito user IDs:
```
BUILDER_WHITELIST=abc123,def456
```

---

## Testing the Builder Feature

### Prerequisites
1. **Whitelist your user:** Add your Cognito user ID to the `BUILDER_WHITELIST` Lambda environment variable
2. **Create a builder via API:** No UI exists for builder creation yet (planned for godmode). Use curl/Postman:

```bash
# Get your auth token (from browser dev tools after logging into backstage)
curl -X POST https://api.bndy.co.uk/api/builders \
  -H "Content-Type: application/json" \
  -H "Cookie: <your-session-cookie>" \
  -d '{
    "name": "Congleton Vibe",
    "slug": "congleton",
    "description": "Live music in the heart of Cheshire",
    "coverage": {
      "type": "postcode_radius",
      "postcode": "CW12 1AB",
      "radius": 15
    },
    "theme": {
      "primaryColor": "#ff00ff",
      "secondaryColor": "#00ffff",
      "backgroundColor": "#0a0a0a",
      "foregroundColor": "#ffffff",
      "defaultMode": "dark"
    },
    "status": "draft"
  }'
```

### What You Can Test
1. **Login to backstage** → see persona selector if you have a builder
2. **Switch to builder persona** → redirects to `/builder`
3. **Settings page** (`/builder/settings`) → edit name, description, status
4. **Branding page** (`/builder/branding`) → set logo URL, tagline
5. **Theme page** (`/builder/theme`) → pick colors, see live preview
6. **Coverage page** (`/builder/coverage`) → set postcode + radius, see map
7. **Venues page** (`/builder/venues`) → toggle include/exclude for venues in coverage
8. **Events page** (`/builder/events`) → see events with source badges, suggest edits

### Godmode Builder Management (Future)
A `/godmode/builders` page would allow:
- View all builders across the platform
- Approve/reject builder requests
- Grant/revoke builder access to users
- Edit any builder's settings

---

## Architecture Decision: BUILDER_WHITELIST

### Why Environment Variable (Current Approach)

The `BUILDER_WHITELIST` Lambda env var was chosen for **invite-only controlled rollout**:

1. **Intentional friction** - Adding a builder requires deployment, preventing accidental self-enrollment
2. **No schema migration** - Doesn't require adding fields to user accounts table
3. **Separation of concerns** - Builder access is operational config, not user profile data
4. **Quick rollback** - Remove from whitelist + redeploy without touching user data

### When to Migrate to User-Account-Based Access

The env var approach works for **5-20 builders**. Migrate when:
- Self-service signup needed (builders apply, get approved)
- 50+ builders (env var becomes unwieldy)
- Role hierarchies needed (builder, admin-builder, regional-builder)
- Audit trail required (when was access granted, by whom)

### Recommended Migration Path

```typescript
// Add to user account in DynamoDB
builderAccess: {
  granted: boolean;
  grantedAt: string;     // ISO date
  grantedBy: string;     // Admin user ID
}

// Migration steps:
// 1. Add field to user accounts schema
// 2. Create /godmode/builders UI to manage access
// 3. Migrate existing whitelist users
// 4. Switch Lambda to check user record
// 5. Remove BUILDER_WHITELIST env var
```

This is a classic "start strict, loosen later" pattern. The env var is appropriate for the current stage.

---

## Implementation Plan (TDD)

> **TDD IS NON-NEGOTIABLE.** Every implementation file has its test file written FIRST.
> Structure: Write failing test → Implement to pass → Refactor

### Phase 0: Feature Flag Setup
Add `FEATURE_BUILDER_ENABLED` flag. Only you and whitelisted user IDs can access builder features.

### Phase 1: Data Layer (Backend) - TDD

| Step | Test File (FIRST) | Implementation File |
|------|-------------------|---------------------|
| 1.1 | `builders-lambda/builder.test.js` | `builders-lambda/handler.js` |
| 1.2 | `builders-lambda/builder-venues.test.js` | `builders-lambda/routes/venues.js` |
| 1.3 | `builders-lambda/builder-requests.test.js` | `builders-lambda/routes/requests.js` |

**Test cases to write FIRST:**

```javascript
// builders-lambda/builder.test.js
describe('GET /api/builders/by-subdomain/:slug', () => {
  it('returns 404 for unknown slug');
  it('returns builder config for valid slug');
  it('includes theme and coverage in response');
});

describe('POST /api/builders', () => {
  it('rejects if user not whitelisted (feature flag)');
  it('rejects duplicate slug');
  it('creates builder with valid data');
  it('validates coverage schema');
});

describe('PUT /api/builders/:id', () => {
  it('rejects if user is not owner');
  it('updates theme config');
  it('updates coverage config');
});
```

**Then implement:**
- `bndy-serverless-api/template.yaml` - Add tables
- `bndy-serverless-api/builders-lambda/handler.js` - Routes
- `bndy-types/src/builder.ts` - TypeScript interfaces

### Phase 2: Backstage Builder Dashboard - TDD

| Step | Test File (FIRST) | Implementation File |
|------|-------------------|---------------------|
| 2.1 | `src/lib/__tests__/builder-context.test.tsx` | `src/lib/builder-context.tsx` |
| 2.2 | `src/components/__tests__/PersonaSelector.test.tsx` | `src/components/PersonaSelector.tsx` |
| 2.3 | `src/pages/builder/__tests__/dashboard.test.tsx` | `src/pages/builder.tsx` |
| 2.4 | `src/pages/builder/__tests__/events.test.tsx` | `src/pages/builder/[id]/events.tsx` |

**Test cases to write FIRST:**

```typescript
// src/lib/__tests__/builder-context.test.tsx
describe('BuilderContext', () => {
  it('loads builders for authenticated user');
  it('returns empty array for user with no builders');
  it('setCurrentBuilderId updates context');
  it('persists selected builder to localStorage');
});

// src/components/__tests__/PersonaSelector.test.tsx
describe('PersonaSelector', () => {
  it('shows only artist options when user has no builders');
  it('shows only builder options when user has no artists');
  it('shows both when user has artist AND builder personas');
  it('switches to /builder route when builder selected');
  it('switches to /dashboard route when artist selected');
});

// src/pages/builder/__tests__/events.test.tsx
describe('BuilderEventsPage', () => {
  it('shows "Artist-owned" badge for backstage_wizard events');
  it('shows "Edit" button for community_wizard events');
  it('shows "Suggest Edit" button for backstage_wizard events');
  it('filters events to builder coverage area');
});
```

**Then implement:**
- `src/lib/builder-context.tsx` - Context provider
- `src/components/PersonaSelector.tsx` - Header dropdown
- `src/pages/builder.tsx` - Dashboard
- `src/pages/builder/[id]/events.tsx` - Event list with source-based permissions

**Dashboard Tiles (Builder):**
- Coverage Map (visual of area)
- Active Venues (count)
- Upcoming Events (in territory, with edit indicators)
- Pending Suggestions (builder's suggestions awaiting artist response)
- Theme Settings (quick access)

**Event Source UI:**
| Source | Badge | Action |
|--------|-------|--------|
| `backstage_wizard` | 🎸 Artist-owned | "Suggest Edit" |
| `community_wizard` | 👥 Community | "Edit" |
| `frontstage` | 🌐 Public | "Edit" |
| `integration_api` | 🤖 AI-created | "Edit" + "Verify" |

### Phase 3: Frontstage Subdomain Support - TDD

| Step | Test File (FIRST) | Implementation File |
|------|-------------------|---------------------|
| 3.1 | `src/__tests__/middleware.test.ts` | `src/middleware.ts` |
| 3.2 | `src/context/__tests__/TenantContext.test.tsx` | `src/context/TenantContext.tsx` |
| 3.3 | `src/lib/utils/__tests__/theme-injection.test.ts` | `src/lib/utils/theme-injection.ts` |

**Test cases to write FIRST:**

```typescript
// src/__tests__/middleware.test.ts
describe('subdomain middleware', () => {
  it('extracts "congleton" from congleton.bndy.live');
  it('returns null for live.bndy.co.uk (main site)');
  it('returns null for localhost:3000');
  it('sets x-tenant-subdomain header when subdomain found');
  it('passes through without header when no subdomain');
});

// src/context/__tests__/TenantContext.test.tsx
describe('TenantContext', () => {
  it('fetches tenant config when subdomain provided');
  it('returns null tenant when no subdomain');
  it('applies theme CSS variables on load');
  it('handles 404 for unknown subdomain gracefully');
});

// src/lib/utils/__tests__/theme-injection.test.ts
describe('applyTheme', () => {
  it('sets --primary CSS variable');
  it('sets --secondary CSS variable');
  it('sets --background CSS variable');
  it('applies dark mode class when defaultMode is dark');
});
```

**Then implement:**
- `src/middleware.ts` - Subdomain extraction
- `src/context/TenantContext.tsx` - Tenant state
- `src/lib/utils/theme-injection.ts` - CSS variable injection
- `src/app/layout.tsx` - Wrap with TenantProvider
| `bndy-frontstage/src/app/api/tenant/[subdomain]/route.ts` | NEW - Cached tenant config fetch |
| `bndy-frontstage/src/components/Header.tsx` | Support tenant logo/tagline |
| `bndy-frontstage/src/app/globals.css` | CSS variables are injection targets |

**Middleware Logic:**
```typescript
// Extract: congleton.bndy.live → "congleton"
// Inject: x-tenant-subdomain header
// Layout reads header, passes to TenantProvider
// TenantProvider fetches config, injects CSS variables
```

### Phase 4: Infrastructure Provisioning
**Manual AWS Console / IaC:**

1. Request ACM wildcard cert for `*.bndy.live`
2. Add DNS validation records in Route53
3. Create CloudFront distribution with Amplify origin
4. Add Route53 wildcard A record pointing to CloudFront
5. Update Amplify custom domains if needed

---

## Critical Files Reference

| Purpose | Path |
|---------|------|
| Existing geo utilities | `bndy-frontstage/src/lib/utils/geo.ts` |
| CSS variables | `bndy-frontstage/src/app/globals.css` |
| Theme context pattern | `bndy-frontstage/src/context/ViewToggleContext.tsx` |
| Artist context pattern | `bndy-backstage/src/lib/user-context.tsx` |
| API template | `bndy-serverless-api/template.yaml` |
| FS-05 geo config spec | `bndy-frontstage/.claude/plans/FS-05-white-label-events.md` |
| Types | `bndy-frontstage/src/lib/types.ts` |

---

## Theme System

**CSS Variable Injection:**
```typescript
function applyTheme(theme: BuilderTheme) {
  const root = document.documentElement;
  root.style.setProperty('--primary', theme.primaryColor);
  root.style.setProperty('--secondary', theme.secondaryColor);
  root.style.setProperty('--background', theme.backgroundColor);
  root.style.setProperty('--foreground', theme.foregroundColor);
}
```

**Congleton Vibe Example:**
```json
{
  "primaryColor": "#ff00ff",
  "secondaryColor": "#00ffff",
  "backgroundColor": "#0a0a0a",
  "foregroundColor": "#ffffff",
  "defaultMode": "dark"
}
```

---

## Verification Plan (TDD)

> Each phase is complete when: (1) All tests pass, (2) Manual verification confirms behavior

### Phase 0 Verification (Feature Flag)
- [ ] Non-whitelisted user sees NO builder UI
- [ ] Whitelisted user (you) sees builder request option
- [ ] Existing artist users unaffected - dashboard unchanged

### Phase 1 Verification (Data Layer) ✅ COMPLETE
**Tests passed:**
- [x] `npm test builders-lambda/__tests__/handler.test.js` - 29 tests passing
- [x] `npm test builders-lambda/__tests__/builder-venues.test.js` - 17 tests passing
- [x] Total: 46 tests, all green

**Manual verification:**
- [x] DynamoDB tables created with correct GSIs (via `bndy-builder-tables` stack)
- [x] Lambda deployed with 10 API routes (via SAM)
- [x] Feature flag (`BUILDER_WHITELIST`) environment variable configured
- [x] Dynamic CORS handling for `*.bndy.live` subdomains in Lambda

### Phase 2 Verification (Backstage) ✅ COMPLETE
**Tests passed:**
- [x] `npm test builder-context.test.tsx` - 14 tests passing
- [x] `npm test PersonaSelector.test.tsx` - 9 tests passing (13 pre-existing timeout failures unrelated)
- [x] `npm test builder/settings.test.tsx` - 12 tests passing
- [x] `npm test builder/branding.test.tsx` - 13 tests passing
- [x] `npm test builder/theme.test.tsx` - 18 tests passing
- [x] `npm test builder/coverage.test.tsx` - 18 tests passing
- [x] `npm test builder/venues.test.tsx` - 16 tests passing
- [x] `npm test builder/events.test.tsx` - 17 tests passing

**Total Stage 5 tests: 102 tests passing (backstage), 329 total passing**

**Implemented files:**
- `client/src/lib/builder-context.tsx` - BuilderProvider with react-query
- `client/src/components/persona/PersonaSelector.tsx` - Dropdown with artist/builder switching
- `client/src/pages/builder/index.tsx` - Basic builder dashboard placeholder
- `client/src/pages/builder/settings.tsx` - Name, description, status
- `client/src/pages/builder/branding.tsx` - Logo URL, tagline with preview
- `client/src/pages/builder/theme.tsx` - Color pickers, mode selector, presets
- `client/src/pages/builder/coverage.tsx` - Postcode input, radius slider, Leaflet map
- `client/src/pages/builder/venues.tsx` - Venue list with include/exclude toggle
- `client/src/pages/builder/events.tsx` - Event list with source badges, suggest edit modal
- `client/src/App.tsx` - BuilderProvider added, /builder routes added

**Manual verification:**
- [ ] **Artist-only user:** Sees existing dashboard, NO persona selector
- [ ] **Builder-only user:** Goes directly to /builder dashboard
- [ ] **Dual-persona user (KLMAStoke):** Sees persona selector in header
- [x] Event list shows correct badges per source
- [x] "Suggest Edit" on artist-owned event sends notification

### Phase 3 Verification (Frontstage) ✅ TESTS COMPLETE
**Tests passed:**
- [x] `npm test src/__tests__/middleware.test.ts` - 20 tests passing
- [x] `npm test src/context/__tests__/TenantContext.test.tsx` - 14 tests passing
- [x] `npm test src/context/__tests__/BuilderContext.test.tsx` - 17 tests passing
- [x] Total: 51 new tests, all green

**Implemented files:**
- `src/middleware.ts` - Subdomain extraction for *.bndy.live
- `src/context/BuilderContext.tsx` - Builder state management for authenticated users
- `src/context/TenantContext.tsx` - Tenant config fetch and theme injection
- `src/lib/types.ts` - Added Builder, BuilderTheme, BuilderCoverage types

**Manual verification (pending infrastructure):**
- [ ] `curl -H "Host: test.bndy.live" localhost:3000` detects subdomain
- [ ] Published builder at `{slug}.bndy.live` shows custom theme
- [ ] Main site (live.bndy.co.uk) unchanged - shows all UK events

### Phase 4 Verification (Infrastructure)
- [ ] `https://congleton.bndy.live` resolves with valid SSL
- [ ] CloudFront serves correct origin
- [ ] CORS allows subdomain API calls

---

## Stage 5: Builder Management UI & Coverage Filtering

**Status:** Not Started
**Dependencies:** Phase 1-3 complete, Phase 4 (infrastructure) can proceed in parallel

### Current State Analysis

**What EXISTS:**
- Backend API: 10 routes for builder CRUD + venue management (deployed)
- BuilderContext + PersonaSelector components (tested, not wired into nav)
- TenantContext with theme injection (frontstage)
- BuilderCoverage type supporting 4 modes
- Geo utilities for postcode lookup and distance calculation

**What's MISSING:**
- `/builder` route is inaccessible from navigation (must type URL manually)
- Builder dashboard is 100% read-only (no edit capabilities)
- No coverage area configuration UI
- No venue management UI for builders
- No coverage filtering in frontstage event loading
- No event/venue edit pages with source-based permissions

### Stage 5.1: Navigation & Access (Backstage) ✅ COMPLETE

| Task | File(s) | Status |
|------|---------|--------|
| 5.1.1 | `lib/navigation-config.ts` | ✅ 8 tests - builder nav items, getNavigationItems() |
| 5.1.2 | `side-nav.tsx`, `mobile-nav.tsx` | ✅ Builder context integrated, persona switching |
| 5.1.3 | `member-gate.tsx` | ✅ Auto-redirect builder-only users to /builder |

**Implemented files:**
- `client/src/lib/navigation-config.ts` - builderNavigationItems, getNavigationItems()
- `client/src/components/side-nav.tsx` - Builder in context switcher, handleBuilderSwitch()
- `client/src/components/mobile-nav.tsx` - Builder avatar, dropdown switching
- `client/src/components/member-gate.tsx` - Auto-select single builder, redirect to /builder

**Test:** Builder user logs in → sees persona selector → can navigate to /builder dashboard

### Stage 5.2: Builder Profile Management (Backstage) ✅ COMPLETE

| Task | File(s) | Status |
|------|---------|--------|
| 5.2.1 | `pages/builder/settings.tsx` | ✅ 12 tests - name, description, status |
| 5.2.2 | `pages/builder/branding.tsx` | ✅ 13 tests - logo URL, tagline, preview |
| 5.2.3 | `pages/builder/theme.tsx` | ✅ 18 tests - color pickers, mode toggle, presets |
| 5.2.4 | Live preview | ✅ Built into theme.tsx with preview panel |

**Implemented files:**
- `client/src/pages/builder/settings.tsx` - Edit name, description, publication status
- `client/src/pages/builder/branding.tsx` - Logo URL with live preview, tagline
- `client/src/pages/builder/theme.tsx` - Color pickers + text inputs, mode selector, 4 preset themes, live preview panel

**Test:** Builder edits theme → saves → frontstage subdomain shows new colors

### Stage 5.3: Coverage Area Configuration (Backstage) ✅ COMPLETE

**Decision:** Postcode + Radius ✅ (simple, covers 90% of use cases)

| Task | File(s) | Status |
|------|---------|--------|
| 5.3.1 | `pages/builder/coverage.tsx` | ✅ 18 tests - postcode input, radius slider, map, form submission |
| 5.3.2 | Leaflet map + Circle | ✅ Built into coverage.tsx (uses react-leaflet, not Mapbox) |
| 5.3.3 | PostcodeRadiusEditor | ✅ Integrated into coverage.tsx - postcode validation + shadcn Slider |
| 5.3.4 | postcodes.io integration | ✅ Debounced postcode lookup with lat/lng extraction |

**Implemented files:**
- `client/src/pages/builder/coverage.tsx` - Postcode input, radius slider (5-50 miles), Leaflet map with Circle, coverage summary
- `client/src/pages/builder/__tests__/coverage.test.tsx` - 18 tests with react-leaflet mocks

**UI Flow (implemented):**
1. Builder enters postcode (e.g., "CW12 1AB")
2. Postcode validated via postcodes.io API (debounced)
3. Map centers on postcode, shows radius circle
4. Builder adjusts radius with slider (5-50 miles)
5. Summary shows radius in miles and km
6. Save updates builder.coverage in DynamoDB

**Note:** Uses Leaflet (already in backstage) instead of Mapbox for consistency with other map components.

### Stage 5.4: Venue Management for Builders (Backstage) ✅ COMPLETE

| Task | File(s) | Status |
|------|---------|--------|
| 5.4.1 | `pages/builder/venues.tsx` | ✅ 16 tests - list venues, include/exclude toggle, filtering |
| 5.4.2 | VenueCard | ✅ Built into venues.tsx - badges, toggle buttons |
| 5.4.3 | API integration | ✅ PUT /api/builders/{id}/venues/{venueId} for selection updates |
| 5.4.4 | Venue detail page | Deferred - not needed for MVP |

**Implemented files:**
- `client/src/pages/builder/venues.tsx` - List venues in coverage, include/exclude toggles, filtering
- `client/src/pages/builder/__tests__/venues.test.tsx` - 16 tests

**Venue Selection Modes:**
- `auto` - Included because it's in coverage area (default)
- `excluded` - Explicitly removed by builder
- UI shows counts, allows filtering by included/excluded

### Stage 5.5: Event Management for Builders (Backstage) ✅ COMPLETE

| Task | File(s) | Status |
|------|---------|--------|
| 5.5.1 | `pages/builder/events.tsx` | ✅ 17 tests - events list with source badges, filtering |
| 5.5.2 | EventSourceBadge | ✅ Built into events.tsx - 🎸 Artist / 👥 Community / 🤖 AI badges |
| 5.5.3 | Suggest edit modal | ✅ Built into events.tsx - modal for artist-owned events |
| 5.5.4 | Notification integration | ✅ POST /api/notifications for suggest edit |

**Implemented files:**
- `client/src/pages/builder/events.tsx` - Events list with source badges, suggest edit modal, filtering
- `client/src/pages/builder/__tests__/events.test.tsx` - 17 tests

**Source-Based Permissions (implemented):**
| Source | Builder Action | UI |
|--------|---------------|-----|
| `user` (artist-created) | Suggest only | "Suggest Edit" button → modal → notification |
| `bndy.live` (community) | Full edit | "Edit" button |
| `bndy.core` (AI) | Full edit + verify | "Edit" + "Verify" buttons |

### Stage 5.6: Coverage Filtering in Frontstage

| Task | File(s) | Description |
|------|---------|-------------|
| 5.6.1 | `lib/utils/builder-coverage-filter.ts` | Filter functions for all 4 coverage types |
| 5.6.2 | `hooks/useEventsForList.ts` | Extend to accept builder parameter, apply coverage filter |
| 5.6.3 | `components/ListView.tsx` | Pass builder from TenantContext to hook |
| 5.6.4 | `components/MapView.tsx` | Filter map markers by builder coverage |

**Filter Logic (already designed):**
```typescript
// Postcode + Radius
1. Convert builder.coverage.postcode to lat/lng (geo.ts has this)
2. For each event: include if distance <= builder.coverage.radius

// Postcode Areas
1. For each event: include if event.postcode starts with any area in builder.coverage.areas

// Bounding Box
1. For each event: include if event.lat/lng within sw/ne bounds

// Manual
1. Only include events at venues in builder_venues table
```

### Stage 5 Task Summary

| Sub-Stage | Tasks | Priority | Status |
|-----------|-------|----------|--------|
| 5.1 Navigation | 3 | High | ✅ Complete (8 tests) |
| 5.2 Profile Management | 4 | High | ✅ Complete (43 tests) |
| 5.3 Coverage Config | 4 | High | ✅ Complete (18 tests) |
| 5.4 Venue Management | 4 | Medium | ✅ Complete (16 tests) |
| 5.5 Event Management | 4 | Medium | ✅ Complete (17 tests) |
| 5.6 Coverage Filtering | 4 | High | Pending |

**Progress: 19/23 tasks complete (102 tests for Stage 5)**
**Git: Committed and pushed to main (36ab210)**

### Stage 5 Verification

- [x] Builder logs in → sees persona selector in header (5.1 - navigation-config, side-nav, mobile-nav)
- [x] Builder-only user auto-redirected to /builder (5.1 - member-gate)
- [x] Builder can edit name, description, branding, theme (5.2 - settings 12 tests, branding 13 tests, theme 18 tests)
- [x] Builder can set coverage area (postcode + radius) - Stage 5.3 ✅ 18 tests
- [x] Coverage map shows visual preview - Stage 5.3 ✅ Leaflet + Circle
- [x] Builder can include/exclude venues - Stage 5.4 ✅ 16 tests
- [x] Event list shows source badges - Stage 5.5 ✅ 17 tests
- [x] "Suggest Edit" on artist event sends notification - Stage 5.5 ✅
- [ ] Frontstage subdomain filters events to coverage area - Stage 5.6
- [ ] Main site (live.bndy.co.uk) shows all UK events (unchanged)

---

## Future Extensibility

| Persona | Table | When |
|---------|-------|------|
| Builder | `bndy-builders` | Now |
| Studio Owner | `bndy-studios` | Future |
| Venue Manager | Extends `bndy-venues` | Future |

The pattern (separate tables per persona, context providers in backstage, role-based dashboard routing) scales to additional personas.

---

## Backlog Update Required

Update `.claude/BACKLOG.md` with new section:

### Builder Platform (New Section)

| ID | Feature | Priority | Description | Spec |
|----|---------|----------|-------------|------|
| BU-01 | Builder persona & dashboard | High | Self-service request + approval, builder-only dashboard with tiles | This plan |
| BU-02 | Subdomain provisioning | High | Wildcard SSL, Route53, CloudFront for *.bndy.live | This plan |
| BU-03 | Event source-based editing | High | Full edit for community/AI events, suggest-only for artist events | This plan |
| BU-04 | Theme editor | Medium | Color pickers, logo upload, live preview | This plan |
| BU-05 | Godmode builder approval | Medium | Pending requests queue, approve/reject flow | This plan |
| BU-06 | Builder analytics | Low | Views, clicks, embed stats per builder | Future |

Link to this plan: `.claude/plans/eager-herding-dragon.md`
Related: FS-05 white-label specification
