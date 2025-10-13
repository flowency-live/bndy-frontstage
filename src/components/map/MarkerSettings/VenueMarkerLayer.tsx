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
    const clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 30,
      iconCreateFunction: createVenueClusterIcon,
      zoomToBoundsOnClick: true,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: false,
      disableClusteringAtZoom: 12,
    });

    // Create markers for all venues
    venues.forEach((venue) => {
      if (!venue.location || !venue.location.lat || !venue.location.lng) return;

      // Create marker with simple venue icon (no event count badge)
      const marker = L.marker(
        [venue.location.lat, venue.location.lng],
        {
          icon: createVenueMarkerIcon(),
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
  }, [map, venues, onVenueClick, markersRef, clusterRef]);

  // This is a functional component, so no markup is returned
  return null;
};