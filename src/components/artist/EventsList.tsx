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
  hideDistanceFilter?: boolean; // Hide distance filter for venue pages
  linkToArtist?: boolean; // Link to artist instead of venue (for venue pages)
}

// Group events by month
interface MonthGroup {
  monthKey: string; // YYYY-MM format
  monthLabel: string; // "November 2025"
  events: Event[];
}

export default function EventsList({ events, artistLocation, hideDistanceFilter = false, linkToArtist = false }: EventsListProps) {
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [locationPermission, setLocationPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [distanceFilter, setDistanceFilter] = useState<number | null>(null); // null means "All"
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

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

  // Group events by month
  const monthGroups: MonthGroup[] = [];
  const groupMap = new Map<string, Event[]>();

  filteredEvents.forEach((event) => {
    const eventDate = new Date(event.date);
    const monthKey = format(eventDate, 'yyyy-MM');

    if (!groupMap.has(monthKey)) {
      groupMap.set(monthKey, []);
    }
    groupMap.get(monthKey)!.push(event);
  });

  // Convert map to sorted array
  Array.from(groupMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([monthKey, monthEvents]) => {
      const firstEvent = monthEvents[0];
      const monthLabel = format(new Date(firstEvent.date), 'MMMM yyyy');
      monthGroups.push({ monthKey, monthLabel, events: monthEvents });
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

          {!hideDistanceFilter && userLocation && locationPermission === 'granted' && (
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

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(monthKey)) {
        newSet.delete(monthKey);
      } else {
        newSet.add(monthKey);
      }
      return newSet;
    });
  };

  return (
    <section className="space-y-4" aria-labelledby="events-heading">
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-foreground hover:text-primary transition-colors text-left antialiased"
          aria-expanded={isExpanded}
          aria-controls="events-list"
        >
          <span id="events-heading" className="tracking-tight">
            Upcoming Events ({filteredEvents.length}{events.length !== filteredEvents.length ? ` of ${events.length}` : ''})
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 sm:w-6 sm:h-6 flex-shrink-0" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-4 h-4 sm:w-6 sm:h-6 flex-shrink-0" aria-hidden="true" />
          )}
        </button>

        {!hideDistanceFilter && userLocation && locationPermission === 'granted' && isExpanded && (
          <LocationFilter
            distanceFilter={distanceFilter}
            onDistanceChange={setDistanceFilter}
          />
        )}
      </div>

      {isExpanded && (
        <div
          id="events-list"
          className="space-y-3"
          role="list"
          aria-label={`${filteredEvents.length} upcoming events grouped by month`}
        >
          {monthGroups.map((group, groupIndex) => {
            const isFirstGroup = groupIndex === 0;
            const isMonthExpanded = expandedMonths.has(group.monthKey);
            const firstEventInGroup = group.events[0];

            return (
              <div key={group.monthKey} className="space-y-2">
                {/* Month Header - always show first event of first month, collapsed for others */}
                {isFirstGroup ? (
                  // First month: show next event as full card, then collapsed month header if more events
                  <>
                    <EventCard
                      event={firstEventInGroup}
                      userLocation={userLocation}
                      linkToArtist={linkToArtist}
                      isNextEvent={true}
                    />
                    {group.events.length > 1 && (
                      <>
                        <button
                          onClick={() => toggleMonth(group.monthKey)}
                          className="w-full flex items-center justify-between px-4 py-2 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
                          aria-expanded={isMonthExpanded}
                          aria-controls={`month-${group.monthKey}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">
                              {group.monthLabel}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              +{group.events.length - 1} more
                            </span>
                          </div>
                          {isMonthExpanded ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                          )}
                        </button>
                        {isMonthExpanded && (
                          <div id={`month-${group.monthKey}`} className="space-y-2 pl-2">
                            {group.events.slice(1).map((event) => (
                              <EventCard
                                key={event.id}
                                event={event}
                                userLocation={userLocation}
                                linkToArtist={linkToArtist}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  // Other months: collapsed by default
                  <>
                    <button
                      onClick={() => toggleMonth(group.monthKey)}
                      className="w-full flex items-center justify-between px-4 py-2 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
                      aria-expanded={isMonthExpanded}
                      aria-controls={`month-${group.monthKey}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">
                          {group.monthLabel}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {group.events.length} {group.events.length === 1 ? 'event' : 'events'}
                        </span>
                      </div>
                      {isMonthExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                      )}
                    </button>
                    {isMonthExpanded && (
                      <div id={`month-${group.monthKey}`} className="space-y-2 pl-2">
                        {group.events.map((event) => (
                          <EventCard
                            key={event.id}
                            event={event}
                            userLocation={userLocation}
                            linkToArtist={linkToArtist}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

interface EventCardProps {
  event: Event;
  userLocation?: Location | null;
  linkToArtist?: boolean;
  isNextEvent?: boolean;
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

/**
 * EventCard - Ticket-style design (refactored)
 *
 * Features:
 * - Clean, minimal design (NO gradients, NO colored backgrounds)
 * - Condensed spacing (~140px height target)
 * - 3px orange left border for "next event" indicator (NO badge)
 * - Distance badge top-right (when distance available)
 * - Free Entry as cyan text (NO badge background)
 * - Theme-aware card background
 */
function EventCard({ event, userLocation, linkToArtist = false, isNextEvent = false }: EventCardProps) {
  const eventDate = new Date(event.date);
  const formattedDate = format(eventDate, "EEE, MMM d, yyyy");

  // Calculate distance if user location and event location are available
  const distance = userLocation && event.location
    ? calculateDistance(userLocation, event.location)
    : null;

  return (
    <article
      className={`relative rounded-xl border bg-card-bg transition-all duration-200 hover:shadow-md
                  ${isNextEvent ? 'border-l-[3px] border-l-orange-500' : 'border-border'}`}
      tabIndex={0}
      role="article"
      aria-label={`Event: ${event.name} on ${formattedDate}${distance ? `, ${formatDistance(distance)} away` : ''}`}
      data-testid="event-card"
    >
      <div className="p-3 space-y-2">
        {/* Row 1: Venue + Distance Badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {linkToArtist && event.artistIds && event.artistIds.length > 0 ? (
              <Link
                href={`/artists/${event.artistIds[0]}`}
                className="text-base font-semibold text-foreground hover:text-primary transition-colors truncate block"
                aria-label={`View artist details for ${event.artistName || 'artist'}`}
              >
                {event.artistName || 'Unknown Artist'}
              </Link>
            ) : (
              <Link
                href={`/venues/${event.venueId}`}
                className="text-base font-semibold text-foreground hover:text-primary transition-colors truncate block"
                aria-label={`View venue details for ${event.venueName}`}
              >
                {event.venueName}
              </Link>
            )}
            <p className="text-xs text-muted-foreground truncate">
              {event.postcode || 'Location TBA'}
            </p>
          </div>
          {distance !== null && (
            <span
              className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 whitespace-nowrap flex-shrink-0"
              aria-label={`Distance from your location: ${formatDistance(distance)}`}
            >
              {formatDistance(distance)}
            </span>
          )}
        </div>

        {/* Row 2: Date • Time */}
        <div className="border-t border-border pt-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <time dateTime={event.date}>{formattedDate}</time>
            <span className="text-muted-foreground">•</span>
            <span>{event.startTime}</span>
          </div>
        </div>

        {/* Row 3: Free Entry OR Ticket Info */}
        {!event.ticketed && (
          <div className="border-t border-border pt-2">
            <span className="text-sm font-medium" style={{ color: '#00D9FF' }}>
              Free Entry
            </span>
          </div>
        )}
        {event.ticketed && event.ticketinformation && (
          <div className="border-t border-border pt-2">
            <span className="text-xs text-muted-foreground">
              {event.ticketinformation}
            </span>
          </div>
        )}
      </div>
    </article>
  );
}