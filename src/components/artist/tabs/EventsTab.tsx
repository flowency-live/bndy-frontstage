"use client";

import { useState } from "react";
import EventsList from "../EventsList";
import { Event } from "@/lib/types";
import { Calendar, MapPin } from "lucide-react";

interface EventsTabProps {
  events: Event[];
  artistLocation?: string;
}

type SortMode = 'date' | 'distance';

/**
 * EventsTab - Wrapper for events list with sort toggle
 *
 * Features:
 * - Toggle between "By Date" (month grouping) and "By Distance" (5mi range grouping)
 * - Pill-style toggle buttons with orange active border
 * - Default: By Date
 */
export default function EventsTab({ events, artistLocation }: EventsTabProps) {
  const [sortMode, setSortMode] = useState<SortMode>('date');

  return (
    <div role="tabpanel" id="events-panel" aria-labelledby="events-tab" style={{ backgroundColor: 'var(--muted)' }} className="container mx-auto px-4 py-4">
      {/* Sort Toggle */}
      <div className="mb-3 flex justify-center">
        <div style={{ backgroundColor: 'var(--muted)' }} className="inline-flex gap-2 p-1.5 rounded-full">
          <button
            onClick={() => setSortMode('date')}
            style={{
              backgroundColor: sortMode === 'date' ? 'var(--background)' : 'transparent',
              borderColor: sortMode === 'date' ? 'var(--primary)' : 'transparent',
              color: sortMode === 'date' ? 'var(--foreground)' : 'var(--muted-foreground)',
            }}
            className="flex items-center gap-2 px-4 py-2 font-medium text-sm transition-all rounded-full border-2"
            aria-pressed={sortMode === 'date'}
          >
            <Calendar className="w-4 h-4" />
            <span>By Date</span>
          </button>
          <button
            onClick={() => setSortMode('distance')}
            style={{
              backgroundColor: sortMode === 'distance' ? 'var(--background)' : 'transparent',
              borderColor: sortMode === 'distance' ? 'var(--primary)' : 'transparent',
              color: sortMode === 'distance' ? 'var(--foreground)' : 'var(--muted-foreground)',
            }}
            className="flex items-center gap-2 px-4 py-2 font-medium text-sm transition-all rounded-full border-2"
            aria-pressed={sortMode === 'distance'}
          >
            <MapPin className="w-4 h-4" />
            <span>By Distance</span>
          </button>
        </div>
      </div>

      {/* Events List */}
      <EventsList
        events={events}
        artistLocation={artistLocation}
        hideDistanceFilter={true}
        sortBy={sortMode}
      />
    </div>
  );
}
