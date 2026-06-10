/**
 * Mapbox GeoJSON utilities
 *
 * NOTE (2026-06): The old SVG→canvas→addImage marker pipeline was removed.
 * Markers are now diffed HTML elements — see markerElements.ts,
 * useDiffedMarkers.ts and src/styles/markers.css. Only the GeoJSON
 * converters live here now.
 */

/**
 * Convert venues to GeoJSON for Mapbox source
 * @param venues Array of venue objects
 * @param venueIdsWithEvents Optional Set of venue IDs that have upcoming events
 */
export function venuesToGeoJSON(
  venues: Array<{ id: string; name: string; location: { lat: number; lng: number } }>,
  venueIdsWithEvents?: Set<string>
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: venues
      .filter((v) => v.location?.lat && v.location?.lng)
      .map((venue) => ({
        type: "Feature" as const,
        properties: {
          id: venue.id,
          name: venue.name,
          hasEvents: venueIdsWithEvents?.has(venue.id) ?? false,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [venue.location.lng, venue.location.lat],
        },
      })),
  };
}

/**
 * Convert events to GeoJSON for Mapbox source
 *
 * IMPORTANT: locationKey is stored in properties to enable reliable lookup.
 * Using coordinates directly is unreliable due to floating point precision.
 */
export function eventsToGeoJSON(events: Array<{ id: string; name: string; location: { lat: number; lng: number }; date: string; venueName: string }>): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: events
      .filter((e) => e.location?.lat && e.location?.lng)
      .map((event) => ({
        type: "Feature" as const,
        properties: {
          id: event.id,
          name: event.name,
          date: event.date,
          venueName: event.venueName,
          // Store the location key for reliable lookup (coordinates can lose precision)
          locationKey: `${event.location.lat},${event.location.lng}`,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [event.location.lng, event.location.lat],
        },
      })),
  };
}
