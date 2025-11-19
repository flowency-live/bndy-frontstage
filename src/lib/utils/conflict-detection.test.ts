// src/lib/utils/conflict-detection.test.ts
// TDD: Write tests FIRST for conflict detection logic

import { checkEventConflicts } from './conflict-detection';
import type { EventWizardFormData, WizardDateConflict } from '../types';

// Mock fetch for API calls
global.fetch = jest.fn();

describe('checkEventConflicts', () => {
  const mockFormData: Partial<EventWizardFormData> = {
    venue: {
      id: 'venue-1',
      name: 'The Garage',
      address: '123 Main St',
      location: { lat: 51.5074, lng: -0.1278 },
      validated: true,
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    },
    artists: [
      {
        id: 'artist-1',
        name: 'John Smith',
        bio: 'A musician',
        location: 'London',
        profileImageUrl: null,
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      },
    ],
    date: '2025-11-21',
    startTime: '21:00',
    isOpenMic: false,
  };

  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it('returns empty array when no conflicts', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ conflicts: [] }),
    });

    const conflicts = await checkEventConflicts(mockFormData as EventWizardFormData);

    expect(conflicts).toEqual([]);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/events/check-conflicts'),
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      })
    );
  });

  it('returns blocking conflict for exact duplicate', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        conflicts: [
          {
            type: 'exact_duplicate',
            eventId: 'event-123',
            message: 'Exact duplicate event exists',
          },
        ],
      }),
    });

    const conflicts = await checkEventConflicts(mockFormData as EventWizardFormData);

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toMatchObject({
      type: 'exact_duplicate',
      severity: 'blocking',
      conflictingEventId: 'event-123',
    });
    expect(conflicts[0].message).toContain('already exists');
  });

  it('returns warning for venue time conflict', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        conflicts: [
          {
            type: 'venue',
            message: 'Venue has another event',
          },
        ],
      }),
    });

    const conflicts = await checkEventConflicts(mockFormData as EventWizardFormData);

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toMatchObject({
      type: 'venue',
      severity: 'warning',
    });
    expect(conflicts[0].message).toContain('The Garage');
  });

  it('returns warning for artist time conflict', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        conflicts: [
          {
            type: 'artist',
            artistName: 'John Smith',
            message: 'Artist has another event',
          },
        ],
      }),
    });

    const conflicts = await checkEventConflicts(mockFormData as EventWizardFormData);

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toMatchObject({
      type: 'artist',
      severity: 'warning',
    });
    expect(conflicts[0].message).toContain('John Smith');
  });

  it('handles multiple conflicts', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        conflicts: [
          { type: 'venue', message: 'Venue conflict' },
          { type: 'artist', artistName: 'John Smith', message: 'Artist conflict' },
        ],
      }),
    });

    const conflicts = await checkEventConflicts(mockFormData as EventWizardFormData);

    expect(conflicts).toHaveLength(2);
    expect(conflicts[0].type).toBe('venue');
    expect(conflicts[1].type).toBe('artist');
  });

  it('handles API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    await expect(checkEventConflicts(mockFormData as EventWizardFormData)).rejects.toThrow(
      'Network error'
    );
  });

  it('handles non-OK responses', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(checkEventConflicts(mockFormData as EventWizardFormData)).rejects.toThrow(
      'HTTP 500'
    );
  });

  it('sends correct payload to API', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ conflicts: [] }),
    });

    await checkEventConflicts(mockFormData as EventWizardFormData);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          venueId: 'venue-1',
          artistIds: ['artist-1'],
          date: '2025-11-21',
          startTime: '21:00',
          isOpenMic: false,
        }),
      })
    );
  });
});
