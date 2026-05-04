"use client";

import Link from "next/link";
import { Event } from "@/lib/types";
import { formatArtistDisplay } from "@/lib/utils/artist-display";
import { format } from "date-fns";

interface FeaturedEventCardProps {
  event: Event;
  counterpartType: "artist" | "venue";
  onClick?: () => void;
  distance?: number;
}

/**
 * FeaturedEventCard - Elevated card for the "next event" on profile pages
 *
 * Features:
 * - Elevated card with border, shadow, and prominent left accent
 * - Larger typography than regular event rows
 * - Full event details: date, time, venue/artist, location, ticket info
 *
 * Uses CSS class .profile-featured-ev from globals.css
 */
export default function FeaturedEventCard({
  event,
  counterpartType,
  onClick,
  distance,
}: FeaturedEventCardProps) {
  // Determine counterpart name and link
  const counterpartName = counterpartType === "venue"
    ? event.venueName
    : formatArtistDisplay(event);

  const counterpartLink = counterpartType === "venue"
    ? `/venues/${event.venueId}`
    : event.artistIds?.[0] ? `/artists/${event.artistIds[0]}` : null;

  // Format date and time
  const eventDate = new Date(event.date);
  const formattedDate = format(eventDate, "EEE, d MMM yyyy");
  const formattedTime = event.startTime?.slice(0, 5) || "";

  // Determine ticket display - strip "From " prefix
  const rawPrice = event.price;
  const priceValue = rawPrice?.replace(/^from\s+/i, '');
  const isFree = !event.ticketed || priceValue === "Free" || priceValue === "0" || !priceValue;
  const ticketDisplay = isFree ? "Free" : priceValue || "Tickets";

  // Format distance if provided
  const formatDistance = (dist: number) => {
    if (dist < 1) return "<1 mi";
    return `${Math.round(dist)} mi`;
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking the counterpart link
    if ((e.target as HTMLElement).closest("a[data-counterpart]")) {
      return;
    }
    onClick?.();
  };

  return (
    <div
      className="profile-featured-ev"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* Date and time row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-medium text-[var(--lv-text)]">
            {formattedDate}
          </span>
          <span className="text-[var(--lv-text-3)]">at</span>
          <span className="font-mono text-sm font-medium text-[var(--lv-text-2)]">
            {formattedTime}
          </span>
        </div>
        {distance !== undefined && (
          <span className="font-mono text-xs text-[var(--lv-cyan)]">
            {formatDistance(distance)}
          </span>
        )}
      </div>

      {/* Counterpart (artist or venue) */}
      <div className="mb-2">
        {counterpartLink ? (
          <Link
            href={counterpartLink}
            className={`profile-ev-counterpart ${counterpartType}`}
            data-counterpart="true"
            onClick={(e) => e.stopPropagation()}
          >
            {counterpartName}
          </Link>
        ) : (
          <span className={`profile-ev-counterpart ${counterpartType}`}>
            {counterpartName}
          </span>
        )}
      </div>

      {/* Location and ticket info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {counterpartType === "venue" && event.venueCity && (
            <span className="font-mono text-xs text-[var(--lv-text-2)] tracking-wide">
              {event.venueCity}
            </span>
          )}
        </div>
        <span className={`profile-ev-stub ${isFree ? "" : "paid"}`}>
          {ticketDisplay}
        </span>
      </div>
    </div>
  );
}
