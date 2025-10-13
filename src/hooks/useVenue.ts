import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Venue } from "@/lib/types";

/**
 * Hook for fetching a single venue by ID
 * Used by EventInfoOverlay and VenueInfoOverlay when displaying venue details
 */
export function useVenue(venueId: string | undefined) {
  return useQuery({
    queryKey: ['/api/venues', venueId],
    queryFn: async () => {
      if (!venueId) return null;

      const response = await apiRequest('GET', `/api/venues/${venueId}`);
      const venue = await response.json();

      // Transform: DynamoDB format → Frontstage format
      // Handle both location_object and top-level latitude/longitude
      return {
        ...venue,
        location: venue.location_object || {
          lat: venue.latitude,
          lng: venue.longitude
        }
      } as Venue;
    },
    staleTime: 10 * 60 * 1000,  // 10 min (venue data rarely changes)
    gcTime: 30 * 60 * 1000,
    enabled: !!venueId,
  });
}
