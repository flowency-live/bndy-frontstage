'use client';

/**
 * White-label list view component
 *
 * Displays events filtered by tenant's location config.
 * Uses isolated useWhitelabelEvents hook.
 */

import { useMemo } from 'react';
import { useWhitelabel } from './WhitelabelProvider';
import { useWhitelabelEvents, type WhitelabelEvent } from '@/lib/whitelabel/hooks/useWhitelabelEvents';
import { Calendar, MapPin, Clock, Music } from 'lucide-react';

// Get date range for next 8 weeks
function getDateRange() {
  const today = new Date();
  const startDate = today.toISOString().split('T')[0];

  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 56); // 8 weeks
  const endDateStr = endDate.toISOString().split('T')[0];

  return { startDate, endDate: endDateStr };
}

// Format date for display
function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

// Group events by date
function groupEventsByDate(events: WhitelabelEvent[]): Map<string, WhitelabelEvent[]> {
  const grouped = new Map<string, WhitelabelEvent[]>();

  for (const event of events) {
    const existing = grouped.get(event.date) || [];
    grouped.set(event.date, [...existing, event]);
  }

  return grouped;
}

export function WhitelabelList() {
  const { tenant } = useWhitelabel();
  const { startDate, endDate } = getDateRange();

  const { data: events, isLoading, error } = useWhitelabelEvents({
    center: tenant.location.center,
    radiusMiles: tenant.location.radiusMiles,
    startDate,
    endDate,
  });

  const groupedEvents = useMemo(() => {
    if (!events) return new Map();
    return groupEventsByDate(events);
  }, [events]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent"
          style={{ borderColor: tenant.theme.primary }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 px-4">
        <p className="text-center opacity-60">
          Unable to load events. Please try again later.
        </p>
      </div>
    );
  }

  if (!events?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 px-4">
        <Music className="w-12 h-12 mb-4 opacity-40" />
        <p className="text-center opacity-60">
          No upcoming events found within {tenant.location.radiusMiles} miles.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto">
      <div className="mb-4">
        <p className="text-sm opacity-60">
          Showing {events.length} events within {tenant.location.radiusMiles} miles
        </p>
      </div>

      <div className="space-y-6">
        {Array.from(groupedEvents.entries()).map(([date, dateEvents]) => (
          <div key={date}>
            {/* Date header */}
            <div
              className="flex items-center gap-2 mb-3 pb-2 border-b"
              style={{ borderColor: `${tenant.theme.primary}33` }}
            >
              <Calendar
                className="w-4 h-4"
                style={{ color: tenant.theme.primary }}
              />
              <h2
                className="font-semibold"
                style={{ color: tenant.theme.secondary }}
              >
                {formatDate(date)}
              </h2>
              <span className="text-xs opacity-60">
                ({dateEvents.length} event{dateEvents.length !== 1 ? 's' : ''})
              </span>
            </div>

            {/* Events for this date */}
            <div className="space-y-3">
              {dateEvents.map((event: WhitelabelEvent) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EventCard({ event }: { event: WhitelabelEvent }) {
  const { tenant } = useWhitelabel();

  return (
    <div
      className="p-4 rounded-lg border"
      style={{
        backgroundColor: `${tenant.theme.primary}11`,
        borderColor: `${tenant.theme.primary}33`,
      }}
    >
      {/* Event name */}
      <h3
        className="font-semibold mb-2"
        style={{ color: tenant.theme.foreground }}
      >
        {event.name}
      </h3>

      {/* Event details */}
      <div className="flex flex-wrap gap-4 text-sm opacity-80">
        {/* Time */}
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>{event.startTime}</span>
        </div>

        {/* Venue */}
        <div className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" />
          <span>{event.venueName}</span>
        </div>

        {/* Distance */}
        <div className="text-xs opacity-60">
          {event.distanceMiles.toFixed(1)} mi away
        </div>
      </div>

      {/* Artist if different from event name */}
      {event.artistName && event.artistName !== event.name && (
        <div
          className="mt-2 text-sm"
          style={{ color: tenant.theme.secondary }}
        >
          {event.artistName}
        </div>
      )}
    </div>
  );
}
