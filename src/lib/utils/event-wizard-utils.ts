// src/lib/utils/event-wizard-utils.ts
// Event Wizard Pure Utility Functions (<200 LOC)

import type { EventWizardFormData } from '../types';

/**
 * Get default start time based on day of week
 * Friday/Saturday default to 9 PM, other days return empty string
 */
export function getDefaultStartTime(date: Date): string {
  const dayOfWeek = date.getDay();
  const isFriOrSat = dayOfWeek === 5 || dayOfWeek === 6;
  return isFriOrSat ? '21:00' : '';
}

/**
 * Calculate end time by adding 3 hours to start time
 * Handles midnight rollover correctly
 */
export function calculateEndTime(startTime: string): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const endHour = (hours + 3) % 24;
  return `${String(endHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Generate event name based on form data
 * Returns empty string if no venue
 */
export function generateEventName(formData: EventWizardFormData): string {
  const { venue, artists, isOpenMic, eventType } = formData;

  if (!venue) return '';

  if (isOpenMic) {
    return `Open Mic @ ${venue.name}`;
  }

  if (artists.length === 0) {
    return `Event @ ${venue.name}`;
  }

  if (eventType === 'single' || artists.length === 1) {
    return `${artists[0].name} @ ${venue.name}`;
  }

  if (artists.length === 2) {
    return `${artists[0].name} & ${artists[1].name} @ ${venue.name}`;
  }

  return `${artists[0].name} & others @ ${venue.name}`;
}

/**
 * Check if Quick Add is eligible
 * Requires: venue + (artist OR open mic) + date + (time OR Fri/Sat)
 */
export function checkQuickAddEligibility(formData: EventWizardFormData): boolean {
  const { venue, artists, date, startTime, isOpenMic } = formData;

  // Must have venue
  if (!venue) return false;

  // Must have at least one artist (or be open mic)
  if (artists.length === 0 && !isOpenMic) return false;

  // Must have date
  if (!date) return false;

  // Either manual time, or Fri/Sat (auto-defaults to 9 PM)
  if (startTime) return true;

  const dateObj = new Date(date);
  const dayOfWeek = dateObj.getDay();
  const isFriOrSat = dayOfWeek === 5 || dayOfWeek === 6;

  return isFriOrSat;
}
