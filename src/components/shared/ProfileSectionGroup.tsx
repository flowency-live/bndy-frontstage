"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
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
 * ProfileSectionGroup - Groups events into collapsible sections (TODAY, TOMORROW, etc.)
 *
 * Uses the same grouping logic as the main list view (event-grouping.ts)
 * to provide consistent UX across the app.
 *
 * Features:
 * - Collapsible section headers: TODAY, TOMORROW, THIS WEEK, NEXT WEEK, COMING SOON, FUTURE
 * - Only first section with events is expanded by default
 * - Within each section, events are grouped by individual date
 * - Uses ProfileDateGroup for date-level rendering
 */
export default function ProfileSectionGroup({
  events,
  counterpartType,
  onEventClick,
}: ProfileSectionGroupProps) {
  // Group events by section
  const { nonEmptySections, sectionGroups } = useMemo(() => {
    const groups = new Map<EventGroup, Event[]>();

    // Initialize empty groups
    for (const group of GROUP_ORDER) {
      groups.set(group, []);
    }

    // Categorize each event into its section
    const today = new Date();
    for (const event of events) {
      const eventDate = new Date(event.date);
      const group = getEventGroup(eventDate, today);
      if (group) {
        groups.get(group)!.push(event);
      }
    }

    // Filter out empty sections
    const nonEmpty = GROUP_ORDER.filter(
      (group) => groups.get(group)!.length > 0
    );

    return { nonEmptySections: nonEmpty, sectionGroups: groups };
  }, [events]);

  // Track which sections are expanded - only first section expanded by default
  const [expandedSections, setExpandedSections] = useState<Set<EventGroup>>(() => {
    const initial = new Set<EventGroup>();
    if (nonEmptySections.length > 0) {
      initial.add(nonEmptySections[0]);
    }
    return initial;
  });

  const toggleSection = (sectionKey: EventGroup) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionKey)) {
        next.delete(sectionKey);
      } else {
        next.add(sectionKey);
      }
      return next;
    });
  };

  if (nonEmptySections.length === 0) {
    return null;
  }

  const today = new Date();

  return (
    <div className="space-y-2">
      {nonEmptySections.map((sectionKey) => {
        const sectionEvents = sectionGroups.get(sectionKey)!;
        const eventCount = sectionEvents.length;
        const isExpanded = expandedSections.has(sectionKey);

        // Group events within this section by individual date
        const eventsByDate = groupEventsByDate(sectionEvents);

        return (
          <div key={sectionKey} className="profile-section-group">
            {/* Collapsible Section header */}
            <button
              type="button"
              className="profile-section-header-toggle"
              onClick={() => toggleSection(sectionKey)}
              aria-expanded={isExpanded}
              aria-controls={`section-${sectionKey}`}
            >
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-[var(--lv-orange)]" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-[var(--lv-text-3)]" />
                )}
                <h3 className="profile-section-title">
                  {SECTION_LABELS[sectionKey]}
                </h3>
              </div>
              <span className="profile-section-count">
                {eventCount} {eventCount === 1 ? "event" : "events"}
              </span>
            </button>

            {/* Events grouped by date within this section */}
            {isExpanded && (
              <div
                id={`section-${sectionKey}`}
                className="profile-date-events"
              >
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
            )}
          </div>
        );
      })}
    </div>
  );
}
