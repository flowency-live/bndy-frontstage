"use client";

import { Event } from "@/lib/types";
import Link from "next/link";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { getUserLocation, calculateDistance, formatDistance, Location } from "@/lib/utils/distance";
import { ChevronDown, ChevronUp } from "lucide-react";

interface EventsListProps {
  events: Event[];
  artistLocation?: string;
}

export default function EventsList({ events, artistLocation }: EventsListProps) {
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [locationPermission, setLocationPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [distanceFilter, setDistanceFilter] = useState<number | null>(null); // null means "All"
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

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
      <section className="space-y-4" aria-labelledby="events-heading">
        <h2 id="events-heading" className="text-2xl font-bold text-foreground">Upcoming Events</h2>
        <div 
          className="text-center py-12 bg-muted/50 rounded-lg"
          role="status"
          aria-live="polite"
        >
          <div className="text-4xl mb-4" aria-hidden="true">🎵</div>
          <h3 className="text-lg font-medium text-foreground mb-2">No upcoming events</h3>
          <p className="text-muted-foreground">
            Check back later for new performances and shows.
          </p>
        </div>
      </section>
    );
  }

  // Show empty state if all events are filtered out
  if (filteredEvents.length === 0 && distanceFilter) {
    return (
      <section className="space-y-4" aria-labelledby="events-heading">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 id="events-heading" className="text-2xl font-bold text-foreground">
            Upcoming Events ({events.length})
          </h2>
          
          {userLocation && locationPermission === 'granted' && (
            <LocationFilter 
              distanceFilter={distanceFilter}
              onDistanceChange={setDistanceFilter}
            />
          )}
        </div>
        
        <div 
          className="text-center py-12 bg-muted/50 rounded-lg"
          role="status"
          aria-live="polite"
        >
          <div className="text-4xl mb-4" aria-hidden="true">📍</div>
          <h3 className="text-lg font-medium text-foreground mb-2">No events within {distanceFilter} miles</h3>
          <p className="text-muted-foreground">
            Try expanding your search radius or{" "}
            <button 
              onClick={() => setDistanceFilter(null)}
              className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              aria-label="Clear distance filter to view all events"
            >
              view all events
            </button>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-2" aria-labelledby="events-heading">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-2xl font-bold text-foreground hover:text-primary transition-colors text-left"
          aria-expanded={isExpanded}
          aria-controls="events-list"
        >
          <span id="events-heading">
            Upcoming Events ({filteredEvents.length}{events.length !== filteredEvents.length ? ` of ${events.length}` : ''})
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 sm:w-6 sm:h-6 flex-shrink-0" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-4 h-4 sm:w-6 sm:h-6 flex-shrink-0" aria-hidden="true" />
          )}
        </button>

        {userLocation && locationPermission === 'granted' && isExpanded && (
          <LocationFilter
            distanceFilter={distanceFilter}
            onDistanceChange={setDistanceFilter}
          />
        )}
      </div>

      {isExpanded && (
        <div
          id="events-list"
          className="grid gap-2 sm:gap-3"
          role="list"
          aria-label={`${filteredEvents.length} upcoming events`}
        >
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              userLocation={userLocation}
            />
          ))}
        </div>
      )}
    </section>
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
    { value: null, label: "All" },
    { value: 5, label: "5mi" },
    { value: 10, label: "10mi" },
    { value: 25, label: "25mi" },
    { value: 50, label: "50mi" },
  ];

  return (
    <div className="flex items-center gap-1.5" role="group" aria-labelledby="distance-filter-label">
      <svg
        className="w-3.5 h-3.5 text-orange-500 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
        role="img"
        aria-label="Location filter icon"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <label
        id="distance-filter-label"
        htmlFor="distance-filter-select"
        className="sr-only"
      >
        Filter events by distance from your location
      </label>
      <select
        id="distance-filter-select"
        value={distanceFilter || ""}
        onChange={(e) => onDistanceChange(e.target.value ? Number(e.target.value) : null)}
        className="px-2 py-1 bg-orange-500 text-white rounded-full text-xs font-bold border-none focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 cursor-pointer"
        style={{
          backgroundColor: 'rgb(249 115 22)',
          color: 'white'
        }}
        aria-label="Filter events by distance from your location"
        aria-describedby="distance-filter-description"
      >
        {distanceOptions.map((option) => (
          <option key={option.value || "all"} value={option.value || ""}>
            {option.label}
          </option>
        ))}
      </select>
      <span
        id="distance-filter-description"
        className="sr-only"
      >
        Select a distance range to filter events based on your current location
      </span>
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
    <article
      className="relative rounded-lg overflow-hidden border-2 transition-all duration-200 hover:shadow-lg"
      style={{
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--card-border)',
        color: 'var(--foreground)'
      }}
      tabIndex={0}
      role="article"
      aria-label={`Event: ${event.name} on ${formattedDate}${distance ? `, ${distance.toFixed(1)} miles away` : ''}${isToday ? ', happening today' : ''}`}
      aria-describedby={`event-${event.id}-details`}
    >
      {/* Gradient top stripe: orange -> cyan -> orange */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-cyan-500 to-orange-500" />

      <div className="pt-3 px-3 pb-3">
        {/* Header: Event Name + Today Badge */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3
            className="font-bold text-base leading-tight flex-1 text-foreground"
            id={`event-${event.id}-title`}
          >
            {event.name}
          </h3>
          {isToday && (
            <span
              className="inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-full whitespace-nowrap bg-orange-500 text-white flex-shrink-0"
              aria-label="This event is happening today"
              role="status"
            >
              Today
            </span>
          )}
        </div>

        {/* Date and Time on same row */}
        <div
          className="flex items-center gap-4 mb-2"
          id={`event-${event.id}-details`}
        >
          <div className="flex items-center gap-1.5">
            <svg
              className="w-3.5 h-3.5 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <time
              className="text-xs text-foreground"
              dateTime={event.date}
              aria-label={`Event date: ${formattedDate}`}
            >
              {formattedDate}
            </time>
          </div>
          <div className="flex items-center gap-1.5">
            <svg
              className="w-3.5 h-3.5 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span
              className="text-xs text-foreground"
              aria-label={`Event time: ${event.startTime}`}
            >
              {event.startTime}
            </span>
          </div>
        </div>

        {/* Venue section - compact with distance on same row */}
        <section
          className="relative mb-2 p-2 rounded-md bg-secondary/10 dark:bg-secondary/20 border-l-4 border-secondary"
          aria-labelledby={`venue-${event.id}-heading`}
        >
          <h4
            id={`venue-${event.id}-heading`}
            className="sr-only"
          >
            Venue Information
          </h4>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <svg
                className="w-3.5 h-3.5 text-secondary flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <Link
                href={`/venues/${event.venueId}`}
                className="text-xs font-bold underline decoration-secondary/50 hover:decoration-secondary text-secondary hover:text-secondary/80 truncate transition-all"
                aria-label={`View venue details for ${event.venueName}`}
              >
                {event.venueName}
              </Link>
            </div>
            {distance !== null && (
              <span
                className="inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-full bg-orange-500 text-white whitespace-nowrap flex-shrink-0"
                id={`distance-${event.id}`}
                aria-label={`Distance from your location: ${distance.toFixed(1)} miles`}
                role="status"
              >
                {distance.toFixed(1)} miles
              </span>
            )}
          </div>
        </section>

        {/* Divider */}
        <div className="mb-2 border-t" style={{ borderColor: 'var(--border)' }}></div>

        {/* Ticket Information Section - compact */}
        <section
          className="flex items-center justify-between gap-2"
          aria-labelledby={`ticket-${event.id}-heading`}
        >
          <h4
            id={`ticket-${event.id}-heading`}
            className="sr-only"
          >
            Ticket Information
          </h4>
          <div className="flex items-center gap-2">
            <svg
              className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            {event.ticketed ? (
              <span
                className="text-xs text-foreground"
                aria-label={`Ticket information: ${event.ticketinformation || "Ticketed Event"}`}
              >
                {event.ticketinformation || "Ticketed"}
              </span>
            ) : (
              <div
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500 text-white text-xs font-bold"
                role="status"
                aria-label="This event has free entry"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Free Entry
              </div>
            )}
          </div>
        </section>
      </div>
    </article>
  );
}