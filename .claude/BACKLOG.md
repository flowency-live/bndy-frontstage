# BNDY Product Backlog

**Last Updated:** 2026-05-14
**Status:** Active

---

## Backlog

### Frontstage (Public Discovery)

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| FS-05 | White label events list | Medium | Embeddable/white-label events list for external sites |
| FS-07 | Finish /new gig wizard | High | Complete the wizard and add button to map page |
| FS-08 | User accounts with favorites | Medium | User login, saved favorites, custom filters |
| FS-09 | Artist/venue claim flow | Medium | Verify ownership via social media message |

### Backstage (Artist Management)

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| BS-01 | Notification System | High | Push/email notifications for gig confirmations, member votes, etc. |
| BS-03 | Find my artist/band | Medium | Search and request to join existing artists |

### Technical Debt

| ID | Issue | Priority | Description |
|----|-------|----------|-------------|
| TD-06 | Orphaned entities cleanup | Medium | 287 venues (33%) and 344 artists (44%) have no events |
| TD-02 | `collaboratingArtistIds` not indexed | Low | Consider `bndy-event-artists` join table |

### Data Quality

| ID | Issue | Priority | Description |
|----|-------|----------|-------------|
| DQ-01 | Venue deduplication | Medium | Multiple records for same venue (name variants) |
| DQ-02 | Artist validation queue | Medium | Review `ai_created` and `needs_review` flagged artists |
| DQ-03 | Event date cleanup | Low | Remove past events older than 1 year |

---

## Recently Completed (2026)

### May 2026
- **FS-06:** Desktop navigation redesign - Pill-style nav bar with labeled buttons
- Venue mode loading and styling improvements
- Chat clarification UI with free-form text input
- Event time clarification questions
- **Venue Conditional Formatting** - Green/pink pins based on event activity
- **FS-01:** Artist profile images on map popups
- **FS-02:** Event search by artist name
- **FS-03:** Ticket link deep integration
- **FS-04:** "Near me" location prompt
- **BS-02:** Venue CRM - Track venue relationships, contacts, booking history
- **BS-04:** Remember me (persistent login)
- **BS-05:** Phone user email prompt
- **BS-06:** Event type colour config
- **TD-01:** Table scans on venues/artists - GSI on `name` field
- **TD-03:** Frontend `any` types - Generated from backend schemas
- **TD-04:** Zod validation in backend

### April 2026
- List view date grouping fixes (This Week, Coming Soon, Future Events)
- Dark mode hover contrast fix
- Column alignment between sections
- Event grouping utility with TDD (12 tests)

### March 2026
- Conditional venue pin styling (green for active, cyan highlight)
- Price field display on event cards
- Glow effect for active venue pins
- Chat page for conversational gig submission
- Image upload with drag-and-drop for poster recognition
- Claim review buttons (accept/reject/challenge)

### February 2026
- Event card horizontal layout redesign
- Compact ticket stub with perforated edges
- Multi-column grid layout for list view
- Artist profile images on event cards
- Multi-artist display with `formatArtistDisplay` utility
- Theme-aware map styles with blue hue

### January 2026
- Spotify play button on practice/voting song cards
- Pipeline cards UI/UX upgrade with animations
- YouTube URL support for songs
- Finances feature (income/expenses tracking, gig fees)
- Recurring events UI and deletion
- Member votes during voting phase
- Multi-artist event support with Leave Event button
- Calendar sync UI with subscription URLs
- Break lines in setlists for retuning
- Godmode events page for admin editing

---

## Legacy Issues (bndy-issues table - 2025)

These items are from the old `bndy-issues` DynamoDB table. Review and migrate relevant items above.

| Title | Type | Status | Date |
|-------|------|--------|------|
| Mobile dashboard layout | bug | new | 2025-10-05 |
| Toast notifications contrast | enhancement | new | 2025-10-05 |
| Artist context on mobile | bug | new | 2025-10-05 |
| Mobile calendar compression | bug | new | 2025-10-05 |
| Display name in user details | bug | new | 2025-10-05 |
| Phone number auth | unfinished | new | 2025-10-05 |
| Profile hometown API | unfinished | new | 2025-10-02 |
| Dashboard tiles square on mobile | enhancement | new | 2025-10-08 |
| No artist redirect to /my-artists | bug | new | 2025-10-31 |
| Add original track | unfinished | new | 2025-11-03 |

---

## How to Use This Backlog

1. **Starting a session:** Check this file for context on current priorities
2. **Completing work:** Move items to "Recently Completed" with date
3. **New requests:** Add to appropriate section with ID and priority
4. **Technical debt:** Track in TD section, link to architecture audit

**Related Docs:**
- Architecture: `.docs/bndy-entity-architecture-audit.md`
- Platform Bible: `bndy-backstage/BNDY_PLATFORM_BIBLE.md`
- Plans: `.claude/plans/`
