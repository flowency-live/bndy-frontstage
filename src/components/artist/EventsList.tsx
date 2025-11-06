"use client";

import { Event } from "@/lib/types";
import Link from "next/link";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { getUserLocation, calculateDistance, formatDistance, Location } from "@/lib/utils/distance";

interface EventsListProps {
  events: Event[];
  artistLocation?: string;
}

export default function EventsList({ events, artistLocation }: EventsListProps) {
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [locationPermission, setLocationPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [distanceFilter, setDistanceFilter] = useState<number | null>(null); // null means "All"

  // Get user location on component mount
  useEffect(() => {
    getUserLocation().then((location) => {
      if (location) {
        setUserLocation(location);
        setLocationPermission('granted');
      } else {
        setLocationPermission('denied');
      }
    });
  }, []);

  // Filter events based on distance
  const filteredEvents = events.filter((event) => {
    if (!distanceFilter || !userLocation || !event.location) {
      return true; // Show all events if no filter or no location data
    }
    
    const distance = calculateDistance(userLocation, event.location);
    return distance <= distanceFilter;
  });

  if (!events || events.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Upcoming Events</h2>
        <div className="text-center py-12 bg-muted/50 rounded-lg">
          <div className="text-4xl mb-4">🎵</div>
          <h3 className="text-lg font-medium text-foreground mb-2">No upcoming events</h3>
          <p className="text-muted-foreground">
            Check back later for new performances and shows.
          </p>
        </div>
      </div>
    );
  }

  // Show empty state if all events are filtered out
  if (filteredEvents.length === 0 && distanceFilter) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-2xl font-bold text-foreground">
            Upcoming Events ({events.length})
          </h2>
          
          {userLocation && locationPermission === 'granted' && (
            <LocationFilter 
              distanceFilter={distanceFilter}
              onDistanceChange={setDistanceFilter}
            />
          )}
        </div>
        
        <div className="text-center py-12 bg-muted/50 rounded-lg">
          <div className="text-4xl mb-4">📍</div>
          <h3 className="text-lg font-medium text-foreground mb-2">No events within {distanceFilter} miles</h3>
          <p className="text-muted-foreground">
            Try expanding your search radius or{" "}
            <button 
              onClick={() => setDistanceFilter(null)}
              className="text-primary hover:underline"
            >
              view all events
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-foreground">
          Upcoming Events ({filteredEvents.length}{events.length !== filteredEvents.length ? ` of ${events.length}` : ''})
        </h2>
        
        {userLocation && locationPermission === 'granted' && (
          <LocationFilter 
            distanceFilter={distanceFilter}
            onDistanceChange={setDistanceFilter}
          />
        )}
      </div>
      
      <div className="grid gap-4">
        {filteredEvents.map((event) => (
          <EventCard 
            key={event.id} 
            event={event} 
            userLocation={userLocation}
          />
        ))}
      </div>
    </div>
  );
}

interface EventCardProps {
  event: Event;
  userLocation?: Location | null;
}

interface LocationFilterProps {
  distanceFilter: number | null;
  onDistanceChange: (distance: number | null) => void;
}

function LocationFilter({ distanceFilter, onDistanceChange }: LocationFilterProps) {
  const distanceOptions = [
    { value: null, label: "All distances" },
    { value: 5, label: "Within 5 miles" },
    { value: 10, label: "Within 10 miles" },
    { value: 25, label: "Within 25 miles" },
    { value: 50, label: "Within 50 miles" },
  ];

  return (
    <div className="flex items-center gap-2">
      <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <select
        value={distanceFilter || ""}
        onChange={(e) => onDistanceChange(e.target.value ? Number(e.target.value) : null)}
        className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      >
        {distanceOptions.map((option) => (
          <option key={option.value || "all"} value={option.value || ""}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function EventCard({ event, userLocation }: EventCardProps) {
  const eventDate = new Date(event.date);
  const formattedDate = format(eventDate, "EEE, MMM d, yyyy");

  // Calculate distance if user location and event location are available
  const distance = userLocation && event.location
    ? calculateDistance(userLocation, event.location)
    : null;

  // Check if event is today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = eventDate.getTime() === today.getTime();

  return (
    <div className="relative bg-background rounded-lg shadow-lg border border-border overflow-hidden hover:shadow-xl transition-shadow duration-200">
      {/* Orange accent bar on left */}
      <div className="absolute top-0 left-0 h-full w-1 bg-primary rounded-tl-lg rounded-bl-lg" />

      <div className="p-4 pl-6">
        {/* Event Name */}
        <h3 className="text-foreground font-semibold text-base leading-tight mb-3">
          {event.name}
        </h3>

        <div className="h-px bg-border mb-3" />

        {/* Event Details */}
        <div className="space-y-3 text-sm">
          {/* Date */}
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-foreground/70 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-foreground">{formattedDate}</span>
            {isToday && (
              <div className="ml-auto inline-block px-2 py-1 bg-yellow-300 text-yellow-800 text-xs font-bold rounded-full animate-pulse">
                Today
              </div>
            )}
          </div>

          {/* Time */}
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-foreground/70 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-foreground">
              {event.startTime}
              {event.endTime && ` - ${event.endTime}`}
            </span>
          </div>

          {/* Venue */}
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-secondary/70 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <Link
              href={`/venues/${event.venueId}`}
              className="text-secondary font-medium hover:shadow-[0_0_8px_rgba(6,182,212,0.8)] transition-shadow"
            >
              {event.venueName}
            </Link>
            {distance !== null && (
              <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-1 rounded-full font-medium">
                {formatDistance(distance)}
              </span>
            )}
          </div>

          {/* Ticket Info */}
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-yellow-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            {event.ticketed ? (
              <>
                <span className="text-foreground">
                  {event.ticketinformation || "Ticketed"}
                </span>
                {event.ticketUrl && (
                  <a
                    href={event.ticketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-primary text-xs hover:underline font-medium"
                  >
                    Buy Tickets
                  </a>
                )}
              </>
            ) : (
              <span className="text-foreground">Free entry</span>
            )}
          </div>

          {/* Event URL */}
          {event.eventUrl && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-foreground/70 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <a
                href={event.eventUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-xs hover:underline"
              >
                Event Details
              </a>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <p className="mt-2 text-foreground/80 text-sm leading-snug">
              {event.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}