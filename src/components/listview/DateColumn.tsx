// src/components/listview/DateColumn.tsx
"use client";

import { useMemo } from "react";
import { EventCard } from "./EventCard";
import { useArtistImages, getArtistImage } from "@/hooks/useArtistImages";
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

  // Collect unique artist IDs from all events in this column
  const artistIds = useMemo(() => {
    const ids: string[] = [];
    events.forEach((event) => {
      if (event.artistIds && event.artistIds.length > 0) {
        ids.push(event.artistIds[0]); // Primary artist
      }
    });
    return [...new Set(ids)];
  }, [events]);

  // Fetch artist images
  const { artistImages } = useArtistImages(artistIds);

  return (
    <div className="lv-date-column">
      {/* Column Header */}
      <div className="lv-date-column-header">
        <span className="lv-date-column-date">{formattedDate}</span>
        <span className="lv-date-column-count">{eventCount} event{eventCount !== 1 ? "s" : ""}</span>
      </div>

      {/* Event Cards */}
      <div className="lv-date-column-events">
        {events.map((event) => {
          const primaryArtistId = event.artistIds?.[0];
          const artistData = getArtistImage(artistImages, primaryArtistId);

          return (
            <EventCard
              key={event.id}
              event={event}
              onClick={() => onEventClick(event)}
              artistImageUrl={artistData?.profileImageUrl}
              artistDisplayColour={artistData?.displayColour}
            />
          );
        })}
      </div>
    </div>
  );
}
