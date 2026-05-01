// src/components/listview/EventRowV2.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { TicketStub } from "./TicketStub";
import { formatTime } from "@/lib/utils/date-utils";
import { formatDistance, getDistanceClass, type EventWithDistance } from "@/hooks/useEventsForList";
import { formatArtistDisplay } from "@/lib/utils/artist-display";

interface EventRowV2Props {
  event: EventWithDistance;
  index: number;
  onClick: () => void;
  artistImageUrl?: string | null;
  artistDisplayColour?: string | null;
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = ["#ff7a3d", "#3ce0e0", "#86eb8e", "#ff6b9d", "#a78bfa", "#fbbf24", "#60a5fa"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function EventRowV2({ event, index, onClick, artistImageUrl, artistDisplayColour }: EventRowV2Props) {
  const [imageError, setImageError] = useState(false);
  const hasArtist = event.artistIds && event.artistIds.length > 0;
  const isFree = !event.ticketed;
  const price = event.ticketinformation || null;
  const distanceClass = getDistanceClass(event.distanceMiles);
  const artistDisplayName = formatArtistDisplay(event);
  const primaryArtistName = event.artistName || event.name || "Live Music";
  const initials = getInitials(primaryArtistName);
  const avatarColor = artistDisplayColour || getAvatarColor(primaryArtistName);
  const showImage = artistImageUrl && !imageError;

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

      {/* Avatar - mobile only */}
      <div
        className="ev-avatar"
        style={{ backgroundColor: showImage ? 'transparent' : avatarColor }}
      >
        {showImage ? (
          <Image
            src={artistImageUrl}
            alt={primaryArtistName}
            width={44}
            height={44}
            className="ev-avatar-img"
            onError={() => setImageError(true)}
            unoptimized
          />
        ) : (
          initials
        )}
      </div>

      {/* Time */}
      <span className="ev-time">{formatTime(event.startTime)}</span>

      {/* Headline: Artist · Venue - shows "Artist1 + N more" for multi-artist */}
      <div className="ev-headline">
        {hasArtist ? (
          <Link
            href={`/artists/${event.artistIds[0]}`}
            className="ev-artist"
            onClick={(e) => e.stopPropagation()}
          >
            {artistDisplayName}
          </Link>
        ) : (
          <span className="ev-artist">{artistDisplayName}</span>
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
