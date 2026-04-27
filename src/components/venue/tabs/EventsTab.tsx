"use client";

import { useState } from "react";
import { Event } from "@/lib/types";
import { ChevronDown } from "lucide-react";
import {
  ProfileDateGroup,
  formatDateForGroup,
  groupEventsByDate,
  separateEvents,
} from "@/components/shared/ProfileDateGroup";
import EventInfoOverlay from "@/components/overlays/EventInfoOverlay";

interface EventsTabProps {
  events: Event[];
  venueLocation?: string;
}

/**
 * EventsTab - Venue events list (restyled)
 *
 * Features:
 * - No view toggle (venues are fixed location)
 * - Upcoming and Past sections with collapsible past
 * - ProfileDateGroup + ProfileEventRow patterns
 * - Shows artist (orange) as counterpart
 *
 * Uses CSS classes from globals.css (.profile-*)
 */
export default function EventsTab({ events, venueLocation }: EventsTabProps) {
  const [showPast, setShowPast] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);

  // Separate upcoming and past events
  const { upcoming, past } = separateEvents(events);

  // Group events by date
  const upcomingByDate = groupEventsByDate(upcoming);
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
      {/* Upcoming Section */}
      {upcoming.length > 0 && (
        <section className="profile-section">
          <div className="profile-section-head">
            <h2 className="profile-section-name">Upcoming</h2>
            <span className="profile-section-count">
              {upcoming.length} Event{upcoming.length !== 1 ? "s" : ""}
            </span>
          </div>

          {Array.from(upcomingByDate.entries()).map(([dateKey, dateEvents]) => {
            const { day, monthYear, relativeLabel } = formatDateForGroup(dateKey);
            return (
              <ProfileDateGroup
                key={dateKey}
                day={day}
                monthYear={monthYear}
                relativeLabel={relativeLabel}
                events={dateEvents}
                counterpartType="artist"
                onEventClick={handleEventClick}
              />
            );
          })}
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
                    counterpartType="artist"
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
