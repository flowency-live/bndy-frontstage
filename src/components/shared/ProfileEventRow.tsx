"use client";

import Link from "next/link";
import { Event } from "@/lib/types";

interface ProfileEventRowProps {
  event: Event;
  counterpartType: "artist" | "venue";
  isPast?: boolean;
  onClick?: () => void;
  distance?: number;
}

/**
 * ProfileEventRow - Event row for profile pages (artist & venue)
 *
 * On artist profile: shows venue as counterpart (cyan)
 * On venue profile: shows artist as counterpart (orange)
 *
 * Uses CSS classes from globals.css (.profile-ev-*)
 */
export default function ProfileEventRow({
  event,
  counterpartType,
  isPast = false,
  onClick,
  distance,
}: ProfileEventRowProps) {
  // Determine counterpart name and link
  const counterpartName = counterpartType === "venue"
    ? event.venueName
    : event.artistName || "Unknown Artist";

  const counterpartLink = counterpartType === "venue"
    ? `/venues/${event.venueId}`
    : event.artistIds?.[0] ? `/artists/${event.artistIds[0]}` : null;

  // Format time (24hr format)
  const formattedTime = event.startTime?.slice(0, 5) || "";

  // Determine ticket display - Event uses 'price' field
  const priceValue = event.price;
  const isFree = !event.ticketed || priceValue === "Free" || priceValue === "0" || !priceValue;
  const ticketDisplay = isFree ? "£ree" : priceValue || "TBC";

  // Format distance if provided
  const formatDistance = (dist: number) => {
    if (dist < 1) return "<1 mi";
    return `${Math.round(dist)} mi`;
  };

  const distanceClass = distance !== undefined
    ? distance < 3 ? "very-near" : distance < 10 ? "near" : ""
    : "";

  // Handle row click (for overlay)
  const handleRowClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking the counterpart link
    if ((e.target as HTMLElement).closest("a[data-counterpart]")) {
      return;
    }
    onClick?.();
  };

  return (
    <div
      className={`profile-ev ${isPast ? "past" : ""}`}
      onClick={handleRowClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* Clickable overlay for the whole row */}
      <div className="profile-ev-link" aria-hidden="true" />

      {/* Time */}
      <span className="profile-ev-time">{formattedTime}</span>

      {/* Headline with counterpart */}
      <div className="profile-ev-headline">
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

      {/* Meta: town/genres and distance */}
      <div className="profile-ev-meta">
        {counterpartType === "venue" ? (
          // Artist profile: show venue city + distance
          <>
            {event.venueCity && (
              <span className="profile-ev-town">{event.venueCity}</span>
            )}
            {event.venueCity && distance !== undefined && (
              <span className="profile-ev-dot">·</span>
            )}
            {distance !== undefined && (
              <span className={`profile-ev-dist ${distanceClass}`}>
                {formatDistance(distance)}
              </span>
            )}
          </>
        ) : (
          // Venue profile: show artist genres if available
          <span className="profile-ev-genres">
            {/* Genres would come from artist data - placeholder */}
          </span>
        )}
      </div>

      {/* Ticket stub */}
      <span className={`profile-ev-stub ${isFree ? "" : "paid"}`}>
        {ticketDisplay}
      </span>
    </div>
  );
}
