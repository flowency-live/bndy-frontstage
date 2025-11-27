"use client";

import { Event } from "@/lib/types";
import { Calendar } from "lucide-react";

interface AvailabilityTabProps {
  availability: Event[];
  loading?: boolean;
}

/**
 * AvailabilityTab - Display artist availability dates
 *
 * Features:
 * - List of available dates grouped by month
 * - Sorted by date (earliest first)
 * - Empty state with "Contact Us" message
 * - Loading skeleton
 */
export default function AvailabilityTab({ availability, loading }: AvailabilityTabProps) {
  if (loading) {
    return (
      <div
        role="tabpanel"
        id="availability-panel"
        aria-labelledby="availability-tab"
        style={{ backgroundColor: 'var(--muted)' }}
        className="container mx-auto px-4 py-4"
      >
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-background rounded w-32"></div>
          <div className="space-y-2">
            <div className="h-12 bg-background rounded"></div>
            <div className="h-12 bg-background rounded"></div>
            <div className="h-12 bg-background rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Group availability by month
  const groupedByMonth = availability.reduce((groups, event) => {
    const date = new Date(event.date);
    const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    groups[monthYear].push(event);
    return groups;
  }, {} as Record<string, Event[]>);

  // Sort each month's events by date
  Object.keys(groupedByMonth).forEach(month => {
    groupedByMonth[month].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  });

  // Sort months chronologically
  const sortedMonths = Object.keys(groupedByMonth).sort((a, b) => {
    const dateA = new Date(groupedByMonth[a][0].date);
    const dateB = new Date(groupedByMonth[b][0].date);
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <div
      role="tabpanel"
      id="availability-panel"
      aria-labelledby="availability-tab"
      style={{ backgroundColor: 'var(--muted)' }}
      className="container mx-auto px-4 py-4"
    >
      {availability.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <Calendar className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No Upcoming Availability
          </h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            This artist hasn't listed any available dates yet. Contact them directly to inquire about bookings.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedMonths.map(monthYear => (
            <div key={monthYear} className="space-y-3">
              {/* Month Header */}
              <h3 className="text-lg font-semibold text-foreground sticky top-0 py-2" style={{ backgroundColor: 'var(--muted)' }}>
                {monthYear}
              </h3>

              {/* Availability List for Month */}
              <div className="space-y-2">
                {groupedByMonth[monthYear].map(event => {
                  const date = new Date(event.date);
                  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
                  const dayOfMonth = date.getDate();
                  const suffix = getDaySuffix(dayOfMonth);

                  return (
                    <div
                      key={event.id}
                      style={{ backgroundColor: 'var(--background)' }}
                      className="flex items-center gap-3 p-3 rounded-lg border border-blue-200 dark:border-blue-800"
                    >
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-500 dark:bg-blue-600 flex flex-col items-center justify-center text-white">
                        <span className="text-xs font-medium">{date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</span>
                        <span className="text-lg font-bold leading-none">{dayOfMonth}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">
                          {dayOfWeek}, {dayOfMonth}{suffix}
                        </p>
                        {event.notes && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {event.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper function to get day suffix (1st, 2nd, 3rd, etc.)
function getDaySuffix(day: number): string {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}
