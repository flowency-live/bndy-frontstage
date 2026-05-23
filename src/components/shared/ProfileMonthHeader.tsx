"use client";

interface ProfileMonthHeaderProps {
  monthYear: string; // "JUNE 2026"
  eventCount: number;
}

/**
 * ProfileMonthHeader - Sticky month ribbon for event lists
 *
 * A bold, floating month indicator that stays visible while scrolling.
 * Gig-poster aesthetic with horizontal lines flanking the month name.
 */
export function ProfileMonthHeader({ monthYear, eventCount }: ProfileMonthHeaderProps) {
  return (
    <div className="profile-month-header">
      <span className="profile-month-name">{monthYear}</span>
      <span className="profile-month-count">
        {eventCount} {eventCount === 1 ? "gig" : "gigs"}
      </span>
    </div>
  );
}

export default ProfileMonthHeader;
