// src/components/listview/EventCard.tsx
import { Ticket, Map } from "lucide-react";
import { formatTime } from "@/lib/utils/date-utils";
import type { Event } from "@/lib/types";

export function EventCard({ event }: { event: Event }) {
  // Create Google Maps URL with just venue name
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    event.venueName
  )}`;

  return (
    <div className="event-card border rounded-lg p-4 hover:shadow-md transition-shadow bg-[var(--background)] border-gray-300 dark:border-gray-700">
      <div className="font-bold text-[var(--primary)]">{event.name}</div>
      <div className="text-sm text-[var(--foreground)] flex items-center">
        <span>{event.venueName}</span>
        <a 
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 text-[var(--secondary)] hover:opacity-80"
          aria-label="Open in Google Maps"
        >
          <Map className="w-4 h-4" />
        </a>
      </div>
      <div className="mt-2 flex justify-between items-center">
        <div className="text-sm font-medium text-[var(--foreground)]">{formatTime(event.startTime)}</div>
        {event.ticketed ? (
  <div className="flex items-center text-[var(--foreground)]">
    <Ticket className="w-4 h-4 mr-1 text-[var(--primary)]" />
    <span>{event.ticketinformation || "Ticketed"}</span>
  </div>
) : (
  <div className="text-sm font-medium text-[var(--secondary)]">
    £ree
  </div>

        )}
      </div>
    </div>
  );
}