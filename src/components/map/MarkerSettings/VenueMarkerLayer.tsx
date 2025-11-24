// src/components/Map/VenueMarkerLayer.tsx
import { useEffect, useRef } from "react";
import L from "leaflet";
import { Venue } from "@/lib/types";
import { createVenueMarkerIcon, createVenueClusterIcon } from "@/components/map/LeafletSettings/LeafletMarkers";

interface VenueMarkerLayerProps {
  map: L.Map | null;
  venues: Venue[];
  onVenueClick: (venue: Venue) => void;
  markersRef: React.MutableRefObject<Record<string, L.Marker>>;
  clusterRef: React.MutableRefObject<L.MarkerClusterGroup | null>;
}

export const VenueMarkerLayer = ({
  map,
  venues,
  onVenueClick,
  markersRef,
  clusterRef,
}: VenueMarkerLayerProps) => {
  const isInitializedRef = useRef(false);
  const previousVenueIdsRef = useRef<Set<string>>(new Set());
  const onVenueClickRef = useRef(onVenueClick);

  // Keep callback ref updated without triggering re-renders
  useEffect(() => {
    onVenueClickRef.current = onVenueClick;
  }, [onVenueClick]);

  // Add venue markers to the map with differential updates
  useEffect(() => {
    // [PERF_DEBUG - REMOVE] Track effect execution
    const effectStartTime = performance.now();
    console.warn('[PERF_DEBUG] VenueMarkerLayer effect started', {
      venuesCount: venues.length
    });

    if (!map) {
      console.warn('[PERF_DEBUG] VenueMarkerLayer - no map, returning');
      return;
    }

    // Initialize cluster group once
    if (!clusterRef.current) {
      console.warn('[PERF_DEBUG] VenueMarkerLayer - initializing cluster group');
      const clusterGroup = L.markerClusterGroup({
        maxClusterRadius: 30,
        iconCreateFunction: createVenueClusterIcon,
        zoomToBoundsOnClick: true,
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: false,
        disableClusteringAtZoom: 12,
        // Performance optimizations
        animate: false, // Disable animation for instant updates
        animateAddingMarkers: false,
        removeOutsideVisibleBounds: true, // Remove markers outside viewport
        chunkedLoading: true, // Load markers in chunks
      });
      map.addLayer(clusterGroup);
      clusterRef.current = clusterGroup;
    }

    const clusterGroup = clusterRef.current;

    // Get current venue IDs
    const currentVenueIds = new Set(
      venues
        .filter(v => v.location && v.location.lat && v.location.lng)
        .map(v => v.id)
    );
    const previousVenueIds = previousVenueIdsRef.current;

    // Remove markers for venues that no longer exist
    previousVenueIds.forEach(venueId => {
      if (!currentVenueIds.has(venueId)) {
        const marker = markersRef.current[venueId];
        if (marker) {
          clusterGroup.removeLayer(marker);
          marker.remove();
          delete markersRef.current[venueId];
        }
      }
    });

    // Add markers for new venues
    venues.forEach((venue) => {
      if (!venue.location || !venue.location.lat || !venue.location.lng) return;

      // Skip if marker already exists
      if (markersRef.current[venue.id]) return;

      // Create marker with simple venue icon (no event count badge)
      const marker = L.marker(
        [venue.location.lat, venue.location.lng],
        {
          icon: createVenueMarkerIcon(),
          interactive: true,
          title: venue.name,
        }
      );

      // Add click handler using ref to avoid stale closures
      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        map?.panTo([venue.location!.lat, venue.location!.lng]);
        onVenueClickRef.current(venue);
      });

      // Add to cluster group and track for cleanup
      clusterGroup.addLayer(marker);
      markersRef.current[venue.id] = marker;
    });

    // Update previous state
    previousVenueIdsRef.current = currentVenueIds;
    isInitializedRef.current = true;

    // [PERF_DEBUG - REMOVE] Log effect completion
    const effectEndTime = performance.now();
    console.warn(`[PERF_DEBUG] VenueMarkerLayer effect completed in ${(effectEndTime - effectStartTime).toFixed(2)}ms`, {
      markersAdded: currentVenueIds.size - previousVenueIds.size,
      markersRemoved: previousVenueIds.size - currentVenueIds.size,
      totalMarkers: Object.keys(markersRef.current).length
    });
    // [/PERF_DEBUG - REMOVE]

    // Cleanup function only runs on unmount
    return () => {
      if (clusterRef.current) {
        map.removeLayer(clusterRef.current);
        clusterRef.current = null;
      }
      Object.values(markersRef.current).forEach((marker) => {
        marker.remove();
      });
      markersRef.current = {};
      previousVenueIdsRef.current = new Set();
    };
  }, [map, venues]);
  // Removed onVenueClick from deps - using ref instead

  // This is a functional component, so no markup is returned
  return null;
};