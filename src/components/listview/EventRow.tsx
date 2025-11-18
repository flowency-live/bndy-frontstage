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
      {/* MOBILE: 3 Column Layout */}
      {/* Column 1: Date & Time */}
      <td className="px-2 py-2.5 whitespace-nowrap text-xs border-b border-gray-200 dark:border-gray-700 md:hidden">
        {showFullDate && (
          <div className="font-medium text-[var(--foreground)] mb-1">
            {formatEventDate(new Date(event.date))}
          </div>
        )}
        <div className="font-medium text-[var(--foreground)]">
          {formatTime(event.startTime)}
        </div>
      </td>

      {/* Column 2: Artist & Venue */}
      <td className="px-2 py-2.5 border-b border-gray-200 dark:border-gray-700 md:hidden">
        <div className="flex flex-col gap-1">
          {hasArtist && event.artistName && (
            <Link
              href={`/artists/${event.artistIds[0]}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-xs neon-artist w-fit"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="truncate max-w-[140px]">{event.artistName}</span>
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </Link>
          )}
          <Link
            href={`/venues/${event.venueId}`}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-xs neon-venue w-fit"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="truncate max-w-[140px]">{event.venueName}</span>
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
          </Link>
        </div>
      </td>

      {/* Column 3: Town & Price */}
      <td className="px-2 py-2.5 whitespace-nowrap text-xs border-b border-gray-200 dark:border-gray-700 md:hidden">
        {event.venueCity && (
          <div className="text-[var(--muted-foreground)] mb-1 truncate max-w-[100px]">
            {event.venueCity}
          </div>
        )}
        {event.ticketed ? (
          <div className="inline-flex items-center gap-1 text-[var(--foreground)]">
            <Ticket className="w-3 h-3 text-[var(--primary)]" />
            <span className="text-xs truncate max-w-[80px]">{event.ticketinformation || "Ticket"}</span>
          </div>
        ) : (
          <span className="text-xs font-bold text-[var(--secondary)]">Free</span>
        )}
      </td>

      {/* DESKTOP: 6 Column Layout */}
      {/* Date Column */}
      <td className="px-2 py-2.5 whitespace-nowrap text-sm border-b border-gray-200 dark:border-gray-700 hidden md:table-cell">
        {showFullDate && (
          <div className="font-medium text-[var(--foreground)]">
            {formatEventDate(new Date(event.date))}
          </div>
        )}
      </td>

      {/* Time Column */}
      <td className="px-2 py-2.5 whitespace-nowrap text-sm border-b border-gray-200 dark:border-gray-700 hidden md:table-cell">
        <div className="font-medium text-[var(--foreground)]">
          {formatTime(event.startTime)}
        </div>
      </td>

      {/* Artist Column - Neon Orange */}
      <td className="px-2 py-2.5 border-b border-gray-200 dark:border-gray-700 hidden md:table-cell">
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
      <td className="px-2 py-2.5 border-b border-gray-200 dark:border-gray-700 hidden md:table-cell">
        <Link
          href={`/venues/${event.venueId}`}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-bold text-sm neon-venue"
          onClick={(e) => e.stopPropagation()}
        >
          {event.venueName}
          <ExternalLink className="w-3 h-3" />
        </Link>
      </td>

      {/* Town Column */}
      <td className="px-2 py-2.5 whitespace-nowrap text-sm border-b border-gray-200 dark:border-gray-700 hidden md:table-cell">
        {event.venueCity && (
          <div className="text-[var(--muted-foreground)]">{event.venueCity}</div>
        )}
      </td>

      {/* Price Column */}
      <td className="px-2 py-2.5 whitespace-nowrap text-center border-b border-gray-200 dark:border-gray-700 hidden md:table-cell">
        {event.ticketed ? (
          <div className="inline-flex items-center justify-center gap-1 text-[var(--foreground)]">
            <Ticket className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span className="text-sm">{event.ticketinformation || "Ticketed"}</span>
          </div>
        ) : (
          <span className="text-sm font-bold text-[var(--secondary)]">Free</span>
        )}
      </td>
    </>
  );
}
