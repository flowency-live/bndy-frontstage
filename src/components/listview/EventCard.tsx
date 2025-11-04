// src/components/listview/EventCard.tsx
import { Ticket, Map, User } from "lucide-react";
import { formatTime } from "@/lib/utils/date-utils";
import Link from "next/link";
import type { Event } from "@/lib/types";

export function EventCard({ event }: { event: Event }) {
  // Create Google Maps URL with just venue name
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    event.venueName
  )}`;

  // Check if event has artist information
  const hasArtist = event.artistIds && event.artistIds.length > 0;

  return (
    <div className="event-card border rounded-lg p-4 hover:shadow-md transition-shadow bg-[var(--background)] border-gray-300 dark:border-gray-700">
      <div className="font-bold text-[var(--primary)]">{event.name}</div>
      
      {/* Artist link if available */}
      {hasArtist && (
        <div className="text-xs text-[var(--foreground)]/70 mb-1 flex items-center">
          <User className="w-3 h-3 mr-1" />
          <Link 
            href={`/artists/${event.artistIds[0]}`}
            className="text-[var(--primary)] hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            View Artist Profile
          </Link>
        </div>
      )}
      
      <div className="text-sm text-[var(--foreground)] flex items-center">
        <Link 
          href={`/venues/${event.venueId}`}
          className="text-[var(--secondary)] hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {event.venueName}
        </Link>
        <a 
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 text-[var(--secondary)] hover:opacity-80"
          aria-label="Open in Google Maps"
          onClick={(e) => e.stopPropagation()}
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