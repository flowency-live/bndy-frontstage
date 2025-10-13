import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Venue } from "@/lib/types";

export function useVenues() {
  return useQuery({
    queryKey: ['/api/venues'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/venues');
      const venues = await response.json();

      // Transform: DynamoDB format → Frontstage format
      // Handle both location_object and top-level latitude/longitude
      return venues.map((venue: { location_object?: { lat: number; lng: number }; latitude?: number; longitude?: number }) => ({
        ...venue,
        location: venue.location_object || {
          lat: venue.latitude,
          lng: venue.longitude
        }
      })) as Venue[];
    },
    staleTime: 10 * 60 * 1000,  // 10 min (venues rarely change)
    gcTime: 30 * 60 * 1000,
  });
}
