// src/components/ListView.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useEvents } from "@/context/EventsContext";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { EventCard } from "./listview/EventCard";
import { EventRow } from "./listview/EventRow";

export default function ListView() {
  const {
    allEvents,
    loading,
    error,
    refreshEvents,
    radius,
    setRadius
  } = useEvents();

  const [expandedSections, setExpandedSections] = useState<string[]>(['today']);
  const [groupedEvents, setGroupedEvents] = useState<Record<string, any[]>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<{
    type: 'artist' | 'venue' | null;
    id: string | null;
    name: string | null;
  }>({
    type: null,
    id: null,
    name: null
  });

  // Handle search
  useEffect(() => {
    if (!searchTerm || searchTerm.length < 2) {
      setSearchResults({ type: null, id: null, name: null });
      return;
    }

    const term = searchTerm.toLowerCase();

    // Check if search matches any artist
    const artistMatch = allEvents.find(event =>
      event.name.toLowerCase().includes(term)
    );

    // Check if search matches any venue
    const venueMatch = allEvents.find(event =>
      event.venueName.toLowerCase().includes(term)
    );

    if (artistMatch) {
      setSearchResults({
        type: 'artist',
        id: artistMatch.id,
        name: artistMatch.name
      });
    } else if (venueMatch) {
      setSearchResults({
        type: 'venue',
        id: venueMatch.venueId,
        name: venueMatch.venueName
      });
    } else {
      setSearchResults({ type: null, id: null, name: null });
    }
  }, [searchTerm, allEvents]);

  // Filter events based on search results
  const filteredEvents = useMemo(() => {
    if (!searchResults.type || !searchResults.id) {
      return allEvents;
    }

    return allEvents.filter(event => {
      if (searchResults.type === 'artist') {
        return event.name.toLowerCase().includes(searchResults.name?.toLowerCase() || '');
      } else if (searchResults.type === 'venue') {
        return event.venueName.toLowerCase().includes(searchResults.name?.toLowerCase() || '');
      }
      return true;
    });
  }, [allEvents, searchResults]);

  // Group events by date category
  useEffect(() => {
    if (!filteredEvents.length) return;

    const grouped: Record<string, any[]> = {
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

  return (
    <div className="flex flex-col h-[calc(100vh-116px)] overflow-hidden">
  <div className="p-2 sm:p-4">
        {/* Search and filter controls */}
        <div className="mb-4 flex flex-col sm:flex-row gap-2 sm:items-center">
          {/* Search input */}
          <div className="relative flex-grow max-w-md">
            <input
              type="text"
              placeholder="Search artist or venue..."
              className="w-full p-2 pl-9 border rounded-md bg-white dark:bg-gray-800 text-[var(--foreground)]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-2 top-2.5 w-5 h-5 text-gray-400" />

            {/* Show search result indicator if we have a match */}
            {searchResults.type && searchResults.name && (
              <div className={`absolute right-2 top-2.5 px-2 py-0.5 rounded text-xs text-white ${searchResults.type === 'artist' ? 'bg-[var(--primary)]' : 'bg-[var(--secondary)]'
                }`}>
                {searchResults.type === 'artist' ? 'Artist' : 'Venue'}
              </div>
            )}
          </div>

          {/* Radius filter */}
          <div className="flex items-center space-x-2">
            <span className="text-sm whitespace-nowrap">Radius: {radius} miles</span>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value))}
              className="w-32"
            />
          </div>
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 pb-20">
        {totalEvents === 0 ? (
          <div className="text-center py-10">
            <p className="text-lg text-[var(--foreground)]">No upcoming events found.</p>
            <p className="text-[var(--secondary)]">
              {searchTerm ? "Try adjusting your search terms." :
                radius < 50 ? "Try increasing your search radius." :
                  "Check back soon for new events!"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Render each date section */}
            {Object.entries(groupedEvents).map(([section, events]) => {
              if (events.length === 0) return null;

              const isExpanded = expandedSections.includes(section);
              const sectionTitle = formatSectionTitle(section, events.length);

              return (
                <div key={section} className="border rounded-lg overflow-hidden">
                  {/* Section header */}
                  <div
                    className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-800 cursor-pointer"
                    onClick={() => toggleSection(section)}
                  >
                    <h3 className="font-medium text-[var(--foreground)]">{sectionTitle}</h3>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-[var(--foreground)]" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-[var(--foreground)]" />
                    )}
                  </div>

                  {/* Events list or cards depending on section */}
                  {isExpanded && (
                    section === 'today' ? (
                      // Card view for today's events
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                        {events.map((event) => (
                          <EventCard key={event.id} event={event} />
                        ))}
                      </div>
                    ) : (
                      // List view for other sections
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Date & Time
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
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {events.map((event) => (
                              <EventRow key={event.id} event={event} showFullDate={section !== 'today' && section !== 'tomorrow'} />
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
    </div>
  );
}