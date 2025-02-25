// src/context/EventsContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getEvents, getAllEvents } from "@/lib/services/event-service";
import type { Event } from "@/lib/types";

// Stoke-on-Trent coordinates
const STOKE_ON_TRENT_LOCATION = { lat: 53.0027, lng: -2.1794 };

interface EventsContextType {
  events: Event[];
  allEvents: Event[];
  loading: boolean;
  error: string | null;
  userLocation: google.maps.LatLngLiteral | null;
  radius: number;
  setRadius: (radius: number) => void;
  dateRange: string;
  setDateRange: (dateRange: string) => void;
  filteredEvents: Event[];
  refreshEvents: () => Promise<void>;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [radius, setRadius] = useState<number>(25); // Default 25 miles radius
  const [dateRange, setDateRange] = useState<string>("today");
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  
  // Get user location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          // Default to Stoke-on-Trent if location permission denied
          setUserLocation(STOKE_ON_TRENT_LOCATION);
        }
      );
    } else {
      // Fallback for browsers without geolocation
      setUserLocation(STOKE_ON_TRENT_LOCATION);
    }
  }, []);
  
  // Load events based on filters
  useEffect(() => {
    if (!userLocation) return;
    
    loadEvents();
  }, [userLocation, radius]);
  
  // Filter events when events list or date range changes
  useEffect(() => {
    filterEventsByDate();
  }, [events, dateRange]);
  
  // Function to load events
  const loadEvents = async () => {
    if (!userLocation) return;
    
    setLoading(true);
    try {
      const [filteredEventsData, allEventsData] = await Promise.all([
        // Get events filtered by location for list view
        getEvents(userLocation, radius),
        // Get all events for map view
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
    return loadEvents();
  };
  
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
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
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
          const today = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
          let daysUntilNextFriday;
        
          if (today === 0) { // Today is Sunday
            daysUntilNextFriday = 5; // Next Friday is 5 days away
          } else if (today === 1) { // Monday
            daysUntilNextFriday = 11;
          } else if (today === 2) { // Tuesday
            daysUntilNextFriday = 10;
          } else if (today === 3) { // Wednesday
            daysUntilNextFriday = 9;
          } else if (today === 4) { // Thursday
            daysUntilNextFriday = 8;
          } else if (today === 5) { // Friday
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
  
  return (
    <EventsContext.Provider value={{
      events,
      allEvents,
      loading,
      error,
      userLocation,
      radius,
      setRadius,
      dateRange,
      setDateRange,
      filteredEvents,
      refreshEvents
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