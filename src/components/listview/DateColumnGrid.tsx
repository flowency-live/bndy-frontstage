// src/components/listview/DateColumnGrid.tsx
"use client";

import { DateColumn } from "./DateColumn";
import type { EventWithDistance } from "@/hooks/useEventsForList";

interface DateColumnGridProps {
  eventsByDate: Map<string, EventWithDistance[]>;
  onEventClick: (event: EventWithDistance) => void;
}

/**
 * Desktop grid container that renders date columns in a wrapping flex layout.
 * Hidden on mobile via CSS (display: none at <1024px).
 */
export function DateColumnGrid({ eventsByDate, onEventClick }: DateColumnGridProps) {
  return (
    <div className="lv-date-grid">
      {Array.from(eventsByDate.entries()).map(([dateKey, events]) => (
        <DateColumn
          key={dateKey}
          dateKey={dateKey}
          dateLabel={dateKey}
          eventCount={events.length}
          events={events}
          onEventClick={onEventClick}
        />
      ))}
    </div>
  );
}
