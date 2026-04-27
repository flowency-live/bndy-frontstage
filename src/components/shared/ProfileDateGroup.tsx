"use client";

import ProfileEventRow from "./ProfileEventRow";
import { Event } from "@/lib/types";

interface EventWithOptionalDistance extends Event {
  distance?: number;
}

interface ProfileDateGroupProps {
  day: string;        // "SAT 02"
  monthYear: string;  // "May 2026"
  relativeLabel?: string; // "Tomorrow", "In 8 days"
  events: EventWithOptionalDistance[];
  counterpartType: "artist" | "venue";
  isPast?: boolean;
  onEventClick: (event: Event) => void;
}

/**
 * ProfileDateGroup - Date header with events for profile pages
 *
 * Features:
 * - Sticky date header on mobile with backdrop blur
 * - Relative labels ("Tomorrow", "In 8 days")
 * - ProfileEventRow for each event
 *
 * Uses CSS classes from globals.css (.profile-date-*)
 */
export function ProfileDateGroup({
  day,
  monthYear,
  relativeLabel,
  events,
  counterpartType,
  isPast = false,
  onEventClick,
}: ProfileDateGroupProps) {
  return (
    <div className="profile-date-group">
      {/* Date label column (sticky on mobile) */}
      <div className="profile-date-label">
        <div className={`profile-date-day ${isPast ? "past" : ""}`}>{day}</div>
        <div className="profile-date-dow">{monthYear}</div>
        {relativeLabel && !isPast && (
          <div className="profile-date-when">{relativeLabel}</div>
        )}
      </div>

      {/* Events column */}
      <div className="profile-date-events">
        {events.map((event) => (
          <ProfileEventRow
            key={event.id}
            event={event}
            counterpartType={counterpartType}
            isPast={isPast}
            distance={event.distance}
            onClick={() => onEventClick(event)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Helper function to format date for display
 */
export function formatDateForGroup(dateString: string): {
  day: string;
  monthYear: string;
  relativeLabel?: string;
} {
  const date = new Date(dateString + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Day of week + date number (e.g., "SAT 02")
  const dayOfWeek = date.toLocaleDateString("en-GB", { weekday: "short" }).toUpperCase();
  const dateNum = date.getDate().toString().padStart(2, "0");
  const day = `${dayOfWeek} ${dateNum}`;

  // Month + year (e.g., "May 2026")
  const monthYear = date.toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });

  // Calculate relative label
  let relativeLabel: string | undefined;
  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    relativeLabel = "Today";
  } else if (diffDays === 1) {
    relativeLabel = "Tomorrow";
  } else if (diffDays > 1 && diffDays <= 7) {
    relativeLabel = `In ${diffDays} days`;
  } else if (diffDays > 7 && diffDays <= 14) {
    relativeLabel = "Next week";
  } else if (diffDays > 14) {
    const weeks = Math.floor(diffDays / 7);
    relativeLabel = `In ${weeks} weeks`;
  }

  return { day, monthYear, relativeLabel };
}

/**
 * Helper function to group events by date
 */
export function groupEventsByDate<T extends Event>(events: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>();

  // Sort events by date first
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  for (const event of sortedEvents) {
    const dateKey = event.date;
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(event);
  }

  // Sort events within each date by time
  for (const [, dateEvents] of grouped) {
    dateEvents.sort((a, b) => {
      const timeA = a.startTime || "00:00";
      const timeB = b.startTime || "00:00";
      return timeA.localeCompare(timeB);
    });
  }

  return grouped;
}

/**
 * Helper function to separate events into upcoming and past
 */
export function separateEvents<T extends Event>(
  events: T[]
): { upcoming: T[]; past: T[] } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  const upcoming: T[] = [];
  const past: T[] = [];

  for (const event of events) {
    if (event.date >= todayStr) {
      upcoming.push(event);
    } else {
      past.push(event);
    }
  }

  // Sort upcoming by date ascending, past by date descending
  upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return { upcoming, past };
}
