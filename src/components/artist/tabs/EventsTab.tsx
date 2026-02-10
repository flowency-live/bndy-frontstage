"use client";

import { useState } from "react";
import EventsList from "../EventsList";
import ArtistEventsMap from "../ArtistEventsMap";
import { Event } from "@/lib/types";
import { Calendar, MapPin, Map } from "lucide-react";

interface EventsTabProps {
  events: Event[];
  artistLocation?: string;
}

type ViewMode = 'date' | 'distance' | 'map';

/**
 * EventsTab - Wrapper for events list/map with view toggle
 *
 * Features:
 * - Toggle between "By Date" (month grouping), "By Distance" (5mi range grouping), and "Map" view
 * - Pill-style toggle buttons with orange active border
 * - Default: By Date
 */
export default function EventsTab({ events, artistLocation }: EventsTabProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('date');

  const getButtonStyle = (mode: ViewMode) => ({
    backgroundColor: viewMode === mode ? 'var(--background)' : 'transparent',
    borderColor: viewMode === mode ? 'var(--primary)' : 'transparent',
    color: viewMode === mode ? 'var(--foreground)' : 'var(--muted-foreground)',
  });

  return (
    <div role="tabpanel" id="events-panel" aria-labelledby="events-tab" style={{ backgroundColor: 'var(--muted)' }} className="container mx-auto px-4 py-4">
      {/* View Toggle */}
      <div className="mb-3 flex justify-center">
        <div style={{ backgroundColor: 'var(--muted)' }} className="inline-flex gap-2 p-1.5 rounded-full">
          <button
            onClick={() => setViewMode('date')}
            style={getButtonStyle('date')}
            className="flex items-center gap-2 px-4 py-2 font-medium text-sm transition-all rounded-full border-2"
            aria-pressed={viewMode === 'date'}
          >
            <Calendar className="w-4 h-4" />
            <span>By Date</span>
          </button>
          <button
            onClick={() => setViewMode('distance')}
            style={getButtonStyle('distance')}
            className="flex items-center gap-2 px-4 py-2 font-medium text-sm transition-all rounded-full border-2"
            aria-pressed={viewMode === 'distance'}
          >
            <MapPin className="w-4 h-4" />
            <span>By Distance</span>
          </button>
          <button
            onClick={() => setViewMode('map')}
            style={getButtonStyle('map')}
            className="flex items-center gap-2 px-4 py-2 font-medium text-sm transition-all rounded-full border-2"
            aria-pressed={viewMode === 'map'}
          >
            <Map className="w-4 h-4" />
            <span>Map</span>
          </button>
        </div>
      </div>

      {/* Content: Map or List */}
      {viewMode === 'map' ? (
        <ArtistEventsMap events={events} />
      ) : (
        <EventsList
          events={events}
          artistLocation={artistLocation}
          hideDistanceFilter={true}
          sortBy={viewMode}
        />
      )}
    </div>
  );
}
