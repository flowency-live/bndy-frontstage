// src/components/listview/EventRow.tsx
import { Ticket, Star } from "lucide-react";
import { formatEventDate, formatTime } from "@/lib/utils/date-utils";
import type { Event } from "@/lib/types";

export function EventRow({ 
  event, 
  showFullDate = false 
}: { 
  event: Event;
  showFullDate?: boolean;
}) {
  return (
    <tr className="event-row">
      <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-sm text-[var(--foreground)]">
        {showFullDate ? (
          <div>
            <div>{formatEventDate(new Date(event.date))}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{formatTime(event.startTime)}</div>
          </div>
        ) : (
          formatTime(event.startTime)
        )}
      </td>
      <td className="px-2 sm:px-4 py-3 text-sm">
        <div className="font-medium text-[var(--primary)]">{event.name}</div>
        <div className="sm:hidden text-xs text-gray-500 dark:text-gray-400">{event.venueName}</div>
      </td>
      <td className="px-2 sm:px-4 py-3 text-sm text-[var(--foreground)] hidden sm:table-cell">
        {event.venueName}
      </td>
      <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-center">
        {event.ticketPrice ? (
          <Ticket className="w-4 h-4 mx-auto text-[var(--primary)]" />
        ) : (
          <Star className="w-4 h-4 mx-auto text-[var(--secondary)]" />
        )}
      </td>
    </tr>
  );
}