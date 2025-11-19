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
 */
export async function checkEventConflicts(
  formData: EventWizardFormData
): Promise<WizardDateConflict[]> {
  const { venue, artists, date, startTime, isOpenMic } = formData;

  const response = await fetch(`${API_BASE_URL}/api/events/check-conflicts`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      venueId: venue?.id,
      artistIds: artists.map((a) => a.id),
      date,
      startTime,
      isOpenMic,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data: ConflictApiResponse = await response.json();

  return data.conflicts.map((conflict) => {
    if (conflict.type === 'exact_duplicate') {
      return {
        type: 'exact_duplicate',
        severity: 'blocking' as const,
        message: 'This exact event already exists. Please modify the details.',
        conflictingEventId: conflict.eventId,
      };
    } else if (conflict.type === 'venue') {
      return {
        type: 'venue',
        severity: 'warning' as const,
        message: `${venue?.name || 'This venue'} has another event at this time. Continue anyway?`,
      };
    } else {
      return {
        type: 'artist',
        severity: 'warning' as const,
        message: `${conflict.artistName || 'This artist'} has another event at this time. Continue anyway?`,
      };
    }
  });
}
