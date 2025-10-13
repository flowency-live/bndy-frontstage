import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import ngeohash from "ngeohash";
import type { Event } from "@/lib/types";

interface UseEventMapOptions {
  center: { lat: number; lng: number };
  startDate?: string;  // ISO format YYYY-MM-DD
  endDate?: string;
  enabled?: boolean;
}

/**
 * Hook for fetching events visible in current map viewport
 *
 * Three-step process:
 * 1. Geo query (server-side): Fetch event IDs by geohash6 + date range
 * 2. Batch fetch (server-side): Fetch full event data with artist/venue joins
 * 3. Client-side filtering: Genre, following, free (handled by EventsContext)
 *
 * Queries center geohash + 8 neighbors (9 total) in parallel for complete coverage
 */
export function useEventMap({ center, startDate, endDate, enabled = true }: UseEventMapOptions) {
  // Generate center geohash + 8 neighbors
  const centerHash = ngeohash.encode(center.lat, center.lng, 6);
  const neighbors = ngeohash.neighbors(centerHash);
  const allHashes = [centerHash, ...Object.values(neighbors)];

  // Step 1: Geo query - fetch event IDs from all 9 geohashes
  const geoQuery = useQuery({
    queryKey: ['/api/events/public/geo', { hashes: allHashes, startDate, endDate }],
    queryFn: async () => {
      console.log('🔍 useEventMap: Geo query starting', {
        center: { lat: center.lat, lng: center.lng },
        centerHash,
        allHashes,
        dateRange: { startDate, endDate }
      });

      // Query all 9 geohashes in parallel
      const promises = allHashes.map(async (geohash) => {
        const params = new URLSearchParams({ geohash });
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const url = `/api/events/public/geo?${params.toString()}`;
        console.log(`🔍 useEventMap: Querying ${url}`);

        const response = await apiRequest('GET', url);
        const data = await response.json();

        console.log(`✅ useEventMap: Response for ${geohash}:`, data.events?.length || 0, 'events');

        return data.events || [];
      });

      const results = await Promise.all(promises);

      // Flatten and deduplicate by event ID
      const eventMap = new Map<string, { id: string }>();
      results.flat().forEach((event: { id?: string }) => {
        if (event.id && !eventMap.has(event.id)) {
          eventMap.set(event.id, event as { id: string });
        }
      });

      const uniqueEvents = Array.from(eventMap.values());
      console.log('🔍 useEventMap: Geo query complete -', uniqueEvents.length, 'unique events found');

      return uniqueEvents;
    },
    staleTime: 5 * 60 * 1000,  // 5 min
    gcTime: 10 * 60 * 1000,
    enabled,
  });

  // Step 2: Batch fetch - get full event data with artist/venue joins
  const eventIds = geoQuery.data?.map((e: { id: string }) => e.id) || [];

  const batchQuery = useQuery({
    queryKey: ['/api/events/batch', { eventIds }],
    queryFn: async () => {
      if (!eventIds.length) {
        console.log('⏭️ useEventMap: Skipping batch fetch - no event IDs');
        return [];
      }

      console.log('📦 useEventMap: Batch fetching', eventIds.length, 'events');

      const response = await apiRequest('POST', '/api/events/batch', { eventIds });
      const data = await response.json();

      console.log('✅ useEventMap: Batch fetch complete -', data.events?.length || 0, 'enriched events');
      console.log('📦 useEventMap: Sample event:', data.events?.[0]);

      return data.events as Event[];
    },
    staleTime: 5 * 60 * 1000,  // 5 min (aggressive caching)
    gcTime: 10 * 60 * 1000,
    enabled: enabled && eventIds.length > 0,
  });

  console.log('🎯 useEventMap: Returning', {
    eventCount: batchQuery.data?.length || 0,
    isLoading: geoQuery.isLoading || batchQuery.isLoading,
    isError: geoQuery.isError || batchQuery.isError,
  });

  return {
    events: batchQuery.data || [],
    isLoading: geoQuery.isLoading || batchQuery.isLoading,
    isError: geoQuery.isError || batchQuery.isError,
    error: geoQuery.error || batchQuery.error,
  };
}
