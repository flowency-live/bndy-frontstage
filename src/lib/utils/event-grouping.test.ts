// src/lib/utils/event-grouping.test.ts
import { getEventGroup, getGroupBoundaries } from './event-grouping';

// Helper to format date as YYYY-MM-DD in local timezone (avoids UTC conversion issues)
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

describe('event-grouping', () => {
  describe('getGroupBoundaries', () => {
    it('calculates correct boundaries for a Tuesday', () => {
      // Tuesday, April 8, 2025
      const baseDate = new Date(2025, 3, 8);
      const boundaries = getGroupBoundaries(baseDate);

      // Today = Tuesday April 8
      expect(formatLocalDate(boundaries.today)).toBe('2025-04-08');

      // Tomorrow = Wednesday April 9
      expect(formatLocalDate(boundaries.tomorrow)).toBe('2025-04-09');

      // End of this week = Sunday April 13 (5 days from Tuesday)
      expect(formatLocalDate(boundaries.endOfThisWeek)).toBe('2025-04-13');

      // Start of next week = Monday April 14
      expect(formatLocalDate(boundaries.startOfNextWeek)).toBe('2025-04-14');

      // End of next week = Sunday April 20
      expect(formatLocalDate(boundaries.endOfNextWeek)).toBe('2025-04-20');

      // End of coming soon = 8 weeks from today = June 3
      expect(formatLocalDate(boundaries.endOfComingSoon)).toBe('2025-06-03');
    });

    it('calculates correct boundaries for a Sunday', () => {
      // Sunday, April 6, 2025
      const baseDate = new Date(2025, 3, 6);
      const boundaries = getGroupBoundaries(baseDate);

      // Today = Sunday April 6
      expect(formatLocalDate(boundaries.today)).toBe('2025-04-06');

      // Tomorrow = Monday April 7
      expect(formatLocalDate(boundaries.tomorrow)).toBe('2025-04-07');

      // End of this week = Sunday April 6 (today, since it's already Sunday)
      expect(formatLocalDate(boundaries.endOfThisWeek)).toBe('2025-04-06');

      // Start of next week = Monday April 7
      expect(formatLocalDate(boundaries.startOfNextWeek)).toBe('2025-04-07');

      // End of next week = Sunday April 13
      expect(formatLocalDate(boundaries.endOfNextWeek)).toBe('2025-04-13');
    });

    it('calculates correct boundaries for a Saturday', () => {
      // Saturday, April 12, 2025
      const baseDate = new Date(2025, 3, 12);
      const boundaries = getGroupBoundaries(baseDate);

      // End of this week = Sunday April 13 (tomorrow)
      expect(formatLocalDate(boundaries.endOfThisWeek)).toBe('2025-04-13');

      // Start of next week = Monday April 14
      expect(formatLocalDate(boundaries.startOfNextWeek)).toBe('2025-04-14');
    });
  });

  describe('getEventGroup', () => {
    // Using Tuesday April 8, 2025 as base date for all tests
    const baseDate = new Date(2025, 3, 8);

    it('returns "today" for events on the current day', () => {
      const eventDate = new Date(2025, 3, 8);
      expect(getEventGroup(eventDate, baseDate)).toBe('today');
    });

    it('returns "tomorrow" for events on the next day', () => {
      const eventDate = new Date(2025, 3, 9);
      expect(getEventGroup(eventDate, baseDate)).toBe('tomorrow');
    });

    it('returns "thisWeek" for events between tomorrow and Sunday', () => {
      // Thursday April 10 (within this week)
      expect(getEventGroup(new Date(2025, 3, 10), baseDate)).toBe('thisWeek');

      // Friday April 11
      expect(getEventGroup(new Date(2025, 3, 11), baseDate)).toBe('thisWeek');

      // Saturday April 12
      expect(getEventGroup(new Date(2025, 3, 12), baseDate)).toBe('thisWeek');

      // Sunday April 13 (end of this week - should be included)
      expect(getEventGroup(new Date(2025, 3, 13), baseDate)).toBe('thisWeek');
    });

    it('returns "nextWeek" for events in the following Monday-Sunday', () => {
      // Monday April 14 (start of next week)
      expect(getEventGroup(new Date(2025, 3, 14), baseDate)).toBe('nextWeek');

      // Wednesday April 16
      expect(getEventGroup(new Date(2025, 3, 16), baseDate)).toBe('nextWeek');

      // Sunday April 20 (end of next week)
      expect(getEventGroup(new Date(2025, 3, 20), baseDate)).toBe('nextWeek');
    });

    it('returns "comingSoon" for events within 8 weeks after next week', () => {
      // Monday April 21 (start of week 3)
      expect(getEventGroup(new Date(2025, 3, 21), baseDate)).toBe('comingSoon');

      // May 15 (within 8 weeks)
      expect(getEventGroup(new Date(2025, 4, 15), baseDate)).toBe('comingSoon');

      // June 3 (exactly 8 weeks from April 8)
      expect(getEventGroup(new Date(2025, 5, 3), baseDate)).toBe('comingSoon');
    });

    it('returns "futureEvents" for events beyond 8 weeks', () => {
      // June 4 (beyond 8 weeks)
      expect(getEventGroup(new Date(2025, 5, 4), baseDate)).toBe('futureEvents');

      // July 2025
      expect(getEventGroup(new Date(2025, 6, 15), baseDate)).toBe('futureEvents');

      // Next year
      expect(getEventGroup(new Date(2026, 0, 1), baseDate)).toBe('futureEvents');
    });

    it('returns null for past events', () => {
      // Yesterday
      expect(getEventGroup(new Date(2025, 3, 7), baseDate)).toBeNull();

      // Last week
      expect(getEventGroup(new Date(2025, 3, 1), baseDate)).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('handles Sunday as today correctly - tomorrow takes precedence over nextWeek', () => {
      // On Sunday, "This Week" is empty since Today = end of week
      // But "Tomorrow" (Monday) is still shown as tomorrow, not nextWeek
      const sunday = new Date(2025, 3, 6); // Sunday April 6

      // Today (Sunday) -> 'today'
      expect(getEventGroup(new Date(2025, 3, 6), sunday)).toBe('today');

      // Tomorrow (Monday) -> 'tomorrow' (tomorrow takes precedence over week boundary)
      expect(getEventGroup(new Date(2025, 3, 7), sunday)).toBe('tomorrow');

      // Tuesday -> 'nextWeek' (day after tomorrow in next week)
      expect(getEventGroup(new Date(2025, 3, 8), sunday)).toBe('nextWeek');
    });

    it('handles Saturday as today correctly', () => {
      const saturday = new Date(2025, 3, 12); // Saturday April 12

      // Today (Saturday) -> 'today'
      expect(getEventGroup(new Date(2025, 3, 12), saturday)).toBe('today');

      // Tomorrow (Sunday) -> 'tomorrow'
      expect(getEventGroup(new Date(2025, 3, 13), saturday)).toBe('tomorrow');

      // Monday -> 'nextWeek'
      expect(getEventGroup(new Date(2025, 3, 14), saturday)).toBe('nextWeek');
    });
  });
});
