// src/lib/utils/event-grouping.ts

/**
 * Event grouping categories for ListView
 */
export type EventGroup = 'today' | 'tomorrow' | 'thisWeek' | 'nextWeek' | 'comingSoon' | 'futureEvents';

/**
 * Date boundaries for event grouping
 */
export interface GroupBoundaries {
  today: Date;
  tomorrow: Date;
  endOfThisWeek: Date;
  startOfNextWeek: Date;
  endOfNextWeek: Date;
  endOfComingSoon: Date;
}

/**
 * Calculate date boundaries for event grouping based on a reference date.
 *
 * Groups:
 * - Today: the current day
 * - Tomorrow: the next day
 * - This Week: days after tomorrow through Sunday
 * - Next Week: Monday through Sunday of the following week
 * - Coming Soon: 8 weeks from today (after next week)
 * - Future Events: everything beyond 8 weeks
 */
export function getGroupBoundaries(baseDate: Date = new Date()): GroupBoundaries {
  // Normalize to start of day
  const today = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());

  // Tomorrow
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // End of this week (Sunday)
  // JavaScript: Sunday = 0, Monday = 1, ..., Saturday = 6
  const dayOfWeek = today.getDay();
  const endOfThisWeek = new Date(today);

  if (dayOfWeek === 0) {
    // Today is Sunday, end of week is today
    // endOfThisWeek stays as today
  } else {
    // Days until Sunday: 7 - dayOfWeek
    const daysUntilSunday = 7 - dayOfWeek;
    endOfThisWeek.setDate(today.getDate() + daysUntilSunday);
  }

  // Start of next week (Monday after end of this week)
  const startOfNextWeek = new Date(endOfThisWeek);
  startOfNextWeek.setDate(endOfThisWeek.getDate() + 1);

  // End of next week (Sunday after start of next week)
  const endOfNextWeek = new Date(startOfNextWeek);
  endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);

  // End of "Coming Soon" = 8 weeks (56 days) from today
  const endOfComingSoon = new Date(today);
  endOfComingSoon.setDate(today.getDate() + 8 * 7);

  return {
    today,
    tomorrow,
    endOfThisWeek,
    startOfNextWeek,
    endOfNextWeek,
    endOfComingSoon,
  };
}

/**
 * Determine which group an event belongs to based on its date.
 *
 * @param eventDate - The date of the event
 * @param baseDate - The reference date (defaults to today)
 * @returns The group name, or null if the event is in the past
 */
export function getEventGroup(eventDate: Date, baseDate: Date = new Date()): EventGroup | null {
  const boundaries = getGroupBoundaries(baseDate);

  // Normalize event date to start of day for comparison
  const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());

  // Skip past events
  if (eventDay < boundaries.today) {
    return null;
  }

  // Today
  if (eventDay.getTime() === boundaries.today.getTime()) {
    return 'today';
  }

  // Tomorrow
  if (eventDay.getTime() === boundaries.tomorrow.getTime()) {
    return 'tomorrow';
  }

  // This Week (after tomorrow, up to and including Sunday)
  if (eventDay > boundaries.tomorrow && eventDay <= boundaries.endOfThisWeek) {
    return 'thisWeek';
  }

  // Next Week (Monday to Sunday of following week)
  if (eventDay >= boundaries.startOfNextWeek && eventDay <= boundaries.endOfNextWeek) {
    return 'nextWeek';
  }

  // Coming Soon (after next week, within 8 weeks from today)
  if (eventDay > boundaries.endOfNextWeek && eventDay <= boundaries.endOfComingSoon) {
    return 'comingSoon';
  }

  // Future Events (beyond 8 weeks)
  return 'futureEvents';
}

/**
 * Group order for display (maintains correct sequence)
 */
export const GROUP_ORDER: EventGroup[] = [
  'today',
  'tomorrow',
  'thisWeek',
  'nextWeek',
  'comingSoon',
  'futureEvents',
];

/**
 * Create an empty grouped events object
 */
export function createEmptyGroups(): Record<EventGroup, never[]> {
  return {
    today: [],
    tomorrow: [],
    thisWeek: [],
    nextWeek: [],
    comingSoon: [],
    futureEvents: [],
  };
}

/**
 * Group events by individual date (returns Map ordered by date)
 * Used for rendering date-grouped list view
 */
export function groupEventsByDate<T extends { date: string }>(
  events: T[]
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();

  // Sort events by date first
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  for (const event of sortedEvents) {
    const dateKey = event.date.split("T")[0]; // YYYY-MM-DD
    const existing = grouped.get(dateKey) || [];
    grouped.set(dateKey, [...existing, event]);
  }

  return grouped;
}

/**
 * Get relative label for a date ("Today", "Tomorrow", "In 8 days", etc.)
 */
export function getRelativeDateLabel(
  date: Date,
  baseDate: Date = new Date()
): string | undefined {
  const today = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate()
  );
  const targetDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const diffMs = targetDate.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 0) return undefined; // Past date
  if (diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays <= 14) return `In ${diffDays} days`;

  return undefined; // No label for dates far in the future
}

/**
 * Format date for display in date group header
 * Returns { day: "SAT 02", monthYear: "May 2026" }
 */
export function formatDateParts(date: Date): { day: string; monthYear: string } {
  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const dayOfWeek = dayNames[date.getDay()];
  const dayOfMonth = date.getDate().toString().padStart(2, "0");
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  return {
    day: `${dayOfWeek} ${dayOfMonth}`,
    monthYear: `${month} ${year}`
  };
}
