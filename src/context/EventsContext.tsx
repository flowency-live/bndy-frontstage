// src/context/EventsContext.tsx - Fixed initial load issue
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getEvents, getAllEvents } from "@/lib/services/event-service";
import type { Event } from "@/lib/types";
import { CITY_LOCATIONS } from "@/lib/constants";

// Use default from constants
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
  
  // Get user location - only once when component mounts
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLoc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            name: "Current Location"
          };
          setUserLocation(userLoc);
          
          // Only set selected location if we haven't done it yet
          if (!initialLocationSet) {
            setSelectedLocation(userLoc);
            setInitialLocationSet(true);
            // Load events with the user's location
            loadEvents(userLoc, radius);
          }
        },
        (error) => {
          // Default to Stoke-on-Trent if location permission denied
          // If we haven't set location yet, use the default
          if (!initialLocationSet) {
            setInitialLocationSet(true);
            // Keep using the default location that was set in useState
            loadEvents(DEFAULT_LOCATION, radius);
          }
        }
      );
    } else {
      // Fallback for browsers without geolocation
      if (!initialLocationSet) {
        setInitialLocationSet(true);
        loadEvents(DEFAULT_LOCATION, radius);
      }
    }
  }, []);
  
  // Function to manually set selected location and load events
  const handleSetSelectedLocation = (location: google.maps.LatLngLiteral & { name?: string }) => {
    setSelectedLocation(location);
    loadEvents(location, radius);
  };
  
  // Function to manually set radius and load events
  const handleSetRadius = (newRadius: number) => {
    setRadius(newRadius);
    // Make sure we're actually loading events with the new radius
    loadEvents(selectedLocation, newRadius);
  };
  
  // Function to load events
  const loadEvents = async (
    location: google.maps.LatLngLiteral & { name?: string } = selectedLocation, 
    rad: number = radius
  ) => {
  
    setLoading(true);
    try {
      const [filteredEventsData, allEventsData] = await Promise.all([
        // Get events filtered by location for list view
        getEvents(location, rad),
        // Get all events for map view (no radius filtering)
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
  };
  
  // Function to reload events (can be called externally)
  const refreshEvents = async () => {
    return loadEvents(selectedLocation, radius);
  };
  
  // Filter events when events list or date range changes
  useEffect(() => {
    filterEventsByDate();
  }, [events, dateRange]);
  
  // Filter events by date range
  const filterEventsByDate = () => {
    if (!events.length) {
      setFilteredEvents([]);
      return;
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const filtered = events.filter(event => {
      // Convert string date to Date object
      const eventDate = new Date(event.date);
      
      switch (dateRange) {
        case "today":
          return eventDate >= today && eventDate < tomorrow;
        case "tomorrow": {
          const dayAfterTomorrow = new Date(tomorrow);
          dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
          return eventDate >= tomorrow && eventDate < dayAfterTomorrow;
        }
        case "thisWeek": {
          const endOfWeek = new Date(today);
          endOfWeek.setDate(endOfWeek.getDate() + (6 - today.getDay())); // Sunday is 0
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
          const todayDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
          let daysUntilNextFriday;
        
          if (todayDay === 0) { // Today is Sunday
            daysUntilNextFriday = 5; // Next Friday is 5 days away
          } else if (todayDay === 1) { // Monday
            daysUntilNextFriday = 11;
          } else if (todayDay === 2) { // Tuesday
            daysUntilNextFriday = 10;
          } else if (todayDay === 3) { // Wednesday
            daysUntilNextFriday = 9;
          } else if (todayDay === 4) { // Thursday
            daysUntilNextFriday = 8;
          } else if (todayDay === 5) { // Friday
            daysUntilNextFriday = 7;
          } else { // Saturday
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
          return true; // "all" case
      }
    });
    
    setFilteredEvents(filtered);
  };
  
  // Available locations for selection (including user's location if available)
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