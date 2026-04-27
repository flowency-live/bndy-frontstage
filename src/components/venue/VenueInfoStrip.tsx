"use client";

interface VenueInfoStripProps {
  venueType?: string;
  capacity?: number | string;
  avgDoor?: string;
  standardTicketed?: boolean;
}

/**
 * VenueInfoStrip - 3-column info strip for venue profile pages
 *
 * Shows: Type | Capacity | Avg Door
 * Gracefully handles missing data
 * Stacks to single column on mobile
 *
 * Uses CSS classes from globals.css (.profile-vinfo-*)
 */
export default function VenueInfoStrip({
  venueType,
  capacity,
  avgDoor,
  standardTicketed,
}: VenueInfoStripProps) {
  // Determine average door price display
  const doorDisplay = avgDoor
    ? avgDoor
    : standardTicketed === false
      ? "£ree Entry"
      : "Varies";

  // Format capacity
  const capacityDisplay = capacity
    ? typeof capacity === "number"
      ? `~ ${capacity}`
      : capacity
    : "—";

  // Format venue type
  const typeDisplay = venueType || "Live Music Venue";

  return (
    <div className="profile-vinfo">
      <div className="profile-vinfo-cell">
        <div className="profile-vinfo-label">Type</div>
        <div className="profile-vinfo-value">{typeDisplay}</div>
      </div>
      <div className="profile-vinfo-cell">
        <div className="profile-vinfo-label">Capacity</div>
        <div className="profile-vinfo-value">{capacityDisplay}</div>
      </div>
      <div className="profile-vinfo-cell">
        <div className="profile-vinfo-label">Avg. Door</div>
        <div className={`profile-vinfo-value ${doorDisplay === "£ree Entry" ? "cyan" : ""}`}>
          {doorDisplay}
        </div>
      </div>
    </div>
  );
}
