// src/components/Map/VenueMarkerLayer.tsx
import { useEffect, useRef } from "react";
import L from "leaflet";
import { Venue, Event } from "@/lib/types";
import { createVenueMarkerIcon, createVenueClusterIcon } from "@/components/map/LeafletSettings/LeafletMarkers";

interface VenueMarkerLayerProps {
  map: L.Map | null;
  venues: Venue[];
  events: Event[];
  onVenueClick: (venue: Venue) => void;
  markersRef: React.MutableRefObject<Record<string, L.Marker>>;
  clusterRef: React.MutableRefObject<L.MarkerClusterGroup | null>;
}

export const VenueMarkerLayer = ({
  map,
  venues,
  events,
  onVenueClick,
  markersRef,
  clusterRef,
}: VenueMarkerLayerProps) => {
  const isInitializedRef = useRef(false);

  // Add venue markers to the map
  useEffect(() => {
    if (!map || !venues.length) {
      return;
    }

    // Clear existing markers
    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
      clusterRef.current = null;
    }

    Object.values(markersRef.current).forEach((marker) => {
      marker.remove();
    });
    markersRef.current = {};

    // Create a cluster group for venues
    // ONLY changing maxClusterRadius for less aggressive clustering
    const clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 30, // Reduced from 60 - ONLY change to make clustering less aggressive
      iconCreateFunction: createVenueClusterIcon,
      zoomToBoundsOnClick: true,
      showCoverageOnHover: false, // Keep this as in your original code
      spiderfyOnMaxZoom: false,
      disableClusteringAtZoom: 12, // Keep your original value
    });

    // First, create a map of venue IDs to associated events
    const venueEvents: Record<string, Event[]> = {};

    // Initialize with empty arrays for all venues
    venues.forEach((venue) => {
      venueEvents[venue.id] = [];
    });

    // Add events to their respective venues
    if (events && events.length) {
      events.forEach((event) => {
        if (event.venueId && venueEvents[event.venueId]) {
          venueEvents[event.venueId].push(event);
        }
      });
    }

    // Now create markers for all venues
    venues.forEach((venue) => {
      if (!venue.location || !venue.location.lat || !venue.location.lng) return;

      // Get count of events for this venue (might be 0)
      const eventCount = venueEvents[venue.id] ? venueEvents[venue.id].length : 0;

      // Create marker with venue icon
      const marker = L.marker(
        [venue.location.lat, venue.location.lng],
        {
          icon: createVenueMarkerIcon(eventCount),
          interactive: true,
          title: venue.name,
        }
      );

      // Add click handler for venue
      marker.on("click", (e) => {
        // Prevent default behavior
        L.DomEvent.stopPropagation(e);

        // Center map on marker
        map?.panTo([venue.location!.lat, venue.location!.lng]);

        // When venue is clicked, show venue overlay
        onVenueClick(venue);
      });

      // Add to cluster group and track for cleanup
      clusterGroup.addLayer(marker);
      markersRef.current[venue.id] = marker;
    });

    // Add the cluster group to the map
    map.addLayer(clusterGroup);
    clusterRef.current = clusterGroup;

    isInitializedRef.current = true;

    // Cleanup function
    return () => {
      if (clusterRef.current) {
        map.removeLayer(clusterRef.current);
        clusterRef.current = null;
      }
      Object.values(markersRef.current).forEach((marker) => {
        marker.remove();
      });
      markersRef.current = {};
    };
  }, [map, venues, events, onVenueClick, markersRef, clusterRef]);

  // This is a functional component, so no markup is returned
  return null;
};