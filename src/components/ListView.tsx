// src/components/ListView.tsx - Refreshed List View V2
"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEvents } from "@/context/EventsContext";
import { useEventsForList, type EventWithDistance } from "@/hooks/useEventsForList";
import { Search, X, ChevronDown, ChevronRight } from "lucide-react";
import { DateGroup } from "./listview/DateGroup";
import { DateGroupSkeleton } from "./listview/EventRowSkeleton";
import LocationSelector from "./filters/LocationSelector";
import EventInfoOverlay from "./overlays/EventInfoOverlay";
import { AddEventButton } from "./events/AddEventButton";
import {
  getEventGroup,
  createEmptyGroups,
  GROUP_ORDER,
  groupEventsByDate,
  formatDateParts,
  getRelativeDateLabel,
  type EventGroup
} from "@/lib/utils/event-grouping";

export default function ListView() {
  const { radius, setRadius, selectedLocation } = useEvents();

  // Calculate date range for query
  const { startDate } = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return {
      startDate: today.toISOString().split("T")[0],
      endDate: undefined
    };
  }, []);

  // Fetch events with distance
  const { events, isLoading: loading, isError, error } = useEventsForList({
    location: selectedLocation,
    radius,
    startDate,
    enabled: true
  });

  const [expandedSections, setExpandedSections] = useState<string[]>(["today", "tomorrow", "thisWeek"]);
  const [searchTerm, setSearchTerm] = useState("");
  const [tempRadius, setTempRadius] = useState(radius);
  const [selectedEvent, setSelectedEvent] = useState<EventWithDistance | null>(null);
  const [showEventOverlay, setShowEventOverlay] = useState(false);

  // Sync tempRadius with radius
  useEffect(() => {
    setTempRadius(radius);
  }, [radius]);

  const applyRadius = () => {
    if (tempRadius !== radius) {
      setRadius(tempRadius);
    }
  };

  // Filter events by search term
  const filteredEvents = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return events;

    const term = searchTerm.toLowerCase();
    return events.filter(
      (event) =>
        event.name.toLowerCase().includes(term) ||
        event.venueName.toLowerCase().includes(term) ||
        (event.artistName && event.artistName.toLowerCase().includes(term))
    );
  }, [events, searchTerm]);

  // Group events by section (today, tomorrow, thisWeek, etc.)
  const groupedEvents = useMemo(() => {
    const grouped: Record<EventGroup, EventWithDistance[]> = createEmptyGroups() as Record<EventGroup, EventWithDistance[]>;

    filteredEvents.forEach((event) => {
      const eventDate = new Date(event.date);
      const group = getEventGroup(eventDate);
      if (group) {
        grouped[group].push(event);
      }
    });

    // Sort each group by date and time
    GROUP_ORDER.forEach((key) => {
      grouped[key].sort((a, b) => {
        const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return a.startTime.localeCompare(b.startTime);
      });
    });

    return grouped;
  }, [filteredEvents]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const handleEventClick = (event: EventWithDistance) => {
    setSelectedEvent(event);
    setShowEventOverlay(true);
  };

  const increaseRadius = () => {
    const newRadius = Math.min(radius + 5, 50);
    setRadius(newRadius);
  };

  // Section titles
  const sectionTitles: Record<string, string> = {
    today: "Today",
    tomorrow: "Tomorrow",
    thisWeek: "This Week",
    nextWeek: "Next Week",
    comingSoon: "Coming Soon",
    futureEvents: "Future Events"
  };

  const totalEvents = Object.values(groupedEvents).reduce(
    (sum, evts) => sum + evts.length,
    0
  );

  const noSearchResults = searchTerm.length >= 2 && totalEvents === 0 && events.length > 0;

  if (loading) {
    return (
      <div className="lv-wrap flex flex-col h-[calc(100vh-116px)] overflow-hidden">
        <div className="p-4">
          <div className="h-11 bg-lv-surface rounded animate-pulse mb-4" />
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-lv-surface rounded animate-pulse" />
            <div className="h-10 flex-1 bg-lv-surface rounded animate-pulse" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-20">
          <DateGroupSkeleton />
          <DateGroupSkeleton />
        </div>
      </div>
    );
  }

  if (isError && error) {
    return (
      <div className="lv-wrap flex flex-col items-center justify-center h-[calc(100vh-116px)] px-4">
        <p className="text-lv-text-2 mb-4">
          {error instanceof Error ? error.message : "Failed to load events"}
        </p>
        <button
          className="px-6 py-3 bg-lv-orange text-lv-bg font-anton uppercase rounded"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="lv-wrap flex flex-col h-[calc(100vh-116px)] overflow-hidden">
      {/* Search and filters */}
      <div className="p-3 sm:p-4 border-b border-lv-rule">
        {/* Search input */}
        <div className="relative mb-3">
          <input
            type="text"
            placeholder="Search artist or venue..."
            className="w-full p-3 pl-11 pr-10 bg-lv-surface border border-lv-rule rounded text-lv-text font-archivo placeholder:text-lv-text-3 focus:border-lv-orange focus:outline-none transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-lv-text-3" />
          {searchTerm && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-lv-text-3 hover:text-lv-text"
              onClick={() => setSearchTerm("")}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Location and radius */}
        <div className="flex flex-row items-center gap-3">
          <LocationSelector />
          <div className="flex flex-1 items-center gap-3 font-mono text-xs text-lv-text-2">
            <span className="whitespace-nowrap">
              Within <strong className="text-lv-text">{tempRadius} mi</strong>
            </span>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={tempRadius}
              onChange={(e) => setTempRadius(parseInt(e.target.value))}
              onMouseUp={applyRadius}
              onTouchEnd={applyRadius}
              className="flex-1 h-1 bg-lv-surface-2 rounded appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-lv-orange [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-lv-bg [&::-webkit-slider-thumb]:shadow-[0_0_0_1px_var(--lv-orange)]"
            />
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 pb-20">
        {noSearchResults ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <p className="font-mono text-lv-text-3">
              No matches for &quot;<span className="text-lv-orange">{searchTerm}</span>&quot;
            </p>
            <button
              onClick={() => setSearchTerm("")}
              className="mt-4 px-6 py-3 bg-lv-orange text-lv-bg font-anton uppercase rounded"
            >
              Clear Search
            </button>
          </motion.div>
        ) : totalEvents === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="text-5xl mb-4"
            >
              🎸
            </motion.div>
            <h3 className="font-anton text-2xl text-lv-text uppercase">No gigs nearby</h3>
            <p className="text-lv-text-2 mt-2 font-archivo">
              {radius < 50
                ? "Try expanding your radius"
                : "Check back soon for new events!"}
            </p>
            {radius < 50 && (
              <button
                onClick={increaseRadius}
                className="mt-4 px-6 py-3 bg-lv-orange text-lv-bg font-anton uppercase rounded"
              >
                Increase to {radius + 5} mi
              </button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-6 py-4">
            {GROUP_ORDER.map((section) => {
              const sectionEvents = groupedEvents[section];
              if (sectionEvents.length === 0) return null;

              const isExpanded = expandedSections.includes(section);

              // Group events by date within section
              const eventsByDate = groupEventsByDate(sectionEvents);

              return (
                <section key={section} className="lv-section">
                  {/* Section header */}
                  <button
                    className="lv-section-head w-full"
                    onClick={() => toggleSection(section)}
                  >
                    <h2 className="lv-section-name">{sectionTitles[section]}</h2>
                    <span className="lv-section-count">
                      {sectionEvents.length} Event{sectionEvents.length !== 1 ? "s" : ""}
                    </span>
                    <span className="text-lv-text-2">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </span>
                  </button>

                  {/* Section content with spring animation */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                          mass: 0.8
                        }}
                        style={{ overflow: "hidden" }}
                      >
                        {Array.from(eventsByDate.entries()).map(([dateKey, dateEvents]) => {
                          const date = new Date(dateKey);
                          const { day, monthYear } = formatDateParts(date);
                          const relativeLabel = getRelativeDateLabel(date);

                          return (
                            <DateGroup
                              key={dateKey}
                              dateKey={dateKey}
                              day={day}
                              monthYear={monthYear}
                              relativeLabel={relativeLabel}
                              events={dateEvents}
                              onEventClick={handleEventClick}
                            />
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Event Button */}
      <AddEventButton />

      {/* Event Info Overlay */}
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
