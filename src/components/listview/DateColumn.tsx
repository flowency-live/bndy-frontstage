// src/components/listview/DateColumn.tsx
"use client";

import { EventCard } from "./EventCard";
import type { EventWithDistance } from "@/hooks/useEventsForList";

interface DateColumnProps {
  dateKey: string;
  dateLabel: string;
  eventCount: number;
  events: EventWithDistance[];
  onEventClick: (event: EventWithDistance) => void;
}

/**
 * Format date for column header (e.g., "FRI 15TH MAY")
 */
function formatColumnDate(dateKey: string): string {
  const date = new Date(dateKey);
  const dayName = date.toLocaleDateString("en-GB", { weekday: "short" }).toUpperCase();
  const dayNum = date.getDate();
  const month = date.toLocaleDateString("en-GB", { month: "short" }).toUpperCase();
  const ordinal = getOrdinal(dayNum);
  return `${dayName} ${dayNum}${ordinal} ${month}`;
}

function getOrdinal(n: number): string {
  const s = ["TH", "ST", "ND", "RD"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export function DateColumn({
  dateKey,
  events,
  eventCount,
  onEventClick,
}: DateColumnProps) {
  const formattedDate = formatColumnDate(dateKey);

  return (
    <div className="lv-date-column">
      {/* Column Header */}
      <div className="lv-date-column-header">
        <span className="lv-date-column-date">{formattedDate}</span>
        <span className="lv-date-column-count">{eventCount} event{eventCount !== 1 ? "s" : ""}</span>
      </div>

      {/* Event Cards */}
      <div className="lv-date-column-events">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onClick={() => onEventClick(event)}
          />
        ))}
      </div>
    </div>
  );
}
