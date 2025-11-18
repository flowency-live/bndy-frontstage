// src/components/listview/EventRow.tsx
import { Ticket, ExternalLink } from "lucide-react";
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
  // Check if event has artist information
  const hasArtist = event.artistIds && event.artistIds.length > 0;

  return (
    <>
      {/* Date Column - always show when applicable */}
      <td className="px-2 py-2.5 whitespace-nowrap text-xs sm:text-sm border-b border-gray-200 dark:border-gray-700">
        {showFullDate && (
          <div className="font-medium text-[var(--foreground)]">
            {formatEventDate(new Date(event.date))}
          </div>
        )}
      </td>

      {/* Time Column */}
      <td className="px-2 py-2.5 whitespace-nowrap text-xs sm:text-sm border-b border-gray-200 dark:border-gray-700">
        <div className="font-medium text-[var(--foreground)]">
          {formatTime(event.startTime)}
        </div>
      </td>

      {/* Artist Column - Neon Orange */}
      <td className="px-2 py-2.5 border-b border-gray-200 dark:border-gray-700">
        {hasArtist && event.artistName && (
          <Link
            href={`/artists/${event.artistIds[0]}`}
            className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-md font-bold text-xs sm:text-sm neon-artist"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="truncate max-w-[120px] sm:max-w-none">{event.artistName}</span>
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
          </Link>
        )}
      </td>

      {/* Venue Column - Neon Cyan */}
      <td className="px-2 py-2.5 border-b border-gray-200 dark:border-gray-700">
        <Link
          href={`/venues/${event.venueId}`}
          className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-md font-bold text-xs sm:text-sm neon-venue"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="truncate max-w-[120px] sm:max-w-none">{event.venueName}</span>
          <ExternalLink className="w-3 h-3 flex-shrink-0" />
        </Link>
      </td>

      {/* Town Column - always show */}
      <td className="px-2 py-2.5 whitespace-nowrap text-xs sm:text-sm border-b border-gray-200 dark:border-gray-700">
        {event.venueCity && (
          <div className="text-[var(--muted-foreground)] truncate max-w-[100px] sm:max-w-none">{event.venueCity}</div>
        )}
      </td>

      {/* Price Column */}
      <td className="px-2 py-2.5 whitespace-nowrap text-center border-b border-gray-200 dark:border-gray-700">
        {event.ticketed ? (
          <div className="inline-flex items-center justify-center gap-1 text-[var(--foreground)]">
            <Ticket className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[var(--primary)]" />
            <span className="text-xs sm:text-sm hidden sm:inline">{event.ticketinformation || "Ticketed"}</span>
          </div>
        ) : (
          <span className="text-xs sm:text-sm font-bold text-[var(--secondary)]">Free</span>
        )}
      </td>
    </>
  );
}
