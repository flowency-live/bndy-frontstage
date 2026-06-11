// src/components/listview/EventCard.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatTime } from "@/lib/utils/date-utils";
import { formatDistance, type EventWithDistance } from "@/hooks/useEventsForList";
import { formatArtistDisplay } from "@/lib/utils/artist-display";

interface EventCardProps {
  event: EventWithDistance;
  onClick: () => void;
  artistImageUrl?: string | null;
  artistDisplayColour?: string | null;
}

/**
 * Get initials from artist name (max 2 characters)
 */
function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function EventCard({ event, onClick, artistImageUrl }: EventCardProps) {
  const [imageError, setImageError] = useState(false);
  const hasArtist = event.artistIds && event.artistIds.length > 0;
  // Use formatArtistDisplay to show "Artist1 + N more" for multi-artist events
  const artistDisplayName = formatArtistDisplay(event);
  const primaryArtistName = event.artistName || event.name || "Live Music";
  const initials = getInitials(primaryArtistName);
  const isFree = !event.ticketed;
  const isTonight =
    event.date.slice(0, 10) === new Date().toLocaleDateString("en-CA");
  const price = event.ticketinformation || null;

  // Show image if URL provided and no error loading it
  const showImage = artistImageUrl && !imageError;

  return (
    <div className="lv-event-card" onClick={onClick}>
      {/* Ticket Stub - top right */}
      <span className={`lv-card-stub ${isFree ? "" : "paid"}`}>
        {isFree ? "£ree" : price || "TBC"}
      </span>

      {/* Large Avatar */}
      <div className="lv-card-avatar">
        {showImage ? (
          <Image
            src={artistImageUrl}
            alt={primaryArtistName}
            width={64}
            height={64}
            className="lv-card-avatar-img"
            onError={() => setImageError(true)}
            unoptimized
          />
        ) : (
          initials
        )}
      </div>

      {/* Info section */}
      <div className="lv-card-info">
        {/* Artist */}
        {hasArtist ? (
          <Link
            href={`/artists/${event.artistIds[0]}`}
            className="lv-card-artist"
            onClick={(e) => e.stopPropagation()}
          >
            {artistDisplayName}
          </Link>
        ) : (
          <span className="lv-card-artist">{artistDisplayName}</span>
        )}
        {isTonight && <span className="bndy-tonight">Tonight</span>}

        {/* Venue */}
        <Link
          href={`/venues/${event.venueId}`}
          className="lv-card-venue"
          onClick={(e) => e.stopPropagation()}
        >
          {event.venueName}
        </Link>

        {/* Meta: Location · Distance · Time */}
        <div className="lv-card-meta">
          <span className="lv-card-town">{event.venueCity}</span>
          {event.distanceMiles !== null && (
            <span className="lv-card-distance">
              {formatDistance(event.distanceMiles)}
            </span>
          )}
          <span className="lv-card-time">{formatTime(event.startTime)}</span>
        </div>
      </div>
    </div>
  );
}
