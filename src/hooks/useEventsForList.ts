import { useMemo } from "react";
import { useAllPublicEvents } from "./useAllPublicEvents";
import type { Event } from "@/lib/types";

interface UseEventsForListOptions {
  startDate?: string;
  endDate?: string;
  location?: { lat: number; lng: number } | null;
  radius?: number;  // in miles
  enabled?: boolean;
}

// Event with calculated distance from user
export interface EventWithDistance extends Event {
  distanceMiles: number | null;
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
 * Format distance for display
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${distance.toFixed(1)} mi`;
  }
  return `${Math.round(distance)} mi`;
}

/**
 * Get distance class for styling
 */
export function getDistanceClass(distance: number | null): string {
  if (distance === null) return "";
  if (distance < 5) return "very-near";
  if (distance < 15) return "near";
  return "";
}

/**
 * Hook for fetching events in ListView with location+radius filtering
 *
 * Reuses useAllPublicEvents (same as MapView) then applies client-side
 * radius filtering. At 250 events/weekend scale, this is < 1ms.
 *
 * Returns events with calculated distance from user location.
 */
export function useEventsForList({
  startDate,
  endDate,
  location,
  radius = 50,
  enabled = true
}: UseEventsForListOptions) {
  // Fetch ALL events using existing hook (same as MapView)
  const { data: allEvents = [], isLoading, isPending, isError, error } = useAllPublicEvents({
    startDate,
    endDate,
    enabled
  });

  // Client-side radius filtering with distance calculation
  const eventsWithDistance = useMemo<EventWithDistance[]>(() => {
    if (!allEvents.length) return [];

    return allEvents
      .map(event => {
        const distanceMiles = location
          ? calculateDistance(
              location.lat,
              location.lng,
              event.location.lat,
              event.location.lng
            )
          : null;
        return { ...event, distanceMiles };
      })
      .filter(event => {
        // If no location, include all events
        if (!location || event.distanceMiles === null) return true;
        // Otherwise filter by radius
        return event.distanceMiles <= radius;
      });
  }, [allEvents, location, radius]);

  return {
    events: eventsWithDistance,
    isLoading,
    isPending,
    isError,
    error
  };
}
