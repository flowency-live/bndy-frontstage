# Public Event Views: Map & List

> **Document Version:** 1.0
> **Last Updated:** 6 April 2026
> **Status:** Analysis Complete - Awaiting Discussion

---

## Executive Summary

The BNDY frontstage has two primary event discovery views for public users:

1. **Map View** - Interactive Leaflet map with marker clustering and date filtering
2. **List View** - Date-grouped event list with location/radius filtering

Both views share the same data source (`useAllPublicEvents`) but differ in filtering logic and presentation. This document captures the current implementation and identifies issues for discussion.

---

## Priority 1: Map View (Event Discovery)

### Current Behaviour

Users see events plotted on a map within their selected date range. A filter panel (bottom-right on mobile, bottom-left on desktop) provides quick date selection.

**Date Filter Options:**
| Filter | Range |
|--------|-------|
| Today | 00:00 today → 23:59 today |
| This Week | Today → Sunday 23:59 |
| This Weekend | Friday → Sunday 23:59 |
| Next Week | Monday → Sunday (following week) |
| Next Weekend | Friday → Sunday (7 days after this week's Friday) |

### Data Flow

```
User selects date filter
    ↓
EventsContext updates `dateRange`
    ↓
Map.tsx calculates { startDate, endDate } via getFormattedDateRange()
    ↓
useAllPublicEvents({ startDate, endDate }) fetches from API
    ↓
Events grouped by location (lat,lng) in useMemo
    ↓
Leaflet marker clustering renders grouped events
```

### Key Files

| File | Purpose |
|------|---------|
| [MapView.tsx](../src/components/MapView.tsx) | Top-level container, search overlay |
| [Map.tsx](../src/components/map/Map.tsx) | Main Leaflet logic, event filtering |
| [EventMarkerLayer.tsx](../src/components/map/MarkerSettings/EventMarkerLayer.tsx) | Marker clustering configuration |
| [MapViewEventsFilter.tsx](../src/components/filters/MapViewEventsFilter.tsx) | Date filter buttons |
| [date-filter-utils.ts](../src/lib/utils/date-filter-utils.ts) | Date range calculations |

### Performance Characteristics

| Metric | Current Value | Notes |
|--------|---------------|-------|
| Events fetched | All in date range | No viewport filtering |
| Clustering threshold | 40px radius | Forms ~100-200 clusters for UK view |
| Unclustering zoom | Level 12 | Individual markers at street level |
| Render mode | Canvas | Optimised for 250+ markers |
| Animation | Disabled | Instant pan/zoom response |

### Current Assessment

**Working Well:**
- Marker clustering handles volume efficiently
- Date filtering is accurate and responsive
- Search with auto-zoom to single result works smoothly
- Canvas renderer provides good performance

**No Changes Required** - Map view is performing as expected.

---

## Priority 2: List View (Event Browsing)

### Current Behaviour

Users see events grouped into date categories, filtered by location radius. Events within each group are sorted by date, then time.

**Current Groupings (Updated):**
| Group | Definition |
|-------|------------|
| Today | Events with date = today |
| Tomorrow | Events with date = tomorrow |
| This Week | Events after tomorrow → Sunday (inclusive) |
| Next Week | Monday → Sunday (following week) |
| Coming Soon | After next week → 8 weeks from today |
| Future Events | Everything beyond 8 weeks |

### Data Flow

```
User location + radius from EventsContext
    ↓
useEventsForList() fetches all events via useAllPublicEvents()
    ↓
Client-side Haversine filtering (distance ≤ radius)
    ↓
ListView.tsx groups events into 6 categories
    ↓
Each category sorted by date, then startTime
    ↓
Render EventCard (Today/Tomorrow) or EventRow (other sections)
```

### Key Files

| File | Purpose |
|------|---------|
| [ListView.tsx](../src/components/ListView.tsx) | Main container, grouping logic |
| [EventCard.tsx](../src/components/listview/EventCard.tsx) | Card display (Today section) |
| [EventRow.tsx](../src/components/listview/EventRow.tsx) | Row display (other sections) |
| [EventSectionHeader.tsx](../src/components/listview/EventSectionHeader.tsx) | Collapsible section headers |
| [useEventsForList.ts](../src/hooks/useEventsForList.ts) | Fetch + radius filtering |

### Performance Characteristics

| Metric | Current Value | Notes |
|--------|---------------|-------|
| Radius filtering | < 1ms for 250 events | Haversine in useMemo |
| Grouping | 6 categories | Instant recalculation |
| Sorting | Date then time | O(n log n) per group |
| Memory | All events in memory | No pagination |

---

## Issues Identified

### Summary Table

| # | Issue | Type | Severity | Status |
|---|-------|------|----------|--------|
| 1 | Dark mode hover contrast | UI | High | ✅ Fixed |
| 2 | Column alignment between sections | UI | Medium | ✅ Fixed |
| 3 | "This Week" ends Saturday not Sunday | Logic | High | ✅ Fixed |
| 4 | Confusing "This Month" group name | UX | Medium | ✅ Fixed |
| 5 | Dates appear out of order in groups | UX | Low | ✅ Fixed (by #3,#4) |
| 6 | No long-term future visibility | UX | Low | ✅ Fixed |

---

### Issue 1: Dark Mode Hover Contrast Bug (UI) ✅ FIXED

**Severity:** High - Readability issue
**File:** [ListView.tsx:458](../src/components/ListView.tsx#L458)
**Status:** ✅ Fixed

**Problem:** In dark mode, when hovering over event rows, the background changes but text remains light-colored, making it unreadable.

**Root Cause:** The semi-transparent `gray-800/50` wasn't providing enough contrast against the dark background.

**Fix Applied:**
```tsx
// Before
className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"

// After
className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
```

---

### Issue 2: Column Alignment Between Sections (UI) ✅ FIXED

**Severity:** Medium - Visual inconsistency
**File:** [ListView.tsx:419-466](../src/components/ListView.tsx#L419-L466)
**Status:** ✅ Fixed (Option A)

**Problem:** The Time, Artist, Venue, and Town columns didn't align vertically between different date sections.

**Root Cause:** Each section has its own `<table>` with auto-sized columns based on content.

**Fix Applied:**
1. Added `md:table-fixed` to table element
2. Added fixed widths to desktop columns:

```tsx
// Table element
<table className="min-w-full md:table-fixed">

// Column widths
Date:   w-28  (112px)
Time:   w-20  (80px)
Artist: w-56  (224px)
Venue:  w-56  (224px)
Town:   w-36  (144px)
Price:  w-24  (96px)
```

---

### Issue 3: Date Grouping Logic Bug (Logic) ✅ FIXED

**Severity:** High - Incorrect data display
**File:** [event-grouping.ts](../src/lib/utils/event-grouping.ts)
**Status:** ✅ Fixed

**Problem:** The "end of week" calculation used `6 - dayOfWeek` which gave **Saturday**, not Sunday.

**Fix Applied:** Created new `event-grouping.ts` utility with correct calculation:
```typescript
// End of this week (Sunday)
if (dayOfWeek === 0) {
  // Today is Sunday, end of week is today
} else {
  const daysUntilSunday = 7 - dayOfWeek;
  endOfThisWeek.setDate(today.getDate() + daysUntilSunday);
}
```

---

### Issue 4: Confusing Group Names (UX) ✅ FIXED

**Severity:** Medium - User confusion
**File:** [ListView.tsx](../src/components/ListView.tsx)
**Status:** ✅ Fixed

**Problem:** "This Month" was confusing - only contained events after next week but within current month.

**Fix Applied:** Replaced "This Month" with "Coming Soon" (next 8 weeks after Next Week).

---

### Issue 5: Dates Appear Out of Order (UX) ✅ FIXED

**Severity:** Low - Minor confusion
**Status:** ✅ Fixed (by #3 and #4)

**Problem:** Events within groups appeared with unexpected dates.

**Fix:** Corrected grouping boundaries now show events in expected ranges.

---

### Issue 6: No Long-Term Future Visibility (UX) ✅ FIXED

**Severity:** Low - Feature gap
**File:** [event-grouping.ts](../src/lib/utils/event-grouping.ts)
**Status:** ✅ Fixed

**Problem:** "Future" was a catch-all for everything beyond current month.

**Fix Applied:**
- "Coming Soon" = next 8 weeks after Next Week
- "Future Events" = everything beyond 8 weeks (clear distinction)

---

## Proposed Changes (To Be)

### New Grouping Structure

| Group | Definition | Display |
|-------|------------|---------|
| **Today** | date = today | Card grid |
| **Tomorrow** | date = tomorrow | Card grid |
| **This Week** | date > tomorrow AND date ≤ Sunday | Table rows |
| **Next Week** | Monday → Sunday (following week) | Table rows |
| **Coming Soon** | After next week → 8 weeks from today | Table rows |
| **Future Events** | Beyond 8 weeks (including future years) | Table rows |

### Key Changes

1. **Fix "This Week" boundary** to include through Sunday (not Saturday)
2. **Remove "This Month"** - confusing and arbitrary
3. **Add "Coming Soon"** - next 8 weeks provides useful planning horizon
4. **Rename "Future" → "Future Events"** - clearer intent

### Boundary Calculations (Proposed)

```typescript
const today = startOfDay(new Date());
const tomorrow = addDays(today, 1);

// End of this week = upcoming Sunday 23:59:59
const endOfThisWeek = new Date(today);
const daysUntilSunday = (7 - today.getDay()) % 7 || 7; // Handle Sunday = 0
endOfThisWeek.setDate(today.getDate() + daysUntilSunday);
endOfThisWeek.setHours(23, 59, 59, 999);

// Next week = Monday after this week → Sunday of that week
const startOfNextWeek = addDays(endOfThisWeek, 1); // Monday
const endOfNextWeek = addDays(startOfNextWeek, 6); // Sunday

// Coming Soon = after next week → 8 weeks from today
const endOfComingSoon = addDays(today, 8 * 7); // 56 days

// Future = everything after Coming Soon
```

### Grouping Logic (Proposed)

```typescript
function categoriseEvent(eventDate: Date, boundaries: DateBoundaries): GroupName {
  const d = startOfDay(eventDate);

  if (isSameDay(d, boundaries.today)) return 'today';
  if (isSameDay(d, boundaries.tomorrow)) return 'tomorrow';
  if (d > boundaries.tomorrow && d <= boundaries.endOfThisWeek) return 'thisWeek';
  if (d >= boundaries.startOfNextWeek && d <= boundaries.endOfNextWeek) return 'nextWeek';
  if (d > boundaries.endOfNextWeek && d <= boundaries.endOfComingSoon) return 'comingSoon';
  return 'futureEvents';
}
```

---

## Implementation Considerations

### Option A: Fix in ListView Only

**Scope:** Modify `ListView.tsx` grouping logic only

**Pros:**
- Minimal change surface
- No shared utility changes
- Quick to implement

**Cons:**
- Grouping logic duplicated from date-filter-utils.ts
- Potential future drift between Map and List calculations

### Option B: Centralise Date Logic

**Scope:** Create shared grouping utility, use in both views

**Pros:**
- Single source of truth for date boundaries
- Easier to maintain consistency
- Enables future features (e.g., showing group in event detail)

**Cons:**
- More refactoring required
- Map view uses different concept (ranges vs. buckets)

### Recommendation

**Option A** - The Map view and List view serve different purposes:
- Map: "Show me events IN this time period" (filter)
- List: "Organise all future events into readable groups" (categorisation)

These are conceptually different, so shared logic may over-complicate things. Fix the ListView grouping independently.

---

## Performance Impact Assessment

### Current Pain Points

| Issue | Impact | Severity |
|-------|--------|----------|
| No pagination | All events in memory | Low (< 1000 events currently) |
| No virtual scrolling | DOM has all rows | Low (collapsible sections mitigate) |
| Re-grouping on filter change | O(n) categorisation | Negligible (< 10ms) |

### Future Scaling Concerns

| Scale | Events | Expected Impact |
|-------|--------|-----------------|
| Current | 250-500/weekend | No issues |
| 6 months | 1,000+ | Consider virtual scrolling |
| 1 year | 5,000+ | Require pagination + virtual scroll |

### Recommended Performance Work

**Not required now, but plan for:**
1. Virtual scrolling (react-window) when events exceed 500
2. Cursor-based pagination when events exceed 1,000
3. Consider lazy loading "Future Events" section

---

## Testing Checklist

When implementing changes, verify:

**UI Issues:**
- [ ] Dark mode: hover over event row shows readable text (Issue #1)
- [ ] Dark mode: hover background is visibly different from row background
- [ ] Light mode: hover over event row shows readable text
- [ ] Column alignment: Time, Artist, Venue columns align across all sections (Issue #2)

**Date Grouping:**
- [ ] Today (Monday) shows events only for Monday
- [ ] Tomorrow (Tuesday) shows events only for Tuesday
- [ ] This Week (Wed-Sun) shows remaining weekdays through Sunday (Issue #3)
- [ ] Next Week (Mon-Sun) shows correct 7-day range
- [ ] Coming Soon shows 8 weeks of events after Next Week (Issue #4, #6)
- [ ] Future Events shows everything beyond 8 weeks

**General:**
- [ ] Events within each group are sorted by date, then time
- [ ] Collapsible sections work correctly
- [ ] Search filtering works across all groups
- [ ] Radius filtering applies to all groups
- [ ] No events appear in multiple groups
- [ ] Past events are excluded

---

## Open Questions

1. **What day does the week start?** Currently assumes Sunday = 0 (US convention). UK users might expect Monday = start of week. Does "This Week" include the current Sunday or the next Sunday?

2. **Should "Coming Soon" have a configurable horizon?** 8 weeks is arbitrary. Should this be a setting?

3. **Should empty groups be hidden?** Currently all groups render even if empty.

4. **Should we show event counts in group headers?** Currently shows count - confirm this is desired.

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-06 | Document created | Capture as-is state for CTO review |
| 2026-04-06 | Added UI issues #1, #2 | Dark mode hover + column alignment identified |
| 2026-04-06 | Fixed Issue #1 | Changed `dark:hover:bg-gray-800/50` → `dark:hover:bg-gray-700` |
| 2026-04-06 | Fixed Issue #2 | Added fixed column widths + `table-fixed` class |
| 2026-04-06 | Fixed Issues #3-6 | Created `event-grouping.ts` utility with TDD, updated ListView |
| | | |

---

## Next Steps

**All Issues Fixed:**
1. [x] Fix dark mode hover contrast (Issue #1) - ✅ Done
2. [x] Add fixed column widths for alignment (Issue #2) - ✅ Done
3. [x] Write tests for new grouping logic (TDD) - ✅ Done (12 tests passing)
4. [x] Implement ListView date grouping changes - ✅ Done
5. [ ] Manual QA across date scenarios
6. [ ] Deploy and verify in staging

---

## Appendix A: New Event Grouping Utility

**Location:** `src/lib/utils/event-grouping.ts`

```typescript
// New centralized utility with correct date calculations

export type EventGroup = 'today' | 'tomorrow' | 'thisWeek' | 'nextWeek' | 'comingSoon' | 'futureEvents';

export function getGroupBoundaries(baseDate: Date = new Date()): GroupBoundaries {
  const today = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // End of this week (Sunday) - FIXED: was using 6-dayOfWeek (Saturday)
  const dayOfWeek = today.getDay();
  const endOfThisWeek = new Date(today);
  if (dayOfWeek !== 0) {
    const daysUntilSunday = 7 - dayOfWeek;  // Correct calculation
    endOfThisWeek.setDate(today.getDate() + daysUntilSunday);
  }

  // Next week = Monday after this week → Sunday of that week
  const startOfNextWeek = new Date(endOfThisWeek);
  startOfNextWeek.setDate(endOfThisWeek.getDate() + 1);
  const endOfNextWeek = new Date(startOfNextWeek);
  endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);

  // Coming Soon = 8 weeks from today (replaces confusing "This Month")
  const endOfComingSoon = new Date(today);
  endOfComingSoon.setDate(today.getDate() + 8 * 7);

  return { today, tomorrow, endOfThisWeek, startOfNextWeek, endOfNextWeek, endOfComingSoon };
}

export function getEventGroup(eventDate: Date, baseDate: Date = new Date()): EventGroup | null {
  const boundaries = getGroupBoundaries(baseDate);
  const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());

  if (eventDay < boundaries.today) return null;  // Past events
  if (eventDay.getTime() === boundaries.today.getTime()) return 'today';
  if (eventDay.getTime() === boundaries.tomorrow.getTime()) return 'tomorrow';
  if (eventDay > boundaries.tomorrow && eventDay <= boundaries.endOfThisWeek) return 'thisWeek';
  if (eventDay >= boundaries.startOfNextWeek && eventDay <= boundaries.endOfNextWeek) return 'nextWeek';
  if (eventDay > boundaries.endOfNextWeek && eventDay <= boundaries.endOfComingSoon) return 'comingSoon';
  return 'futureEvents';
}
```

**Test Coverage:** 12 tests in `event-grouping.test.ts` covering:
- Boundary calculations for Tuesday, Sunday, Saturday
- Grouping for all 6 categories
- Edge cases (Sunday as today, Saturday as today)
- Past event filtering

---

## Appendix B: Map View Date Filter Code

**Location:** `src/lib/utils/date-filter-utils.ts`

```typescript
export function getDateRange(filter: DateRangeFilter, baseDate: Date = new Date()) {
  const today = new Date(baseDate);
  today.setHours(0, 0, 0, 0);

  let startDate = new Date(today);
  let endDate = new Date(today);

  switch (filter) {
    case 'today':
      endDate.setHours(23, 59, 59, 999);
      break;

    case 'thisWeek':
      if (today.getDay() !== 0) {
        endDate.setDate(today.getDate() + (7 - today.getDay()));
      }
      endDate.setHours(23, 59, 59, 999);
      break;

    case 'thisWeekend':
      const dayOfWeek = today.getDay();
      if (dayOfWeek === 0) {
        // Sunday - weekend is today only
      } else if (dayOfWeek === 6) {
        // Saturday - weekend is today and tomorrow
        endDate.setDate(today.getDate() + 1);
      } else {
        // Weekday - find upcoming Friday
        startDate.setDate(today.getDate() + (5 - dayOfWeek));
        endDate.setDate(today.getDate() + (7 - dayOfWeek));
      }
      endDate.setHours(23, 59, 59, 999);
      break;

    case 'nextWeek':
      const daysUntilNextMonday = today.getDay() === 0 ? 1 : (7 - today.getDay() + 1);
      startDate.setDate(today.getDate() + daysUntilNextMonday);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;

    case 'nextWeekend':
      // Calculate this week's Friday
      let thisFriday = new Date(today);
      const daysToFriday = (5 - today.getDay() + 7) % 7;
      thisFriday.setDate(today.getDate() + daysToFriday);

      // Next Friday is 7 days later
      startDate = new Date(thisFriday);
      startDate.setDate(thisFriday.getDate() + 7);

      // Sunday is 2 days after Friday
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 2);
      endDate.setHours(23, 59, 59, 999);
      break;
  }

  return { startDate, endDate };
}
```
