// src/lib/utils/venue-search.test.ts
// TDD: Write tests FIRST for dual-source venue search logic

import {
  searchVenues,
  filterDuplicates,
  calculateDistance,
  calculateNameSimilarity,
} from './venue-search';
import type { Venue } from '../types';

// Mock fetch for API calls
global.fetch = jest.fn();

describe('calculateDistance', () => {
  it('returns 0 for identical coordinates', () => {
    const distance = calculateDistance(
      { lat: 51.5074, lng: -0.1278 },
      { lat: 51.5074, lng: -0.1278 }
    );
    expect(distance).toBe(0);
  });

  it('calculates distance correctly for nearby points', () => {
    // London to nearby point (~100m away)
    const distance = calculateDistance(
      { lat: 51.5074, lng: -0.1278 },
      { lat: 51.5084, lng: -0.1278 }
    );
    expect(distance).toBeGreaterThan(90);
    expect(distance).toBeLessThan(120);
  });

  it('calculates distance for far points', () => {
    // London to Paris
    const distance = calculateDistance(
      { lat: 51.5074, lng: -0.1278 },
      { lat: 48.8566, lng: 2.3522 }
    );
    expect(distance).toBeGreaterThan(300000); // ~340km
  });
});

describe('calculateNameSimilarity', () => {
  it('returns 100 for identical names', () => {
    expect(calculateNameSimilarity('The Garage', 'The Garage')).toBe(100);
  });

  it('returns high score for case-insensitive match', () => {
    expect(calculateNameSimilarity('The Garage', 'the garage')).toBe(100);
  });

  it('returns high score for names with different punctuation', () => {
    const score = calculateNameSimilarity('The Dog & Rat', 'The Dog and Rat');
    expect(score).toBeGreaterThan(85);
  });

  it('returns low score for completely different names', () => {
    const score = calculateNameSimilarity('The Garage', 'The Royal Oak');
    expect(score).toBeLessThan(50);
  });

  it('matches name variants correctly', () => {
    const score = calculateNameSimilarity('Dog and Rot', 'Leek Conservative Club');
    expect(score).toBeLessThan(50); // Different names, but nameVariants will handle this
  });
});

describe('filterDuplicates', () => {
  const bndyVenue: Venue = {
    id: 'venue-1',
    name: 'The Garage',
    address: '123 Main St',
    location: { lat: 51.5074, lng: -0.1278 },
    googlePlaceId: 'ChIJ123',
    validated: true,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  };

  const googleVenue = {
    placeId: 'ChIJ123',
    name: 'The Garage',
    address: '123 Main Street',
    location: { lat: 51.5074, lng: -0.1278 },
  };

  it('filters duplicates by googlePlaceId (tier 1)', () => {
    const result = filterDuplicates([bndyVenue], [googleVenue]);

    expect(result.bndyVenues).toHaveLength(1);
    expect(result.googleVenues).toHaveLength(0);
  });

  it('filters duplicates by coordinates within 50m (tier 2)', () => {
    const googleVenueNoPlaceId = {
      placeId: 'ChIJ999', // Different place ID
      name: 'The Garage',
      address: '123 Main Street',
      location: { lat: 51.50741, lng: -0.12781 }, // ~1m away
    };

    const bndyVenueNoPlaceId = { ...bndyVenue, googlePlaceId: undefined };

    const result = filterDuplicates([bndyVenueNoPlaceId], [googleVenueNoPlaceId]);

    expect(result.bndyVenues).toHaveLength(1);
    expect(result.googleVenues).toHaveLength(0);
  });

  it('filters duplicates by name similarity >85% (tier 3)', () => {
    const googleVenueSimilarName = {
      placeId: 'ChIJ999',
      name: 'The Garage', // Exact match but with different location/placeId
      address: '456 Other St',
      location: { lat: 51.5100, lng: -0.1300 }, // >50m away
    };

    // Change bndyVenue to not have a googlePlaceId for this test
    const bndyVenueNoPlaceId = { ...bndyVenue, googlePlaceId: undefined };

    const result = filterDuplicates([bndyVenueNoPlaceId], [googleVenueSimilarName]);

    expect(result.bndyVenues).toHaveLength(1);
    expect(result.googleVenues).toHaveLength(0);
  });

  it('keeps both venues if no duplicate detected', () => {
    const googleVenueDifferent = {
      placeId: 'ChIJ999',
      name: 'The Royal Oak',
      address: '789 Far St',
      location: { lat: 51.6000, lng: -0.2000 },
    };

    const result = filterDuplicates([bndyVenue], [googleVenueDifferent]);

    expect(result.bndyVenues).toHaveLength(1);
    expect(result.googleVenues).toHaveLength(1);
  });

  it('handles empty arrays', () => {
    const result = filterDuplicates([], []);
    expect(result.bndyVenues).toHaveLength(0);
    expect(result.googleVenues).toHaveLength(0);
  });

  it('handles multiple venues with mixed duplicates', () => {
    const bndyVenues = [
      bndyVenue,
      {
        ...bndyVenue,
        id: 'venue-2',
        name: 'The Royal Oak',
        googlePlaceId: undefined,
        location: { lat: 52.0, lng: -0.5 },
      },
    ];

    const googleVenues = [
      googleVenue, // Duplicate of venue-1 by placeId
      {
        placeId: 'ChIJ888',
        name: 'The Bull',
        address: '999 New St',
        location: { lat: 53.0, lng: -1.0 },
      },
    ];

    const result = filterDuplicates(bndyVenues, googleVenues);

    expect(result.bndyVenues).toHaveLength(2);
    expect(result.googleVenues).toHaveLength(1);
    expect(result.googleVenues[0].name).toBe('The Bull');
  });
});

describe('searchVenues', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it('searches BNDY venues with nameVariants', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        venues: [
          {
            id: 'venue-1',
            name: 'Leek Conservative Club',
            nameVariants: ['Dog and Rot', 'Dog & Rot'],
            address: '123 Main St',
            location: { lat: 51.5074, lng: -0.1278 },
          },
        ],
      }),
    });

    const result = await searchVenues('Dog and Rot', { lat: 51.5, lng: -0.1 });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/venues/search'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          query: 'Dog and Rot',
          includeNameVariants: true,
          types: ['bar', 'night_club', 'music_venue'],
        }),
      })
    );

    expect(result.bndyVenues).toHaveLength(1);
    expect(result.bndyVenues[0].name).toBe('Leek Conservative Club');
  });

  it('handles BNDY API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    await expect(
      searchVenues('Test Query', { lat: 51.5, lng: -0.1 })
    ).rejects.toThrow('Network error');
  });

  it('handles non-OK responses from BNDY API', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(
      searchVenues('Test Query', { lat: 51.5, lng: -0.1 })
    ).rejects.toThrow('HTTP 500');
  });

  it('returns empty results when no venues found', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ venues: [] }),
    });

    const result = await searchVenues('Nonexistent Venue', { lat: 51.5, lng: -0.1 });

    expect(result.bndyVenues).toHaveLength(0);
    expect(result.googleVenues).toHaveLength(0);
  });
});
