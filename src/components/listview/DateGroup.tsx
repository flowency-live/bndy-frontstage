// src/components/listview/DateGroup.tsx
"use client";

import { EventRowV2 } from "./EventRowV2";
import type { EventWithDistance } from "@/hooks/useEventsForList";

interface DateGroupProps {
  dateKey: string;
  day: string;        // "SAT 02"
  monthYear: string;  // "May 2026"
  relativeLabel?: string; // "Tomorrow", "In 8 days"
  events: EventWithDistance[];
  onEventClick: (event: EventWithDistance) => void;
}

export function DateGroup({
  dateKey,
  day,
  monthYear,
  relativeLabel,
  events,
  onEventClick
}: DateGroupProps) {
  return (
    <div className="lv-date-group">
      {/* Date label column (sticky on mobile) */}
      <div className="lv-date-label">
        <div className="lv-date-day">{day}</div>
        <div className="lv-date-dow">{monthYear}</div>
        {relativeLabel && (
          <div className="lv-date-when">{relativeLabel}</div>
        )}
      </div>

      {/* Events column */}
      <div className="lv-date-events">
        {events.map((event, index) => (
          <EventRowV2
            key={event.id}
            event={event}
            index={index}
            onClick={() => onEventClick(event)}
          />
        ))}
      </div>
    </div>
  );
}
