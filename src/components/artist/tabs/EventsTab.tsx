"use client";

import { useState } from "react";
import { Event } from "@/lib/types";
import { Calendar, MapPin, Map as MapIcon, ChevronDown } from "lucide-react";
import {
  ProfileDateGroup,
  formatDateForGroup,
  groupEventsByDate,
  separateEvents,
} from "@/components/shared/ProfileDateGroup";
import ProfileSectionGroup from "@/components/shared/ProfileSectionGroup";
import FeaturedEventCard from "@/components/shared/FeaturedEventCard";
import ArtistEventsMap from "../ArtistEventsMap";
import EventInfoOverlay from "@/components/overlays/EventInfoOverlay";

interface EventsTabProps {
  events: Event[];
  artistLocation?: string;
}

type ViewMode = "date" | "distance" | "map";

/**
 * EventsTab - Artist events with view toggle (restyled)
 *
 * Features:
 * - View toggle: By Date | By Distance | Map
 * - Featured "next event" card
 * - Section-based grouping (TODAY, TOMORROW, THIS WEEK, etc.)
 * - Collapsible past events section
 * - EventInfoOverlay on event click
 *
 * Uses CSS classes from globals.css (.profile-*)
 */
export default function EventsTab({ events, artistLocation }: EventsTabProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("date");
  const [showPast, setShowPast] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);

  // Separate upcoming and past events
  const { upcoming, past } = separateEvents(events);

  // First upcoming event for featured card
  const nextEvent = upcoming.length > 0 ? upcoming[0] : null;
  // Remaining events for section grouping
  const remainingUpcoming = upcoming.slice(1);

  // Group past events by date (for collapsible section)
  const pastByDate = groupEventsByDate(past);

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setShowOverlay(true);
  };

  const handleCloseOverlay = () => {
    setShowOverlay(false);
    setSelectedEvent(null);
  };

  return (
    <div
      role="tabpanel"
      id="events-panel"
      aria-labelledby="events-tab"
      className="profile-wrap"
    >
      {/* View Toggle */}
      <div className="profile-view-toggle">
        <div className="profile-view-segments">
          <button
            onClick={() => setViewMode("date")}
            className={`profile-seg ${viewMode === "date" ? "active" : ""}`}
            aria-pressed={viewMode === "date"}
          >
            <Calendar className="w-3 h-3" />
            By Date
          </button>
          <button
            onClick={() => setViewMode("distance")}
            className={`profile-seg ${viewMode === "distance" ? "active" : ""}`}
            aria-pressed={viewMode === "distance"}
          >
            <MapPin className="w-3 h-3" />
            By Distance
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={`profile-seg ${viewMode === "map" ? "active" : ""}`}
            aria-pressed={viewMode === "map"}
          >
            <MapIcon className="w-3 h-3" />
            Map
          </button>
        </div>
        {artistLocation && (
          <span className="profile-view-meta">
            From <span className="acc">{artistLocation}</span>
          </span>
        )}
      </div>

      {/* Content: Map or List */}
      {viewMode === "map" ? (
        <ArtistEventsMap events={events} />
      ) : (
        <>
          {/* Upcoming Section */}
          {upcoming.length > 0 && (
            <section className="profile-section">
              <div className="profile-section-head">
                <h2 className="profile-section-name">Upcoming</h2>
                <span className="profile-section-count">
                  {upcoming.length} Event{upcoming.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Featured Next Event Card */}
              {nextEvent && (
                <FeaturedEventCard
                  event={nextEvent}
                  counterpartType="venue"
                  onClick={() => handleEventClick(nextEvent)}
                />
              )}

              {/* Remaining events grouped by section */}
              {remainingUpcoming.length > 0 && (
                <ProfileSectionGroup
                  events={remainingUpcoming}
                  counterpartType="venue"
                  onEventClick={handleEventClick}
                />
              )}
            </section>
          )}

          {/* Past Section (Collapsible) */}
          {past.length > 0 && (
            <section className="profile-section">
              <div
                className="profile-section-head past"
                onClick={() => setShowPast(!showPast)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setShowPast(!showPast);
                  }
                }}
                aria-expanded={showPast}
              >
                <h2 className="profile-section-name past">Past</h2>
                <span className="profile-section-count">
                  {past.length} Event{past.length !== 1 ? "s" : ""}
                </span>
                <span className={`profile-section-toggle ${showPast ? "" : "collapsed"}`}>
                  <ChevronDown className="w-4 h-4" />
                </span>
              </div>

              {showPast && (
                <div>
                  {Array.from(pastByDate.entries()).map(([dateKey, dateEvents]) => {
                    const { day, monthYear } = formatDateForGroup(dateKey);
                    return (
                      <ProfileDateGroup
                        key={dateKey}
                        day={day}
                        monthYear={monthYear}
                        events={dateEvents}
                        counterpartType="venue"
                        isPast
                        onEventClick={handleEventClick}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Empty state */}
          {events.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-[var(--lv-text-3)]">No upcoming events</p>
            </div>
          )}
        </>
      )}

      {/* Event Info Overlay */}
      {selectedEvent && (
        <EventInfoOverlay
          events={[selectedEvent]}
          isOpen={showOverlay}
          onClose={handleCloseOverlay}
          position="list"
        />
      )}
    </div>
  );
}
