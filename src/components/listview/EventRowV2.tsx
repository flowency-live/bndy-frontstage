// src/components/listview/EventRowV2.tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { TicketStub } from "./TicketStub";
import { formatTime } from "@/lib/utils/date-utils";
import { formatDistance, getDistanceClass, type EventWithDistance } from "@/hooks/useEventsForList";

interface EventRowV2Props {
  event: EventWithDistance;
  index: number;
  onClick: () => void;
}

export function EventRowV2({ event, index, onClick }: EventRowV2Props) {
  const hasArtist = event.artistIds && event.artistIds.length > 0;
  const isFree = !event.ticketed;
  const price = event.ticketinformation || null;
  const distanceClass = getDistanceClass(event.distanceMiles);

  return (
    <motion.div
      className="ev"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: index * 0.05,
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileTap={{
        scale: 0.98,
        transition: { duration: 0.1 }
      }}
      onClick={onClick}
    >
      {/* Full-row clickable overlay */}
      <span className="ev-link" aria-label="View event details" />

      {/* Time */}
      <span className="ev-time">{formatTime(event.startTime)}</span>

      {/* Headline: Artist · Venue */}
      <div className="ev-headline">
        {hasArtist && event.artistName ? (
          <Link
            href={`/artists/${event.artistIds[0]}`}
            className="ev-artist"
            onClick={(e) => e.stopPropagation()}
          >
            {event.artistName}
          </Link>
        ) : (
          <span className="ev-artist">{event.name}</span>
        )}
        <span className="ev-sep">·</span>
        <Link
          href={`/venues/${event.venueId}`}
          className="ev-venue"
          onClick={(e) => e.stopPropagation()}
        >
          {event.venueName}
        </Link>
      </div>

      {/* Meta: Town · Distance */}
      <div className="ev-meta">
        {event.venueCity && (
          <>
            <span className="ev-town">{event.venueCity}</span>
            {event.distanceMiles !== null && <span className="ev-dot">·</span>}
          </>
        )}
        {event.distanceMiles !== null && (
          <span className={`ev-dist ${distanceClass}`}>
            {formatDistance(event.distanceMiles)}
          </span>
        )}
      </div>

      {/* Ticket Stub */}
      <TicketStub price={price} isFree={isFree} />
    </motion.div>
  );
}
