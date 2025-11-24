// src/components/Map/EventMarkerLayer.tsx
import { useEffect, useRef } from "react";
import L from "leaflet";
import { Event } from "@/lib/types";
import { createEventMarkerIcon, createEventClusterIcon } from "@/components/map/LeafletSettings/LeafletMarkers";

interface EventMarkerLayerProps {
  map: L.Map | null;
  events: Event[];
  eventGroups?: Record<string, Event[]>; // Pre-grouped events
  onEventClick: (events: Event[]) => void;
  markersRef: React.MutableRefObject<Record<string, L.Marker>>;
  clusterRef: React.MutableRefObject<L.MarkerClusterGroup | null>;
}

export const EventMarkerLayer = ({
  map,
  events,
  eventGroups = {},
  onEventClick,
  markersRef,
  clusterRef
}: EventMarkerLayerProps) => {
  const isInitializedRef = useRef(false);
  const previousLocationGroupsRef = useRef<Record<string, Event[]>>({});
  const onEventClickRef = useRef(onEventClick);

  // Keep callback ref updated without triggering re-renders
  useEffect(() => {
    onEventClickRef.current = onEventClick;
  }, [onEventClick]);

  // Add event markers to the map with differential updates
  useEffect(() => {
    if (!map) return;

    // Initialize cluster group once
    if (!clusterRef.current) {
      const clusterGroup = L.markerClusterGroup({
        maxClusterRadius: 40,
        iconCreateFunction: createEventClusterIcon,
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

    // Use provided eventGroups if available, otherwise group events by location
    const currentLocationGroups = Object.keys(eventGroups).length > 0
      ? eventGroups
      : groupEventsByLocation(events);

    const previousLocationGroups = previousLocationGroupsRef.current;

    // Determine which markers to remove, update, or add
    const currentLocationKeys = new Set(Object.keys(currentLocationGroups));
    const previousLocationKeys = new Set(Object.keys(previousLocationGroups));

    // Remove markers that no longer exist
    previousLocationKeys.forEach(locationKey => {
      if (!currentLocationKeys.has(locationKey)) {
        const marker = markersRef.current[locationKey];
        if (marker) {
          clusterGroup.removeLayer(marker);
          marker.remove();
          delete markersRef.current[locationKey];
        }
      }
    });

    // Add or update markers
    Object.entries(currentLocationGroups).forEach(([locationKey, eventsAtLocation]) => {
      if (!eventsAtLocation.length) return;

      const event = eventsAtLocation[0];
      if (!event.location || !event.location.lat || !event.location.lng) return;

      const existingMarker = markersRef.current[locationKey];
      const previousEvents = previousLocationGroups[locationKey];

      // Check if marker needs update (count changed)
      const needsUpdate = !existingMarker ||
        !previousEvents ||
        previousEvents.length !== eventsAtLocation.length;

      if (needsUpdate) {
        // Remove old marker if exists
        if (existingMarker) {
          clusterGroup.removeLayer(existingMarker);
          existingMarker.remove();
        }

        // Create new marker
        const useCount = eventsAtLocation.length > 1;
        const marker = L.marker([event.location.lat, event.location.lng], {
          icon: createEventMarkerIcon(useCount ? eventsAtLocation.length : undefined)
        });

        // Add click handler using ref to avoid stale closures
        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          map?.panTo([event.location!.lat, event.location!.lng]);
          onEventClickRef.current(eventsAtLocation);
        });

        // Add to cluster group
        clusterGroup.addLayer(marker);
        markersRef.current[locationKey] = marker;
      }
    });

    // Update previous state
    previousLocationGroupsRef.current = currentLocationGroups;
    isInitializedRef.current = true;

    // Cleanup function only runs on unmount
    return () => {
      if (clusterRef.current) {
        map.removeLayer(clusterRef.current);
        clusterRef.current = null;
      }

      Object.values(markersRef.current).forEach(marker => {
        marker.remove();
      });

      markersRef.current = {};
      previousLocationGroupsRef.current = {};
    };
  }, [map, events, eventGroups]);
  // Removed onEventClick from deps - using ref instead

  // Helper function to group events by location
  const groupEventsByLocation = (eventList: Event[]): Record<string, Event[]> => {
    const groups: Record<string, Event[]> = {};
    
    eventList.forEach(event => {
      if (!event.location || !event.location.lat || !event.location.lng) return;
      
      const locationKey = `${event.location.lat},${event.location.lng}`;
      
      if (!groups[locationKey]) {
        groups[locationKey] = [];
      }
      
      groups[locationKey].push(event);
    });
    
    return groups;
  };

  // This is a functional component, so no markup is returned
  return null;
};