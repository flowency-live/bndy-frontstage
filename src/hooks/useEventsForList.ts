import { useMemo } from "react";
import { useAllPublicEvents } from "./useAllPublicEvents";

interface UseEventsForListOptions {
  startDate?: string;
  endDate?: string;
  location?: { lat: number; lng: number } | null;
  radius?: number;  // in miles
  enabled?: boolean;
}

// Haversine distance calculation (client-side)
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Hook for fetching events in ListView with location+radius filtering
 *
 * Reuses useAllPublicEvents (same as MapView) then applies client-side
 * radius filtering. At 250 events/weekend scale, this is < 1ms.
 */
export function useEventsForList({
  startDate,
  endDate,
  location,
  radius = 50,
  enabled = true
}: UseEventsForListOptions) {
  // Fetch ALL events using existing hook (same as MapView)
  const { data: allEvents = [], isLoading, isError, error } = useAllPublicEvents({
    startDate,
    endDate,
    enabled
  });

  console.log('=== useEventsForList DEBUG ===');
  console.log('Total events from useAllPublicEvents:', allEvents.length);
  if (allEvents.length > 0) {
    console.log('First event from useEventsForList:', allEvents[0]);
    console.log('- artistName:', allEvents[0].artistName);
    console.log('- venueName:', allEvents[0].venueName);
    console.log('- venueCity:', allEvents[0].venueCity);
    console.log('- startTime:', allEvents[0].startTime);
  }

  // Client-side radius filtering (instant from TanStack Query cache)
  const filteredEvents = useMemo(() => {
    if (!location || !allEvents.length) return allEvents;

    return allEvents.filter(event => {
      const distance = calculateDistance(
        location.lat,
        location.lng,
        event.location.lat,
        event.location.lng
      );
      return distance <= radius;
    });
  }, [allEvents, location, radius]);

  return {
    events: filteredEvents,
    isLoading,
    isError,
    error
  };
}
