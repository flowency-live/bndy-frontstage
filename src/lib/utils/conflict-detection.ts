// src/lib/utils/conflict-detection.ts
// Conflict detection logic for event wizard (<200 LOC)

import type { EventWizardFormData, WizardDateConflict } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.bndy.co.uk';

interface ConflictApiResponse {
  conflicts: Array<{
    type: 'exact_duplicate' | 'venue' | 'artist';
    eventId?: string;
    artistName?: string;
    message: string;
  }>;
}

/**
 * Check for event conflicts
 * Returns array of conflicts (empty if none)
 * Calls /api/artists/:artistId/events/check-conflicts endpoint
 */
export async function checkEventConflicts(
  formData: EventWizardFormData
): Promise<WizardDateConflict[]> {
  const { venue, artists, date, startTime, endTime, isOpenMic } = formData;

  // Need at least one artist to check conflicts
  if (!artists || artists.length === 0) {
    return [];
  }

  const artistId = artists[0].id; // Use first artist for conflict checking

  const response = await fetch(`${API_BASE_URL}/api/artists/${artistId}/events/check-conflicts`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      date,
      startTime,
      endTime: endTime || '00:00',
      venueId: venue?.id,
      isOpenMic,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  // Backend returns array of conflicting events
  // Convert to our wizard conflict format
  if (!data.conflicts || data.conflicts.length === 0) {
    return [];
  }

  return data.conflicts.map((event: any) => {
    // Check if exact duplicate (same venue, date, time)
    const isExactDuplicate = event.venueId === venue?.id &&
                            event.date === date &&
                            event.startTime === startTime;

    if (isExactDuplicate) {
      return {
        type: 'exact_duplicate' as const,
        severity: 'blocking' as const,
        message: 'This exact event already exists at this venue and time.',
        conflictingEventId: event.id,
      };
    }

    // Otherwise it's a scheduling conflict (artist double-booked or unavailable)
    return {
      type: 'artist' as const,
      severity: 'warning' as const,
      message: event.isUnavailability
        ? `A band member is unavailable at this time${event.unavailabilityReason ? ': ' + event.unavailabilityReason : ''}`
        : `${artists[0].name} has another event at this time`,
    };
  });
}
