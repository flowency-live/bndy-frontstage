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
    <section className="space-y-6" aria-labelledby="events-heading">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 id="events-heading" className="text-2xl font-bold text-foreground">
          Upcoming Events ({filteredEvents.length}{events.length !== filteredEvents.length ? ` of ${events.length}` : ''})
        </h2>
        
        {userLocation && locationPermission === 'granted' && (
          <LocationFilter 
            distanceFilter={distanceFilter}
            onDistanceChange={setDistanceFilter}
          />
        )}
      </div>
      
      <div 
        className="grid gap-3 sm:gap-4 lg:gap-5"
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
    { value: null, label: "All distances" },
    { value: 5, label: "Within 5 miles" },
    { value: 10, label: "Within 10 miles" },
    { value: 25, label: "Within 25 miles" },
    { value: 50, label: "Within 50 miles" },
  ];

  return (
    <div className="flex items-center gap-2" role="group" aria-labelledby="distance-filter-label">
      <svg 
        className="w-4 h-4 text-muted-foreground" 
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
        className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
      className="relative rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:scale-[1.02] focus-within:outline-2 focus-within:outline-offset-2 event-card-theme"
      tabIndex={0}
      role="article"
      aria-label={`Event: ${event.name} on ${formattedDate}${distance ? `, ${formatDistance(distance)} away` : ''}${isToday ? ', happening today' : ''}`}
      aria-describedby={`event-${event.id}-details`}
    >
      {/* Left accent border */}
      <div className="absolute top-0 left-0 bottom-0 w-1 accent-border" />

      <div className="p-4 pl-5 sm:p-5 sm:pl-6 lg:p-6 lg:pl-7">
        {/* Header: Event Name + Today Badge */}
        <div className="flex items-start justify-between gap-2 sm:gap-3 mb-4 sm:mb-5">
          <h3 
            className="font-semibold text-lg sm:text-xl lg:text-xl leading-tight flex-1 event-title"
            id={`event-${event.id}-title`}
          >
            {event.name}
          </h3>
          {isToday && (
            <span 
              className="inline-flex items-center px-2 py-1 text-xs font-bold rounded-full whitespace-nowrap today-badge flex-shrink-0"
              aria-label="This event is happening today"
              role="status"
            >
              Today
            </span>
          )}
        </div>

        {/* Date and Time with icons */}
        <div 
          className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 mb-4 sm:mb-5"
          id={`event-${event.id}-details`}
        >
          <div className="flex items-center gap-2">
            <svg 
              className="w-4 h-4 event-icon" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              aria-hidden="true"
              role="img"
              aria-label="Calendar icon"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <time 
              className="font-medium text-sm event-text"
              dateTime={event.date}
              aria-label={`Event date: ${formattedDate}`}
            >
              {formattedDate}
            </time>
          </div>
          <div className="flex items-center gap-2">
            <svg 
              className="w-4 h-4 event-icon" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              aria-hidden="true"
              role="img"
              aria-label="Clock icon"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span 
              className="font-medium text-sm event-text"
              aria-label={`Event time: ${event.startTime}${event.endTime ? ` to ${event.endTime}` : ''}`}
            >
              {event.startTime}
              {event.endTime && ` - ${event.endTime}`}
            </span>
          </div>
        </div>

        {/* Venue section with enhanced styling */}
        <section 
          className="relative mb-4 sm:mb-5 p-3 sm:p-4 lg:p-5 rounded-lg border transition-all duration-200 venue-section-enhanced"
          aria-labelledby={`venue-${event.id}-heading`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 p-2 rounded-full venue-icon-container" aria-hidden="true">
                <svg 
                  className="w-4 h-4 event-icon" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  aria-hidden="true"
                  role="img"
                  aria-label="Location pin icon"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h4 
                  id={`venue-${event.id}-heading`}
                  className="sr-only"
                >
                  Venue Information
                </h4>
                <Link
                  href={`/venues/${event.venueId}`}
                  className="inline-block font-semibold text-sm transition-all duration-200 venue-link-enhanced"
                  aria-label={`View venue details for ${event.venueName}`}
                  aria-describedby={distance !== null ? `distance-${event.id}` : undefined}
                >
                  {event.venueName}
                </Link>
              </div>
            </div>
            {distance !== null && (
              <div className="flex-shrink-0 self-start sm:self-center">
                <span 
                  className="inline-flex items-center px-3 py-1 text-xs font-bold rounded-full transition-all duration-200 distance-badge-enhanced"
                  id={`distance-${event.id}`}
                  aria-label={`Distance from your location: ${formatDistance(distance)}`}
                  role="status"
                >
                  {formatDistance(distance)}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Divider */}
        <div className="mb-4 sm:mb-5 event-divider"></div>

        {/* Enhanced Ticket Information Section */}
        <section 
          className="mb-4 sm:mb-5 ticket-info-section"
          aria-labelledby={`ticket-${event.id}-heading`}
        >
          <h4 
            id={`ticket-${event.id}-heading`}
            className="sr-only"
          >
            Ticket Information
          </h4>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 p-2 rounded-full bg-primary/10" aria-hidden="true">
                <svg 
                  className="w-4 h-4 ticket-icon-enhanced" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  aria-hidden="true"
                  role="img"
                  aria-label="Ticket icon"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <div className="flex-1">
                {event.ticketed ? (
                  <span 
                    className="text-sm font-medium ticket-info-text"
                    aria-label={`Ticket information: ${event.ticketinformation || "Ticketed Event"}`}
                  >
                    {event.ticketinformation || "Ticketed Event"}
                  </span>
                ) : (
                  <div 
                    className="free-entry-badge"
                    role="status"
                    aria-label="This event has free entry"
                  >
                    <svg 
                      className="w-3 h-3" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24" 
                      aria-hidden="true"
                      role="img"
                      aria-label="Checkmark icon"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Free Entry
                  </div>
                )}
              </div>
            </div>
            {event.ticketed && event.ticketUrl && (
              <div className="flex-shrink-0 w-full sm:w-auto">
                <a
                  href={event.ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ticket-button w-full sm:w-auto"
                  aria-label={`Get tickets for ${event.name} - opens in new tab`}
                  aria-describedby={`ticket-${event.id}-heading`}
                >
                  <svg 
                    className="w-4 h-4 mr-2" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    aria-hidden="true"
                    role="img"
                    aria-label="Dollar sign icon"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  Get Tickets
                </a>
              </div>
            )}
          </div>
        </section>

        {/* Event URL */}
        {event.eventUrl && (
          <div className="mb-4">
            <a
              href={event.eventUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium hover:underline transition-colors duration-200 event-link"
              aria-label={`View more details for ${event.name} - opens in new tab`}
            >
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                aria-hidden="true"
                role="img"
                aria-label="External link icon"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              More Details
            </a>
          </div>
        )}

        {/* Description */}
        {event.description && (
          <section 
            className="pt-3 sm:pt-4 event-description-section"
            aria-labelledby={`description-${event.id}-heading`}
          >
            <h4 
              id={`description-${event.id}-heading`}
              className="sr-only"
            >
              Event Description
            </h4>
            <p 
              className="text-xs sm:text-sm leading-relaxed line-clamp-2 event-description"
              aria-label={`Event description: ${event.description}`}
            >
              {event.description}
            </p>
          </section>
        )}
      </div>
    </article>
  );
}