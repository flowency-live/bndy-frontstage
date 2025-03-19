"use client";

import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode, 
  useCallback 
} from "react";
import { getEvents, getAllEvents } from "@/lib/services/event-service";
import type { Event } from "@/lib/types";
import { CITY_LOCATIONS } from "@/lib/constants";
import { getMoreAccuratePosition } from "@/lib/utils/geo";

const DEFAULT_LOCATION = CITY_LOCATIONS.STOKE_ON_TRENT;
const DEFAULT_RADIUS = 5; // Default to 5 miles radius

interface EventsContextType {
  events: Event[];
  allEvents: Event[];
  loading: boolean;
  error: string | null;
  userLocation: google.maps.LatLngLiteral | null;
  selectedLocation: google.maps.LatLngLiteral & { name?: string };
  setSelectedLocation: (location: google.maps.LatLngLiteral & { name?: string }) => void;
  radius: number;
  setRadius: (radius: number) => void;
  dateRange: string;
  setDateRange: (dateRange: string) => void;
  filteredEvents: Event[];
  refreshEvents: () => Promise<void>;
  availableLocations: (google.maps.LatLngLiteral & { name?: string })[];
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<(google.maps.LatLngLiteral & { name?: string }) | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<google.maps.LatLngLiteral & { name?: string }>(DEFAULT_LOCATION);
  const [radius, setRadius] = useState<number>(DEFAULT_RADIUS);
  const [dateRange, setDateRange] = useState<string>("today");
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [initialLocationSet, setInitialLocationSet] = useState(false);

  // Wrap loadEvents in useCallback so its dependencies are tracked.
  const loadEvents = useCallback(async (
    location: google.maps.LatLngLiteral & { name?: string } = selectedLocation, 
    rad: number = radius
  ) => {
    setLoading(true);
    try {
      const [filteredEventsData, allEventsData] = await Promise.all([
        getEvents(location, rad),
        getAllEvents()
      ]);
      setEvents(filteredEventsData);
      setAllEvents(allEventsData);
      setError(null);
    } catch (err) {
      console.error("Failed to load events:", err);
      setError("Failed to load events. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [selectedLocation, radius]);

  // Get user location - only once when component mounts (and when dependencies change)
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
          if (!initialLocationSet) {
            setSelectedLocation(userLoc);
            setInitialLocationSet(true);
            loadEvents(userLoc, radius);
          }
        } catch (error) {
          console.error("Geolocation error:", error);
          if (!initialLocationSet) {
            setInitialLocationSet(true);
            loadEvents(DEFAULT_LOCATION, radius);
          }
        }
      };
      fetchAccuratePosition();
    } else {
      if (!initialLocationSet) {
        setInitialLocationSet(true);
        loadEvents(DEFAULT_LOCATION, radius);
      }
    }
  }, [initialLocationSet, loadEvents, radius]);

  // Function to manually set selected location and load events
  const handleSetSelectedLocation = (location: google.maps.LatLngLiteral & { name?: string }) => {
    setSelectedLocation(location);
    loadEvents(location, radius);
  };

  // Function to manually set radius and load events
  const handleSetRadius = (newRadius: number) => {
    setRadius(newRadius);
    loadEvents(selectedLocation, newRadius);
  };

  // Function to reload events (can be called externally)
  const refreshEvents = async () => {
    return loadEvents(selectedLocation, radius);
  };

  // Wrap filterEventsByDate in useCallback so it can be used as an effect dependency.
  const filterEventsByDate = useCallback(() => {
    if (!events.length) {
      setFilteredEvents([]);
      return;
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const filtered = events.filter(event => {
      const eventDate = new Date(event.date);
      
      switch (dateRange) {
        case "today":
          return eventDate >= today && eventDate < tomorrow;
        case "tomorrow": {
          const dayAfterTomorrow = new Date(tomorrow);
          dayAfterTomorrow.setDate(tomorrow.getDate() + 1);
          return eventDate >= tomorrow && eventDate < dayAfterTomorrow;
        }
        case "thisWeek": {
          const endOfWeek = new Date(today);
          endOfWeek.setDate(endOfWeek.getDate() + (6 - today.getDay()));
          return eventDate >= today && eventDate <= endOfWeek;
        }
        case "thisWeekend": {
          const saturday = new Date(today);
          saturday.setDate(today.getDate() + (6 - today.getDay() || 7));
          const monday = new Date(saturday);
          monday.setDate(saturday.getDate() + 2);
          return eventDate >= saturday && eventDate < monday;
        }
        case "nextWeek": {
          const startNextWeek = new Date(today);
          startNextWeek.setDate(today.getDate() + (7 - today.getDay()));
          const endNextWeek = new Date(startNextWeek);
          endNextWeek.setDate(startNextWeek.getDate() + 6);
          return eventDate >= startNextWeek && eventDate <= endNextWeek;
        }
        case "nextWeekend": {
          const todayDay = now.getDay();
          let daysUntilNextFriday;
          if (todayDay === 0) {
            daysUntilNextFriday = 5;
          } else if (todayDay === 1) {
            daysUntilNextFriday = 11;
          } else if (todayDay === 2) {
            daysUntilNextFriday = 10;
          } else if (todayDay === 3) {
            daysUntilNextFriday = 9;
          } else if (todayDay === 4) {
            daysUntilNextFriday = 8;
          } else if (todayDay === 5) {
            daysUntilNextFriday = 7;
          } else {
            daysUntilNextFriday = 6;
          }
          const nextFriday = new Date(today);
          nextFriday.setDate(now.getDate() + daysUntilNextFriday);
          
          const nextSunday = new Date(nextFriday);
          nextSunday.setDate(nextFriday.getDate() + 2);
          
          return eventDate >= nextFriday && eventDate < nextSunday;
        }
        case "future":
          return eventDate >= today;
        default:
          return true;
      }
    });
    
    setFilteredEvents(filtered);
  }, [events, dateRange]);

  useEffect(() => {
    filterEventsByDate();
  }, [filterEventsByDate]);

  const availableLocations = [
    ...(userLocation ? [userLocation] : []),
    CITY_LOCATIONS.STOKE_ON_TRENT,
    CITY_LOCATIONS.STOCKPORT
  ];
  
  return (
    <EventsContext.Provider value={{
      events,
      allEvents,
      loading,
      error,
      userLocation,
      selectedLocation,
      setSelectedLocation: handleSetSelectedLocation,
      radius,
      setRadius: handleSetRadius,
      dateRange,
      setDateRange,
      filteredEvents,
      refreshEvents,
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
