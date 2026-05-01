"use client";

import { Event } from "@/lib/types";
import {
  EventGroup,
  getEventGroup,
  GROUP_ORDER,
  groupEventsByDate,
  formatDateParts,
  getRelativeDateLabel,
} from "@/lib/utils/event-grouping";
import { ProfileDateGroup } from "./ProfileDateGroup";

interface ProfileSectionGroupProps {
  events: Event[];
  counterpartType: "artist" | "venue";
  onEventClick: (event: Event) => void;
}

/**
 * Section display labels matching the list view
 */
const SECTION_LABELS: Record<EventGroup, string> = {
  today: "TODAY",
  tomorrow: "TOMORROW",
  thisWeek: "THIS WEEK",
  nextWeek: "NEXT WEEK",
  comingSoon: "COMING SOON",
  futureEvents: "FUTURE",
};

/**
 * ProfileSectionGroup - Groups events into sections (TODAY, TOMORROW, etc.)
 *
 * Uses the same grouping logic as the main list view (event-grouping.ts)
 * to provide consistent UX across the app.
 *
 * Features:
 * - Section headers: TODAY, TOMORROW, THIS WEEK, NEXT WEEK, COMING SOON, FUTURE
 * - Within each section, events are grouped by individual date
 * - Uses ProfileDateGroup for date-level rendering
 */
export default function ProfileSectionGroup({
  events,
  counterpartType,
  onEventClick,
}: ProfileSectionGroupProps) {
  // Group events by section
  const sectionGroups = new Map<EventGroup, Event[]>();

  // Initialize empty groups
  for (const group of GROUP_ORDER) {
    sectionGroups.set(group, []);
  }

  // Categorize each event into its section
  const today = new Date();
  for (const event of events) {
    const eventDate = new Date(event.date);
    const group = getEventGroup(eventDate, today);
    if (group) {
      sectionGroups.get(group)!.push(event);
    }
  }

  // Filter out empty sections and render
  const nonEmptySections = GROUP_ORDER.filter(
    (group) => sectionGroups.get(group)!.length > 0
  );

  if (nonEmptySections.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {nonEmptySections.map((sectionKey) => {
        const sectionEvents = sectionGroups.get(sectionKey)!;
        const eventCount = sectionEvents.length;

        // Group events within this section by individual date
        const eventsByDate = groupEventsByDate(sectionEvents);

        return (
          <div key={sectionKey} className="profile-section-group">
            {/* Section header */}
            <div className="profile-section-header">
              <h3 className="profile-section-title">
                {SECTION_LABELS[sectionKey]}
              </h3>
              <span className="profile-section-count">
                {eventCount} {eventCount === 1 ? "event" : "events"}
              </span>
            </div>

            {/* Events grouped by date within this section */}
            <div className="profile-date-events">
              {Array.from(eventsByDate.entries()).map(([dateKey, dateEvents]) => {
                const eventDate = new Date(dateKey + "T00:00:00");
                const { day, monthYear } = formatDateParts(eventDate);
                const relativeLabel = getRelativeDateLabel(eventDate, today);

                return (
                  <ProfileDateGroup
                    key={dateKey}
                    day={day}
                    monthYear={monthYear}
                    relativeLabel={relativeLabel}
                    events={dateEvents}
                    counterpartType={counterpartType}
                    onEventClick={onEventClick}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
