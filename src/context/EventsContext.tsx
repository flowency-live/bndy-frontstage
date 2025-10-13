"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from "react";
import { CITY_LOCATIONS } from "@/lib/constants";
import { getMoreAccuratePosition } from "@/lib/utils/geo";

const DEFAULT_LOCATION = CITY_LOCATIONS.STOKE_ON_TRENT;
const DEFAULT_RADIUS = 5; // miles

/**
 * EventsContext - UI state management only
 *
 * Responsibilities:
 * - Viewport state (user location, map center)
 * - Filter state (date range, search, genre)
 * - View mode (map/list, events/venues)
 *
 * Data fetching handled by:
 * - useEventMap (map viewport events)
 * - useVenues (all venues)
 * - useArtist/useVenue (overlays)
 */
interface EventsContextType {
  userLocation: google.maps.LatLngLiteral | null;
  selectedLocation: google.maps.LatLngLiteral & { name?: string };
  setSelectedLocation: (location: google.maps.LatLngLiteral & { name?: string }) => void;
  radius: number;
  setRadius: (radius: number) => void;
  dateRange: string;
  setDateRange: (dateRange: string) => void;
  availableLocations: (google.maps.LatLngLiteral & { name?: string })[];
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export function EventsProvider({ children }: { children: ReactNode }) {
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<google.maps.LatLngLiteral & { name?: string }>(DEFAULT_LOCATION);
  const [radius, setRadius] = useState<number>(DEFAULT_RADIUS);
  const [dateRange, setDateRange] = useState<string>("today");

  // Get user location on mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      const fetchAccuratePosition = async () => {
        try {
          const position = await getMoreAccuratePosition();
          const userLoc = {
            lat: (position as GeolocationPosition).coords.latitude,
            lng: (position as GeolocationPosition).coords.longitude,
            name: "Current Location"
          };
          setUserLocation(userLoc);
          setSelectedLocation(userLoc);
        } catch (error) {
          console.error("Geolocation error:", error);
          // Keep DEFAULT_LOCATION as fallback
        }
      };
      fetchAccuratePosition();
    }
  }, []);

  const availableLocations = [
    ...(userLocation ? [userLocation] : []),
    CITY_LOCATIONS.STOKE_ON_TRENT,
    CITY_LOCATIONS.STOCKPORT
  ];

  return (
    <EventsContext.Provider value={{
      userLocation,
      selectedLocation,
      setSelectedLocation,
      radius,
      setRadius,
      dateRange,
      setDateRange,
      availableLocations
    }}>
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error("useEvents must be used within an EventsProvider");
  }
  return context;
}
