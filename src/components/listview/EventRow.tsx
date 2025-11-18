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
      {/* Date Column (desktop only) */}
      <td className="px-3 py-2.5 whitespace-nowrap text-sm border-b border-gray-200 dark:border-gray-700 hidden md:table-cell">
        {showFullDate && (
          <div className="font-medium text-[var(--foreground)]">
            {formatEventDate(new Date(event.date))}
          </div>
        )}
      </td>

      {/* Time Column */}
      <td className="px-3 py-2.5 whitespace-nowrap text-sm border-b border-gray-200 dark:border-gray-700">
        <div className="font-medium text-[var(--foreground)]">
          {formatTime(event.startTime)}
        </div>
      </td>

      {/* Artist Column - Neon Orange */}
      <td className="px-3 py-2.5 border-b border-gray-200 dark:border-gray-700">
        {hasArtist && event.artistName && (
          <Link
            href={`/artists/${event.artistIds[0]}`}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-bold text-sm neon-artist"
            onClick={(e) => e.stopPropagation()}
          >
            {event.artistName}
            <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </td>

      {/* Venue Column - Neon Cyan */}
      <td className="px-3 py-2.5 border-b border-gray-200 dark:border-gray-700">
        <Link
          href={`/venues/${event.venueId}`}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-bold text-sm neon-venue"
          onClick={(e) => e.stopPropagation()}
        >
          {event.venueName}
          <ExternalLink className="w-3 h-3" />
        </Link>
      </td>

      {/* Town Column (desktop only) */}
      <td className="px-3 py-2.5 whitespace-nowrap text-sm border-b border-gray-200 dark:border-gray-700 hidden lg:table-cell">
        {event.venueCity && (
          <div className="text-[var(--muted-foreground)]">{event.venueCity}</div>
        )}
      </td>

      {/* Price Column */}
      <td className="px-3 py-2.5 whitespace-nowrap text-center border-b border-gray-200 dark:border-gray-700">
        {event.ticketed ? (
          <div className="inline-flex items-center justify-center gap-1 text-[var(--foreground)]">
            <Ticket className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span className="text-sm hidden sm:inline">{event.ticketinformation || "Ticketed"}</span>
          </div>
        ) : (
          <span className="text-sm font-bold text-[var(--secondary)]">Free</span>
        )}
      </td>
    </>
  );
}
