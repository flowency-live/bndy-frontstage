"use client";

import EventsList from "../EventsList";
import { Event } from "@/lib/types";

interface EventsTabProps {
  events: Event[];
  artistLocation?: string;
}

/**
 * EventsTab - Wrapper for events list with filters
 *
 * Currently wraps existing EventsList component.
 * Future: Add EventFilters component (By Date / By Distance toggle)
 */
export default function EventsTab({ events, artistLocation }: EventsTabProps) {
  return (
    <div role="tabpanel" id="events-panel" aria-labelledby="events-tab" className="container mx-auto px-4">
      {/* TODO: Add EventFilters component here */}
      <EventsList events={events} artistLocation={artistLocation} />
    </div>
  );
}
