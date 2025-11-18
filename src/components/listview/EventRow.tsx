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
      {/* Date & Time Column */}
      <td className="px-3 py-2.5 whitespace-nowrap text-sm border-b border-gray-200 dark:border-gray-700">
        {showFullDate ? (
          <div>
            <div className="font-medium text-[var(--foreground)]">{formatEventDate(new Date(event.date))}</div>
            <div className="text-xs text-[var(--foreground)]/60">{formatTime(event.startTime)}</div>
          </div>
        ) : (
          <div className="font-medium text-[var(--foreground)]">{formatTime(event.startTime)}</div>
        )}
      </td>

      {/* Event Column */}
      <td className="px-3 py-2.5 border-b border-gray-200 dark:border-gray-700">
        {/* Custom title if exists */}
        {event.hasCustomTitle && (
          <div className="font-semibold text-[var(--foreground)] mb-1.5">{event.name}</div>
        )}

        {/* Artist name with subtle orange background */}
        {hasArtist && event.artistName && (
          <div className="inline-block">
            <Link
              href={`/artists/${event.artistIds[0]}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded hover:underline font-medium"
              style={{ backgroundColor: 'var(--primary-translucent)', color: 'var(--foreground)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {event.artistName}
              <ExternalLink className="w-3 h-3 opacity-40" />
            </Link>
          </div>
        )}

        {/* Venue name on mobile with subtle cyan background */}
        <div className="sm:hidden mt-1.5">
          <div className="inline-block">
            <Link
              href={`/venues/${event.venueId}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded hover:underline font-medium text-sm"
              style={{ backgroundColor: 'var(--secondary-translucent)', color: 'var(--foreground)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {event.venueName}
              <ExternalLink className="w-3 h-3 opacity-40" />
            </Link>
          </div>
          {event.venueCity && (
            <div className="text-xs text-[var(--muted-foreground)] mt-1 ml-2">{event.venueCity}</div>
          )}
        </div>
      </td>

      {/* Venue Column (desktop only) with subtle cyan background */}
      <td className="px-3 py-2.5 hidden sm:table-cell border-b border-gray-200 dark:border-gray-700">
        <div className="inline-block">
          <Link
            href={`/venues/${event.venueId}`}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded hover:underline font-medium text-sm"
            style={{ backgroundColor: 'var(--secondary-translucent)', color: 'var(--foreground)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {event.venueName}
            <ExternalLink className="w-3 h-3 opacity-40" />
          </Link>
        </div>
        {event.venueCity && (
          <div className="text-xs text-[var(--muted-foreground)] mt-1 ml-2">{event.venueCity}</div>
        )}
      </td>

      {/* Price Column */}
      <td className="px-3 py-2.5 whitespace-nowrap text-center border-b border-gray-200 dark:border-gray-700">
        {event.ticketed ? (
          <div className="inline-flex items-center gap-1 text-[var(--foreground)]">
            <Ticket className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span className="text-sm">{event.ticketinformation || "Ticketed"}</span>
          </div>
        ) : (
          <span className="text-sm font-medium text-[var(--secondary)]">Free</span>
        )}
      </td>
    </>
  );
}
