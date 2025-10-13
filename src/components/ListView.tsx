// src/components/ListView.tsx - Updated to resolve lint errors
"use client";

import { useState, useEffect, useMemo } from "react";
import { useEvents } from "@/context/EventsContext";
import { Search, X, MapPin } from "lucide-react";
import { EventCard } from "./listview/EventCard";
import { EventRow } from "./listview/EventRow";
import LocationSelector from "./filters/LocationSelector";
import EventInfoOverlay from "./overlays/EventInfoOverlay";
import { EventSectionHeader } from "./listview/EventSectionHeader";
import type { Event } from "@/lib/types";
import { AddEventButton } from "./events/AddEventButton";

export default function ListView() {
  // TODO: Implement ListView with location+radius based queries
  // ListView needs a different data fetching strategy than MapView
  // MapView uses viewport-based geohash queries
  // ListView needs location+radius queries OR a new /api/events/nearby endpoint

  const {
    radius,
    setRadius,
    selectedLocation
  } = useEvents();

  // Temporary stub - events loading not yet implemented for ListView
  const events: Event[] = [];
  const loading = false;
  const error = null;
  const refreshEvents = async () => {};

  const [expandedSections, setExpandedSections] = useState<string[]>(['today']);
  const [groupedEvents, setGroupedEvents] = useState<Record<string, Event[]>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [tempRadius, setTempRadius] = useState(radius);
  const [searchResults, setSearchResults] = useState<{
    type: 'artist' | 'venue' | null;
    id: string | null;
    name: string | null;
  }>({
    type: null,
    id: null,
    name: null
  });
  // Add state for the selected event and overlay visibility
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventOverlay, setShowEventOverlay] = useState(false);

  // Sync tempRadius with radius when radius changes from context
  useEffect(() => {
    setTempRadius(radius);
  }, [radius]);

  // Apply radius function
  const applyRadius = () => {
    if (tempRadius !== radius) {
      setRadius(tempRadius);
    }
  };

  // Handle search - using direct text matching
  useEffect(() => {
    if (!searchTerm || searchTerm.length < 2) {
      setSearchResults({ type: null, id: null, name: null });
      return;
    }

    const term = searchTerm.toLowerCase();

    // Find ALL events matching the artist name
    const artistMatches = events.filter(event =>
      event.name.toLowerCase().includes(term)
    );

    // Find ALL events matching the venue name
    const venueMatches = events.filter(event =>
      event.venueName.toLowerCase().includes(term)
    );

    // Prioritize artists over venues when both match
    if (artistMatches.length > 0) {
      setSearchResults({
        type: 'artist',
        id: null,
        name: term
      });
    } else if (venueMatches.length > 0) {
      setSearchResults({
        type: 'venue',
        id: null,
        name: term
      });
    } else {
      setSearchResults({ type: null, id: null, name: null });
    }
  }, [searchTerm, events]);

  // Filter events based on search text
  const filteredEvents = useMemo(() => {
    // If there's a search term but no results were found, return empty array
    if (searchTerm && searchTerm.length >= 2 && !searchResults.type) {
      return [];
    }

    if (!searchResults.type || !searchResults.name) {
      return events;
    }

    return events.filter(event => {
      if (searchResults.type === 'artist') {
        return searchResults.name && event.name.toLowerCase().includes(searchResults.name.toLowerCase());
      } else if (searchResults.type === 'venue') {
        return searchResults.name && event.venueName.toLowerCase().includes(searchResults.name.toLowerCase());
      }
      return false;
    });
  }, [events, searchResults, searchTerm]);

  // Group events by date category
  useEffect(() => {
    if (!filteredEvents.length) {
      setGroupedEvents({
        'today': [],
        'tomorrow': [],
        'thisWeek': [],
        'nextWeek': [],
        'thisMonth': [],
        'future': []
      });
      return;
    }

    const grouped: Record<string, Event[]> = {
      'today': [],
      'tomorrow': [],
      'thisWeek': [],
      'nextWeek': [],
      'thisMonth': [],
      'future': []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const nextDay = new Date(tomorrow);
    nextDay.setDate(tomorrow.getDate() + 1);

    const endOfWeek = new Date(today);
    const daysUntilEndOfWeek = 6 - today.getDay();
    endOfWeek.setDate(today.getDate() + daysUntilEndOfWeek);

    const startOfNextWeek = new Date(endOfWeek);
    startOfNextWeek.setDate(endOfWeek.getDate() + 1);
    const endOfNextWeek = new Date(startOfNextWeek);
    endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);

    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    filteredEvents.forEach(event => {
      const eventDate = new Date(event.date);

      if (eventDate < today) {
        // Skip past events
        return;
      } else if (eventDate.getTime() === today.getTime()) {
        grouped.today.push(event);
      } else if (eventDate.getTime() === tomorrow.getTime()) {
        grouped.tomorrow.push(event);
      } else if (eventDate > tomorrow && eventDate <= endOfWeek) {
        grouped.thisWeek.push(event);
      } else if (eventDate >= startOfNextWeek && eventDate <= endOfNextWeek) {
        grouped.nextWeek.push(event);
      } else if (eventDate <= endOfMonth) {
        grouped.thisMonth.push(event);
      } else {
        grouped.future.push(event);
      }
    });

    setGroupedEvents(grouped);
  }, [filteredEvents]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  // Function to handle event click
  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setShowEventOverlay(true);
  };

  // Increase radius helper function
  const increaseRadius = () => {
    const newRadius = Math.min(radius + 5, 50);
    setRadius(newRadius);
  };

  // Format section titles with dates
  const formatSectionTitle = (section: string, count: number) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const formatOrdinal = (day: number) => {
      if (day > 3 && day < 21) return `${day}th`;
      switch (day % 10) {
        case 1: return `${day}st`;
        case 2: return `${day}nd`;
        case 3: return `${day}rd`;
        default: return `${day}th`;
      }
    };

    const formatDateString = (date: Date) => {
      return `${dayNames[date.getDay()]} ${formatOrdinal(date.getDate())} ${monthNames[date.getMonth()]}`;
    };

    const titles: Record<string, string> = {
      'today': `Today - ${formatDateString(today)}`,
      'tomorrow': `Tomorrow - ${formatDateString(tomorrow)}`,
      'thisWeek': 'This Week',
      'nextWeek': 'Next Week',
      'thisMonth': 'This Month',
      'future': 'Future Events'
    };

    return `${titles[section]} (${count})`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="animate-pulse">Loading events...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="text-red-500">{error}</div>
        <button
          className="mt-4 px-4 py-2 bg-[var(--primary)] text-white rounded"
          onClick={() => refreshEvents()}
        >
          Try Again
        </button>
      </div>
    );
  }

  // Calculate total event count
  const totalEvents = Object.values(groupedEvents).reduce(
    (sum, events) => sum + events.length,
    0
  );

  // Determine if we're showing "no results" due to search filtering
  const noSearchResults = searchTerm.length >= 2 && totalEvents === 0 && events.length > 0;

  return (
    <div className="flex flex-col h-[calc(100vh-116px)] overflow-hidden">
      <div className="p-2 sm:p-4">
        {/* Search and filter controls - location and radius always on same line */}
        <div className="mb-4">
          {/* Search input */}
          <div className="relative flex-grow mb-2">
            <input
              type="text"
              placeholder="Search artist or venue..."
              className="w-full p-2 pl-9 pr-8 border-2 border-gray-400 dark:border-gray-700 rounded-md bg-white/90 dark:bg-black/20 backdrop-blur-sm text-gray-800 dark:text-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-2 top-2.5 w-5 h-5 text-gray-400" />

            {/* Clear button */}
            {searchTerm && (
              <button
                className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={() => setSearchTerm('')}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Location selector and radius on same line */}
          <div className="flex flex-row items-center gap-2">
            <LocationSelector />
            <div className="flex flex-1 items-center space-x-2">
              <span className="text-sm whitespace-nowrap">Radius: {tempRadius} miles</span>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={tempRadius}
                onChange={(e) => setTempRadius(parseInt(e.target.value))}
                onMouseUp={applyRadius}
                onTouchEnd={applyRadius}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 pb-20">
        {noSearchResults ? (
          <div className="text-center py-10">
            <p className="text-lg text-[var(--foreground)]">No matches found for &quot;{searchTerm}&quot;</p>
            <button
              onClick={() => setSearchTerm('')}
              className="mt-4 px-4 py-2 bg-[var(--primary)] text-white rounded hover:opacity-90"
            >
              Clear Search
            </button>
          </div>
        ) : totalEvents === 0 ? (
          <div className="text-center py-10">
            <p className="text-lg text-[var(--foreground)]">No upcoming events found.</p>
            <div className="flex flex-col items-center mt-4">
              <div className="inline-flex items-center mb-2 text-[var(--secondary)]">
                <MapPin className="w-4 h-4 mr-1" />
                <span>{selectedLocation?.name || 'Current location'}</span>
                <span className="ml-2">({radius} mile radius)</span>
              </div>
              <p className="text-[var(--foreground)] mb-4">
                {searchTerm
                  ? "Try adjusting your search terms or increasing your search radius."
                  : radius < 50
                    ? "Try increasing your search radius to find more events."
                    : "Check back soon for new events!"}
              </p>
              {radius < 50 && (
                <button
                  onClick={increaseRadius}
                  className="px-4 py-2 bg-[var(--primary)] text-white rounded hover:opacity-90"
                >
                  Increase to {radius + 5} miles
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Render each date section */}
            {Object.entries(groupedEvents).map(([section, events]) => {
              if (events.length === 0) return null;

              const isExpanded = expandedSections.includes(section);
              const sectionTitle = formatSectionTitle(section, events.length);

              return (
                <div key={section} className="border rounded-lg overflow-hidden border-gray-300 dark:border-gray-700">
                  {/* Section header */}
                  <EventSectionHeader
                    title={sectionTitle}
                    isExpanded={isExpanded}
                    onClick={() => toggleSection(section)}
                  />

                  {/* Events list or cards depending on section */}
                  {isExpanded && (
                    section === 'today' ? (
                      // Card view for today's events
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                        {events.map((event) => (
                          <div
                            key={event.id}
                            onClick={() => handleEventClick(event)}
                          >
                            <EventCard event={event} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      // List view for other sections
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Date &amp; Time
                              </th>
                              <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Event
                              </th>
                              <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">
                                Venue
                              </th>
                              <th className="px-2 sm:px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-12">
                                <span className="sr-only">Price</span>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-[var(--background)] divide-y divide-gray-200 dark:divide-gray-700">
                            {events.map((event) => (
                              <tr
                                key={event.id}
                                className="cursor-pointer event-row hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                onClick={() => handleEventClick(event)}
                              >
                                <EventRow event={event} showFullDate={section !== 'today' && section !== 'tomorrow'} />
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Event Button */}
      <AddEventButton />

      {/* Event Info Overlay - wrap the single selected event in an array */}
      {selectedEvent && (
        <EventInfoOverlay
          events={[selectedEvent]}
          isOpen={showEventOverlay}
          onClose={() => {
            setShowEventOverlay(false);
            setSelectedEvent(null);
          }}
          position="list"
        />
      )}
    </div>
  );
}
