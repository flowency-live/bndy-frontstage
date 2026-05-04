/**
 * Isolated event hook for white-label tenants
 *
 * This hook is COMPLETELY ISOLATED from the main BNDY app:
 * - Does NOT import or modify useEventsForList
 * - Does NOT use EventsContext
 * - Fetches directly from API and applies its own radius filtering
 *
 * To remove white-label functionality, delete the entire whitelabel/ folder.
 */

import { useQuery } from '@tanstack/react-query';
import { calculateDistance } from '@/lib/utils/geo';
import type { Event } from '@/lib/types';

interface UseWhitelabelEventsOptions {
  /** Center point for radius filtering */
  center: { lat: number; lng: number };
  /** Radius in miles from center */
  radiusMiles: number;
  /** Start date (YYYY-MM-DD) */
  startDate: string;
  /** End date (YYYY-MM-DD) */
  endDate: string;
  /** Whether to enable the query */
  enabled?: boolean;
}

/** Event with distance from center */
export interface WhitelabelEvent extends Event {
  distanceMiles: number;
}

// DynamoDB event format (copied from useAllPublicEvents to maintain isolation)
interface DynamoDBEvent {
  id: string;
  title?: string;
  name?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  venueId: string;
  venueName?: string;
  venueCity?: string;
  venue?: { city?: string };
  artistId?: string;
  artistName?: string;
  geoLat: number;
  geoLng: number;
  description?: string;
  ticketed?: boolean;
  ticketinformation?: string;
  ticketUrl?: string;
  eventUrl?: string;
  source?: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
  isOpenMic?: boolean;
  postcode?: string;
  hasCustomTitle?: boolean;
  price?: number;
}

/**
 * Fetch and filter events for white-label tenant
 *
 * - Fetches all events in date range from API
 * - Transforms DynamoDB format to frontstage Event format
 * - Filters by radius from center point
 * - Adds distanceMiles to each event
 * - Sorted by date and distance
 */
export function useWhitelabelEvents({
  center,
  radiusMiles,
  startDate,
  endDate,
  enabled = true,
}: UseWhitelabelEventsOptions) {
  return useQuery({
    queryKey: ['whitelabel-events', center.lat, center.lng, radiusMiles, startDate, endDate],
    queryFn: async (): Promise<WhitelabelEvent[]> => {
      const params = new URLSearchParams();
      params.append('startDate', startDate);
      params.append('endDate', endDate);

      const response = await fetch(
        `https://api.bndy.co.uk/api/events/public?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status}`);
      }

      const data = await response.json();

      // Transform and filter events
      const events: WhitelabelEvent[] = [];

      for (const event of data.events || []) {
        const dbEvent = event as DynamoDBEvent;

        // Skip events without valid location
        if (!dbEvent.geoLat || !dbEvent.geoLng) continue;

        // Calculate distance from center
        const distanceMiles = calculateDistance(
          center.lat,
          center.lng,
          dbEvent.geoLat,
          dbEvent.geoLng
        );

        // Skip events outside radius
        if (distanceMiles > radiusMiles) continue;

        // Transform to frontstage Event format with distance
        events.push({
          id: dbEvent.id,
          name: dbEvent.title || dbEvent.name || 'Unnamed Event',
          date: dbEvent.date,
          startTime: dbEvent.startTime || '21:00',
          endTime: dbEvent.endTime,
          venueId: dbEvent.venueId,
          venueName: dbEvent.venueName || '',
          venueCity: dbEvent.venue?.city,
          artistIds: dbEvent.artistId ? [dbEvent.artistId] : [],
          artistName: dbEvent.artistName,
          location: {
            lat: dbEvent.geoLat,
            lng: dbEvent.geoLng,
          },
          description: dbEvent.description,
          ticketed: dbEvent.ticketed,
          ticketinformation: dbEvent.ticketinformation,
          ticketUrl: dbEvent.ticketUrl,
          eventUrl: dbEvent.eventUrl,
          source: (dbEvent.source || 'bndy.live') as 'bndy.live' | 'user' | 'bndy.core',
          status: (dbEvent.status || 'approved') as 'pending' | 'approved' | 'rejected',
          createdAt: dbEvent.createdAt,
          updatedAt: dbEvent.updatedAt,
          isOpenMic: dbEvent.isOpenMic,
          postcode: dbEvent.postcode,
          hasCustomTitle: dbEvent.hasCustomTitle,
          price: dbEvent.price != null ? String(dbEvent.price) : undefined,
          distanceMiles,
        });
      }

      // Sort by date, then by distance
      events.sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.distanceMiles - b.distanceMiles;
      });

      return events;
    },
    staleTime: 5 * 60 * 1000, // 5 min
    gcTime: 10 * 60 * 1000,
    enabled,
  });
}
