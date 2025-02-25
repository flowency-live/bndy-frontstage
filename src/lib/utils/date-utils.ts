// src/lib/utils/date-utils.ts
// Keep this file mostly as is, it's very useful!

export function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) {
    return 'th';
  }
  
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

export function formatEventDate(date: Date): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Normalize current date to midnight for comparison

  const eventDate = new Date(date);
  eventDate.setHours(0, 0, 0, 0); // Normalize event date

  const day = eventDate.getDate();
  const month = eventDate.toLocaleString('default', { month: 'short' });
  const weekday = eventDate.toLocaleString('default', { weekday: 'short' });

  const timeDiff = eventDate.getTime() - now.getTime();
  const dayDiff = timeDiff / (1000 * 60 * 60 * 24);

  if (dayDiff === 0) {
    return `Today`;
  } else if (dayDiff === 1) {
    return `Tomorrow`;
  }

  return `${weekday} ${day}${getOrdinalSuffix(day)} ${month}`;
}

export function formatTime(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  let hours12 = hours % 12;
  hours12 = hours12 === 0 ? 12 : hours12;
  return `${hours12}:${minutes.toString().padStart(2, '0')}${period}`;
}
  
  
  /**
   * Formats a full event datetime (e.g., "Sat 22nd Feb @ 7:00PM")
   */
  export function formatEventDateTime(date: Date, time24: string): string {
    return `${formatEventDate(date)} @ ${formatTime(time24)}`;
  }
  
  /**
   * Converts time from 12-hour format to 24-hour format
   */
  export function convertTo24Hour(time12: string): string {
    const [time, period] = time12.split(/\s*(AM|PM)/i);
    let [hours, minutes] = time.split(':').map(Number);
    
    if (period.toUpperCase() === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period.toUpperCase() === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  /**
   * Add hours to a time in 24-hour format
   */
  export function addHoursTo24HourTime(time24: string, hoursToAdd: number): string {
    const [hours, minutes] = time24.split(':').map(Number);
    const newHours = (hours + hoursToAdd) % 24;
    return `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  /**
   * Parse date string safely
   */
  export function parseEventDate(dateStr: string): Date | null {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  }

// For Event Importer
  export function parseDate(dateText: string): string {
    try {
      // Handle various date formats
      // First, try direct parsing
      const date = new Date(dateText);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
  
      // Try UK format (DD/MM/YYYY)
      const ukFormat = /(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/;
      const ukMatch = dateText.match(ukFormat);
      if (ukMatch) {
        const [_, day, month, year] = ukMatch;
        const fullYear = year.length === 2 ? '20' + year : year;
        const date = new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        return date.toISOString().split('T')[0];
      }
  
      // Try text format (e.g., "Thursday, February 20, 2025")
      const textDate = new Date(dateText);
      if (!isNaN(textDate.getTime())) {
        return textDate.toISOString().split('T')[0];
      }
  
      throw new Error(`Unable to parse date: ${dateText}`);
    } catch (error) {
      console.error('Date parsing error:', error);
      return new Date().toISOString().split('T')[0]; // Fallback to today
    }
  }