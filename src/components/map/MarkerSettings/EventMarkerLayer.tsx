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

  // Add event markers to the map
  useEffect(() => {
    if (!map || events.length === 0) {
      return;
    }

    // Clear existing markers
    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
      clusterRef.current = null;
    }

    Object.values(markersRef.current).forEach(marker => {
      marker.remove();
    });
    markersRef.current = {};

    // Create a cluster group for events
    const clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 40,
      iconCreateFunction: createEventClusterIcon,
      zoomToBoundsOnClick: true,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: false,
      disableClusteringAtZoom: 12
    });
    
    // Use provided eventGroups if available, otherwise group events by location
    const locationGroups = Object.keys(eventGroups).length > 0 
      ? eventGroups 
      : groupEventsByLocation(events);
    
    // Create a marker for each location group
    Object.entries(locationGroups).forEach(([locationKey, eventsAtLocation]) => {
      if (!eventsAtLocation.length) return;
      
      // Use the first event for the marker position
      const event = eventsAtLocation[0];
      
      if (!event.location || !event.location.lat || !event.location.lng) return;
      
      // Create marker with event icon - use count if multiple events
      const useCount = eventsAtLocation.length > 1;
      const marker = L.marker([event.location.lat, event.location.lng], { 
        icon: createEventMarkerIcon(useCount ? eventsAtLocation.length : undefined)
      });
      
      // Add click handler for detailed info
      marker.on('click', (e) => {
        // Stop propagation to prevent default behavior
        L.DomEvent.stopPropagation(e);
        
        // Center map on marker
        map?.panTo([event.location!.lat, event.location!.lng]);
        
        // Set all events at this location to the overlay
        onEventClick(eventsAtLocation);
      });
      
      // Add to cluster group
      clusterGroup.addLayer(marker);
      
      // Store marker reference for cleanup
      markersRef.current[locationKey] = marker;
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
      
      Object.values(markersRef.current).forEach(marker => {
        marker.remove();
      });
      
      markersRef.current = {};
    };
  }, [map, events, eventGroups, onEventClick, markersRef, clusterRef]);

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