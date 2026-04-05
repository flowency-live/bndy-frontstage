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

  return (
    <div role="tabpanel" id="events-panel" aria-labelledby="events-tab" className="container mx-auto px-4 py-4 bg-muted">
      {/* View Toggle */}
      <div className="mb-4 flex justify-center">
        <div className="inline-flex gap-1 p-1 rounded-lg bg-background border border-border">
          <button
            onClick={() => setViewMode('date')}
            className={`flex items-center gap-2 px-3 py-1.5 font-medium text-sm transition-all rounded-md ${
              viewMode === 'date'
                ? 'bg-primary text-white'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            aria-pressed={viewMode === 'date'}
          >
            <Calendar className="w-4 h-4" />
            <span>By Date</span>
          </button>
          <button
            onClick={() => setViewMode('distance')}
            className={`flex items-center gap-2 px-3 py-1.5 font-medium text-sm transition-all rounded-md ${
              viewMode === 'distance'
                ? 'bg-primary text-white'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            aria-pressed={viewMode === 'distance'}
          >
            <MapPin className="w-4 h-4" />
            <span>By Distance</span>
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-2 px-3 py-1.5 font-medium text-sm transition-all rounded-md ${
              viewMode === 'map'
                ? 'bg-primary text-white'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
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
