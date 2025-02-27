// src/lib/utils/date-filter-utils.ts
export type DateRangeFilter = 'today' | 'thisWeek' | 'thisWeekend' | 'nextWeek' | 'nextWeekend';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Centralized date range calculation for event filters
 * @param filter The filter type
 * @param baseDate The date to calculate from (defaults to today)
 * @returns Start and end dates for the filter
 */
export function getDateRange(filter: DateRangeFilter, baseDate: Date = new Date()): DateRange {
  // Normalize base date to midnight
  const today = new Date(baseDate);
  today.setHours(0, 0, 0, 0);
  
  let startDate = new Date(today);
  let endDate = new Date(today);
  
  switch (filter) {
    case 'today':
      // Start: today at 00:00:00
      // End: today at 23:59:59
      endDate.setHours(23, 59, 59, 999);
      break;
      
    case 'thisWeek':
      // Start: today
      // End: upcoming Sunday
      if (today.getDay() !== 0) { // If not Sunday
        endDate.setDate(today.getDate() + (7 - today.getDay())); // Next Sunday
      }
      endDate.setHours(23, 59, 59, 999);
      break;
      
    case 'thisWeekend':
      if (today.getDay() < 5) { // Before Friday
        // Start: upcoming Friday
        startDate.setDate(today.getDate() + (5 - today.getDay()));
      } 
      // If today is Friday, Saturday, or Sunday, start from today
      
      // End: upcoming Sunday (or today if today is Sunday)
      if (today.getDay() === 0) { // Sunday
        endDate = new Date(today);
      } else {
        const daysUntilSunday = today.getDay() === 0 ? 0 : 7 - today.getDay();
        endDate.setDate(today.getDate() + daysUntilSunday);
      }
      endDate.setHours(23, 59, 59, 999);
      break;
      
    case 'nextWeek':
      // Start: next Monday
      if (today.getDay() === 0) { // Today is Sunday
        startDate.setDate(today.getDate() + 1); // Monday is tomorrow
      } else {
        startDate.setDate(today.getDate() + ((7 - today.getDay()) % 7 + 1)); // Next Monday
      }
      
      // End: following Sunday
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
      
    case 'nextWeekend':
      // Calculate this week's Friday
      const thisWeekFriday = new Date(today);
      if (today.getDay() <= 5) { // Monday through Friday
        thisWeekFriday.setDate(today.getDate() + (5 - today.getDay())); // This Friday
      } else { // Saturday or Sunday
        thisWeekFriday.setDate(today.getDate() - (today.getDay() - 5)); // This past Friday
      }
      
      // Start: next Friday (7 days after this Friday)
      startDate = new Date(thisWeekFriday);
      startDate.setDate(thisWeekFriday.getDate() + 7);
      
      // End: next Sunday
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 2);
      endDate.setHours(23, 59, 59, 999);
      break;
  }
  
  return { startDate, endDate };
}

/**
 * Check if a date falls within a given date range
 * @param date The date to check
 * @param filter The filter type
 * @param baseDate The date to calculate from (defaults to today)
 * @returns True if the date is within the range
 */
export function isDateInRange(date: Date, filter: DateRangeFilter, baseDate: Date = new Date()): boolean {
  const { startDate, endDate } = getDateRange(filter, baseDate);
  return date >= startDate && date <= endDate;
}

/**
 * Format a date range for display or API use
 * @param filter The filter type
 * @param baseDate The date to calculate from (defaults to today)
 * @returns Date range formatted as ISO strings (YYYY-MM-DD)
 */
export function getFormattedDateRange(filter: DateRangeFilter, baseDate: Date = new Date()): { startDate: string, endDate: string } {
  const { startDate, endDate } = getDateRange(filter, baseDate);
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
}

/**
 * Get human-readable description of date range
 * @param filter The filter type
 * @param baseDate The date to calculate from (defaults to today)
 * @returns Formatted description (e.g., "Feb 25 - Mar 1")
 */
export function getDateRangeDescription(filter: DateRangeFilter, baseDate: Date = new Date()): string {
  const { startDate, endDate } = getDateRange(filter, baseDate);
  
  const formatOptions: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric' 
  };
  
  const start = startDate.toLocaleDateString('en-US', formatOptions);
  const end = endDate.toLocaleDateString('en-US', formatOptions);
  
  if (start === end) {
    return start;
  }
  
  return `${start} - ${end}`;
}

/**
 * Debugging utility to analyze all date filters
 */