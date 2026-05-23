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
  groupEventsByMonth,
  formatMonthYear,
} from "@/lib/utils/event-grouping";
import { ProfileDateGroup } from "./ProfileDateGroup";
import { ProfileMonthHeader } from "./ProfileMonthHeader";

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
 * ProfileSectionGroup - Groups events by month with sticky headers, then into collapsible sections
 *
 * Uses the same grouping logic as the main list view (event-grouping.ts)
 * to provide consistent UX across the app.
 *
 * Features:
 * - Sticky month headers (JUNE 2026, JULY 2026) for easy navigation
 * - Within each month, collapsible sections: TODAY, TOMORROW, THIS WEEK, etc.
 * - Only first section with events is expanded by default
 * - Within each section, events are grouped by individual date
 * - Uses ProfileDateGroup for date-level rendering
 */
export default function ProfileSectionGroup({
  events,
  counterpartType,
  onEventClick,
}: ProfileSectionGroupProps) {
  // Group events by month first, then by section within each month
  const { monthGroups, nonEmptySections, sectionGroups } = useMemo(() => {
    // First group by month
    const eventsByMonth = groupEventsByMonth(events);

    // Then group all events by section (for expanding/collapsing)
    const groups = new Map<EventGroup, Event[]>();
    for (const group of GROUP_ORDER) {
      groups.set(group, []);
    }

    const today = new Date();
    for (const event of events) {
      const eventDate = new Date(event.date);
      const group = getEventGroup(eventDate, today);
      if (group) {
        groups.get(group)!.push(event);
      }
    }

    const nonEmpty = GROUP_ORDER.filter(
      (group) => groups.get(group)!.length > 0
    );

    return {
      monthGroups: eventsByMonth,
      nonEmptySections: nonEmpty,
      sectionGroups: groups
    };
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
  const monthKeys = Array.from(monthGroups.keys());

  // If only one month, skip the month header for cleaner UX
  const showMonthHeaders = monthKeys.length > 1;

  return (
    <div className="space-y-2">
      {showMonthHeaders ? (
        // Multiple months: render with sticky month headers
        monthKeys.map((monthKey) => {
          const monthEvents = monthGroups.get(monthKey)!;

          // Group this month's events by section
          const monthSections = new Map<EventGroup, Event[]>();
          for (const group of GROUP_ORDER) {
            monthSections.set(group, []);
          }
          for (const event of monthEvents) {
            const eventDate = new Date(event.date);
            const group = getEventGroup(eventDate, today);
            if (group) {
              monthSections.get(group)!.push(event);
            }
          }

          const monthNonEmpty = GROUP_ORDER.filter(
            (group) => monthSections.get(group)!.length > 0
          );

          if (monthNonEmpty.length === 0) return null;

          return (
            <div key={monthKey} className="profile-month-group">
              <ProfileMonthHeader
                monthYear={formatMonthYear(monthKey)}
                eventCount={monthEvents.length}
              />

              {monthNonEmpty.map((sectionKey) => {
                const sectionEvents = monthSections.get(sectionKey)!;
                const eventCount = sectionEvents.length;
                const isExpanded = expandedSections.has(sectionKey);
                const eventsByDate = groupEventsByDate(sectionEvents);

                return (
                  <div key={sectionKey} className="profile-section-group">
                    <button
                      type="button"
                      className="profile-section-header-toggle"
                      onClick={() => toggleSection(sectionKey)}
                      aria-expanded={isExpanded}
                      aria-controls={`section-${monthKey}-${sectionKey}`}
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

                    {isExpanded && (
                      <div
                        id={`section-${monthKey}-${sectionKey}`}
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
        })
      ) : (
        // Single month: render without month header (original behavior)
        nonEmptySections.map((sectionKey) => {
          const sectionEvents = sectionGroups.get(sectionKey)!;
          const eventCount = sectionEvents.length;
          const isExpanded = expandedSections.has(sectionKey);
          const eventsByDate = groupEventsByDate(sectionEvents);

          return (
            <div key={sectionKey} className="profile-section-group">
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
        })
      )}
    </div>
  );
}
