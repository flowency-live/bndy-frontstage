// src/components/listview/EventRow.tsx
import { Ticket, Map } from "lucide-react";
import { formatEventDate, formatTime } from "@/lib/utils/date-utils";
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

  return (
    <tr className="event-row hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
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
        <div className="sm:hidden text-xs text-gray-500 dark:text-gray-400">{event.venueName}</div>
      </td>
      <td className="px-2 sm:px-4 py-3 text-sm text-[var(--foreground)] hidden sm:table-cell border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <span>{event.venueName}</span>
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
        {event.ticketPrice ? (
          <div className="flex items-center justify-center">
            <Ticket className="w-4 h-4 mr-1 text-[var(--primary)]" />
            <span className="text-xs text-[var(--foreground)]">{event.ticketPrice}</span>
          </div>
        ) : (
          <span className="text-xs font-medium text-[var(--secondary)]">£ree</span>
        )}
      </td>
    </tr>
  );
}