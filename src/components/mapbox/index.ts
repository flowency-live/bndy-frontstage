// Mapbox GL JS components
// These replace the Leaflet equivalents during migration

export { MapboxContainer } from "./MapboxContainer";
export { VenueMarkerLayer } from "./VenueMarkerLayer";
export { EventMarkerLayer } from "./EventMarkerLayer";
export { UserLocationMarker } from "./UserLocationMarker";

// Marker utilities
export { venuesToGeoJSON, eventsToGeoJSON } from "./MapboxMarkers";
export { createMarkerElement, clusterTier } from "./markerElements";
export { useDiffedMarkers } from "./useDiffedMarkers";

// Re-export context utilities
export { useMapbox, MapboxProvider, StaticMapFallback } from "@/context/MapboxContext";
