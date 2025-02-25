// src/components/listview/EventCard.tsx
import { Ticket, Star } from "lucide-react";
import { formatTime } from "@/lib/utils/date-utils";
import type { Event } from "@/lib/types";

export function EventCard({ event }: { event: Event }) {
  return (
    <div className="event-card">
      <div className="font-bold text-[var(--primary)]">{event.name}</div>
      <div className="text-sm">{event.venueName}</div>
      <div className="mt-2 flex justify-between items-center">
        <div className="text-sm font-medium">{formatTime(event.startTime)}</div>
        {event.ticketPrice ? (
          <div className="flex items-center text-sm">
            <Ticket className="w-4 h-4 mr-1 text-[var(--primary)]" />
            {event.ticketPrice}
          </div>
        ) : (
          <div className="flex items-center text-sm">
            <Star className="w-4 h-4 mr-1 text-[var(--secondary)]" />
            Free
          </div>
        )}
      </div>
    </div>
  );
}