// bndy Map v2 — GeoJSON builders (consume the real app Event / Venue types)

import type { Event, Venue } from "@/lib/types";
import type { FeatureCollection, Point } from "geojson";

export interface GigProps {
  id: string;
  vid: string;
  venue: string;
  kind: "gig";
  tonight: 0 | 1;
}
export interface VenueProps {
  id: string;
  name: string;
  kind: "venue";
  live: 0 | 1;
}

function hasCoords(loc?: { lat?: number; lng?: number } | null): loc is { lat: number; lng: number } {
  return !!loc && typeof loc.lat === "number" && typeof loc.lng === "number" && !Number.isNaN(loc.lat) && !Number.isNaN(loc.lng);
}

export function gigsToGeoJSON(events: Event[], todayStr: string): FeatureCollection<Point, GigProps> {
  const features = [];
  for (const e of events) {
    if (!hasCoords(e.location)) continue;
    features.push({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [e.location.lng, e.location.lat] },
      properties: {
        id: e.id,
        vid: e.venueId,
        venue: e.venueName ?? "",
        kind: "gig" as const,
        tonight: (e.date === todayStr ? 1 : 0) as 0 | 1,
      },
    });
  }
  return { type: "FeatureCollection", features };
}

export function venuesToGeoJSON(venues: Venue[], venueIdsWithEvents: Set<string>): FeatureCollection<Point, VenueProps> {
  const features = [];
  for (const v of venues) {
    const loc = (v as Venue & { location?: { lat: number; lng: number } }).location;
    if (!hasCoords(loc)) continue;
    features.push({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [loc.lng, loc.lat] },
      properties: {
        id: v.id,
        name: v.name ?? "",
        kind: "venue" as const,
        live: (venueIdsWithEvents.has(v.id) ? 1 : 0) as 0 | 1,
      },
    });
  }
  return { type: "FeatureCollection", features };
}
