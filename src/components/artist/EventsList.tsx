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

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-200">
      {/* Date Badge */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border px-4 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium text-foreground">{formattedDate}</span>
            <span className="text-sm text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">{event.startTime}</span>
            {event.endTime && <span className="text-sm text-muted-foreground">- {event.endTime}</span>}
          </div>
          {distance !== null && (
            <span className="text-xs bg-primary/20 text-primary px-2.5 py-1 rounded-full font-medium">
              {formatDistance(distance)}
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Event Title */}
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2.5 leading-snug">
              {event.name}
            </h3>

            {/* Venue */}
            <div className="flex items-start gap-2 mb-2">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <Link
                href={`/venues/${event.venueId}`}
                className="text-sm text-foreground hover:text-primary hover:underline transition-colors font-medium"
              >
                {event.venueName}
              </Link>
            </div>

            {/* Description */}
            {event.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {event.description}
              </p>
            )}

            {/* Additional Info */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
              {event.price && (
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 9a2 2 0 10-4 0v5a2 2 0 01-2 2h6m-6-4h4m8 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{event.price}</span>
                </div>
              )}
              {event.ticketinformation && (
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{event.ticketinformation}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-row sm:flex-col gap-2 sm:min-w-[130px]">
            {event.ticketUrl && (
              <a
                href={event.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium shadow-sm"
                aria-label={`Get tickets for ${event.name}`}
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                Tickets
              </a>
            )}

            {event.eventUrl && (
              <button
                onClick={() => window.open(event.eventUrl, '_blank', 'noopener,noreferrer')}
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-1.5 border border-border bg-background hover:bg-muted text-foreground rounded-lg text-sm transition-colors"
                aria-label={`View details for ${event.name}`}
              >
                Details
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}