// src/components/listview/EventRow.tsx
import { Ticket, Map, User } from "lucide-react";
import { formatEventDate, formatTime } from "@/lib/utils/date-utils";
import Link from "next/link";
import type { Event } from "@/lib/types";

export function EventRow({ 
  event, 
  showFullDate = false 
}: { 
  event: Event;
  showFullDate?: boolean;
}) {
  // Create Google Maps URL with just venue name
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    event.venueName
  )}`;

  // Check if event has artist information
  const hasArtist = event.artistIds && event.artistIds.length > 0;

  return (
    <>
      <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-sm text-[var(--foreground)] border-b border-gray-200 dark:border-gray-700">
        {showFullDate ? (
          <div>
            <div>{formatEventDate(new Date(event.date))}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{formatTime(event.startTime)}</div>
          </div>
        ) : (
          formatTime(event.startTime)
        )}
      </td>
      <td className="px-2 sm:px-4 py-3 text-sm border-b border-gray-200 dark:border-gray-700">
        <div className="font-medium text-[var(--primary)]">{event.name}</div>
        {/* Artist name with link if available */}
        {hasArtist && event.artistName && (
          <div className="text-xs text-[var(--foreground)]/70 flex items-center mt-1">
            <User className="w-3 h-3 mr-1" />
            <Link
              href={`/artists/${event.artistIds[0]}`}
              className="text-[var(--primary)] hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {event.artistName}
            </Link>
          </div>
        )}
        <div className="sm:hidden text-xs text-gray-500 dark:text-gray-400 mt-1">
          <Link
            href={`/venues/${event.venueId}`}
            className="text-[var(--secondary)] hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {event.venueCity ? `${event.venueName}, ${event.venueCity}` : event.venueName}
          </Link>
        </div>
      </td>
      <td className="px-2 sm:px-4 py-3 text-sm text-[var(--foreground)] hidden sm:table-cell border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <Link
            href={`/venues/${event.venueId}`}
            className="text-[var(--secondary)] hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {event.venueCity ? `${event.venueName}, ${event.venueCity}` : event.venueName}
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
      </td>
      <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-center border-b border-gray-200 dark:border-gray-700">
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
      </td>
    </>
  );
}