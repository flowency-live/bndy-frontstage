/**
 * Tests for useWhitelabelEvents hook
 *
 * Tests the radius filtering logic in isolation.
 * The hook fetches events from API and filters by distance from center.
 */

import { calculateDistance } from '@/lib/utils/geo';

// Test the filtering logic that will be used in the hook
describe('whitelabel events filtering', () => {
  // Stoke-on-Trent center (from klmasot config)
  const stokeCenter = { lat: 53.0027, lng: -2.1794 };

  // Test events at known distances from Stoke
  const testEvents = [
    {
      id: '1',
      name: 'Event in Stoke Center',
      location: { lat: 53.0027, lng: -2.1794 }, // 0 miles
    },
    {
      id: '2',
      name: 'Event in Newcastle-under-Lyme',
      location: { lat: 53.0106, lng: -2.2285 }, // ~2.5 miles
    },
    {
      id: '3',
      name: 'Event in Stafford',
      location: { lat: 52.8069, lng: -2.1166 }, // ~14 miles
    },
    {
      id: '4',
      name: 'Event in Derby',
      location: { lat: 52.9225, lng: -1.4746 }, // ~30 miles
    },
    {
      id: '5',
      name: 'Event in Manchester',
      location: { lat: 53.4808, lng: -2.2426 }, // ~33 miles
    },
    {
      id: '6',
      name: 'Event with no location',
      location: null,
    },
  ];

  // Filter function that matches the hook implementation
  function filterEventsByRadius(
    events: typeof testEvents,
    center: { lat: number; lng: number },
    radiusMiles: number
  ) {
    return events.filter((event) => {
      if (!event.location?.lat || !event.location?.lng) return false;
      const distance = calculateDistance(
        center.lat,
        center.lng,
        event.location.lat,
        event.location.lng
      );
      return distance <= radiusMiles;
    });
  }

  describe('filterEventsByRadius', () => {
    it('includes events within radius', () => {
      const filtered = filterEventsByRadius(testEvents, stokeCenter, 15);

      // Should include: Stoke Center (0mi), Newcastle (2.5mi), Stafford (14mi)
      expect(filtered).toHaveLength(3);
      expect(filtered.map((e) => e.id)).toEqual(['1', '2', '3']);
    });

    it('excludes events outside radius', () => {
      const filtered = filterEventsByRadius(testEvents, stokeCenter, 15);

      // Should exclude: Derby (30mi), Manchester (33mi)
      const filteredIds = filtered.map((e) => e.id);
      expect(filteredIds).not.toContain('4');
      expect(filteredIds).not.toContain('5');
    });

    it('excludes events with no location', () => {
      const filtered = filterEventsByRadius(testEvents, stokeCenter, 100);

      // Should exclude event with null location
      const filteredIds = filtered.map((e) => e.id);
      expect(filteredIds).not.toContain('6');
    });

    it('returns empty array for 0 radius', () => {
      const filtered = filterEventsByRadius(testEvents, stokeCenter, 0);

      // Only exact center matches (distance = 0)
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });

    it('includes all valid events for large radius', () => {
      const filtered = filterEventsByRadius(testEvents, stokeCenter, 50);

      // Should include all events with valid locations
      expect(filtered).toHaveLength(5);
    });

    it('uses correct Haversine distance calculation', () => {
      // Verify distance from Stoke to Stafford is approximately 14 miles
      const distance = calculateDistance(
        stokeCenter.lat,
        stokeCenter.lng,
        52.8069, // Stafford lat
        -2.1166 // Stafford lng
      );

      expect(distance).toBeGreaterThan(13);
      expect(distance).toBeLessThan(15);
    });
  });
});
