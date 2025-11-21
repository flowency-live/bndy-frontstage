"use client";

import EventsList from "@/components/artist/EventsList";
import { Event } from "@/lib/types";

interface EventsTabProps {
  events: Event[];
  venueLocation?: string;
}

/**
 * EventsTab - Wrapper for events list at venue
 *
 * Currently wraps existing EventsList component.
 * Future: Add EventFilters component (By Date / By Distance toggle)
 */
export default function EventsTab({ events, venueLocation }: EventsTabProps) {
  return (
    <div role="tabpanel" id="events-panel" aria-labelledby="events-tab" style={{ backgroundColor: 'var(--muted)' }} className="container mx-auto px-4 py-4">
      <EventsList
        events={events}
        artistLocation={venueLocation}
        hideDistanceFilter={true}
        linkToArtist={true}
      />
    </div>
  );
}
