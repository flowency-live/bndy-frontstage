import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Event } from "@/lib/types";

interface UseAllPublicEventsOptions {
  startDate?: string;  // ISO format YYYY-MM-DD
  endDate?: string;
  enabled?: boolean;
}

// DynamoDB event format from backend
interface DynamoDBEvent {
  id: string;
  title?: string;
  name?: string;
  date: string;
  startTime: string;
  endTime?: string;
  venueId: string;
  venueName?: string;
  artistId?: string;
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
}

/**
 * Hook for fetching ALL public events in a date range
 *
 * This matches the venue pattern: fetch all, let Leaflet clustering handle display.
 * No viewport filtering - user can zoom out to entire UK and see all events.
 *
 * @param startDate - Start date (YYYY-MM-DD). Defaults to today.
 * @param endDate - End date (YYYY-MM-DD). Defaults to far future.
 * @param enabled - Whether to enable the query. Default true.
 */
export function useAllPublicEvents({ startDate, endDate, enabled = true }: UseAllPublicEventsOptions = {}) {
  return useQuery({
    queryKey: ['/api/events/public', { startDate, endDate }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const url = `/api/events/public${params.toString() ? '?' + params.toString() : ''}`;

      const response = await apiRequest('GET', url);
      const data = await response.json();

      // Transform: DynamoDB format → Frontstage format
      const transformedEvents = (data.events || []).map((event: DynamoDBEvent) => ({
        id: event.id,
        name: event.title || event.name || 'Unnamed Event',
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        venueId: event.venueId,
        venueName: event.venueName || '',
        artistIds: event.artistId ? [event.artistId] : [],
        location: {
          lat: event.geoLat,
          lng: event.geoLng
        },
        description: event.description,
        ticketed: event.ticketed,
        ticketinformation: event.ticketinformation,
        ticketUrl: event.ticketUrl,
        eventUrl: event.eventUrl,
        source: event.source || 'bndy.live',
        status: event.status || 'approved',
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
        isOpenMic: event.isOpenMic,
        postcode: event.postcode
      })) as Event[];

      return transformedEvents;
    },
    staleTime: 5 * 60 * 1000,  // 5 min (events change more than venues)
    gcTime: 10 * 60 * 1000,
    enabled,
  });
}
