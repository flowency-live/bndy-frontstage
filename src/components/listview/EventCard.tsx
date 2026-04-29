// src/components/listview/EventCard.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { formatTime } from "@/lib/utils/date-utils";
import { formatDistance, type EventWithDistance } from "@/hooks/useEventsForList";
import { useArtist } from "@/hooks/useArtist";

interface EventCardProps {
  event: EventWithDistance;
  onClick: () => void;
}

export function EventCard({ event, onClick }: EventCardProps) {
  const hasArtist = event.artistIds && event.artistIds.length > 0;
  const artistId = hasArtist ? event.artistIds[0] : undefined;
  const { data: artist } = useArtist(artistId);

  const artistName = event.artistName || event.name || "Live Music";
  const isFree = !event.ticketed;
  const price = event.ticketinformation || null;
  const profileImageUrl = artist?.profileImageUrl;

  return (
    <div className="lv-event-card" onClick={onClick}>
      {/* Header: Avatar + Artist/Venue */}
      <div className="lv-card-header">
        {/* Avatar - only show if profile image exists */}
        {profileImageUrl && (
          <Image
            src={profileImageUrl}
            alt={artistName}
            width={40}
            height={40}
            className="lv-card-avatar"
          />
        )}

        {/* Names */}
        <div className="lv-card-names">
          {/* Artist */}
          {hasArtist ? (
            <Link
              href={`/artists/${event.artistIds[0]}`}
              className="lv-card-artist"
              onClick={(e) => e.stopPropagation()}
            >
              {artistName}
            </Link>
          ) : (
            <span className="lv-card-artist">{artistName}</span>
          )}

          {/* Venue */}
          <Link
            href={`/venues/${event.venueId}`}
            className="lv-card-venue"
            onClick={(e) => e.stopPropagation()}
          >
            {event.venueName}
          </Link>
        </div>
      </div>

      {/* Meta: Location + Time */}
      <div className="lv-card-meta">
        <span className="lv-card-location">
          {event.venueCity}
          {event.distanceMiles !== null && (
            <span className="lv-card-distance">
              {formatDistance(event.distanceMiles)}
            </span>
          )}
        </span>
        <span className="lv-card-time">{formatTime(event.startTime)}</span>
      </div>

      {/* Price Badge */}
      <div className={`lv-card-badge ${isFree ? "" : "paid"}`}>
        {isFree ? "Free" : price || "Tickets"}
        <span className="lv-card-badge-arrow">›</span>
      </div>
    </div>
  );
}
