// src/components/Map/Map.tsx - With TypeScript fixes
"use client";

import { useRef, useEffect, useState } from "react";
import { MarkerClusterer, GridAlgorithm } from "@googlemaps/markerclusterer";
import { useViewToggle } from "@/context/ViewToggleContext";
import { useEvents } from "@/context/EventsContext";
import { mapStyles } from "./MapStyles";
import { CustomInfoOverlay } from './CustomInfoOverlay';
import { createEnhancedEventMarker, createUserLocationMarker } from "./markerUtils";
import { formatEventDate, formatTime } from "@/lib/utils/date-utils";
import { isDateInRange, DateRangeFilter } from '@/lib/utils/date-filter-utils';
import { DEFAULT_CENTER } from "./sampleData";
import EventInfoOverlay from "@/components/overlays/EventInfoOverlay";
import { Event } from "@/lib/types";

export default function Map({
  filterType,
  filterId  // Search text
}: {
  filterType?: 'artist' | 'venue' | 'nomatch' | null;
  filterId?: string | null;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [locationError] = useState<string | null>(null);
  
  // Add these refs to track markers and overlays between renders
  const markersRef = useRef<google.maps.Marker[]>([]);
  const overlaysRef = useRef<CustomInfoOverlay[]>([]);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);

  // Add state for the selected event and modern overlay
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventOverlay, setShowEventOverlay] = useState(false);

  const { isDarkMode } = useViewToggle();
  const {
    allEvents,
    userLocation: contextUserLocation,
    loading: eventsLoading,
    dateRange
  } = useEvents();

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    try {
      const map = new google.maps.Map(mapRef.current, {
        center: contextUserLocation || DEFAULT_CENTER,
        zoom: 12,
        gestureHandling: 'greedy',
        clickableIcons: false,
        maxZoom: 18,
        minZoom: 3,
        zoomControl: false,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: false,
        tilt: 0,
        styles: mapStyles,
        cameraControl: false
      });

      setMapInstance(map);
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  }, [contextUserLocation]);

  // Handle markers, clustering, and info windows
  useEffect(() => {
    if (!mapInstance || eventsLoading) return;

    // Important: Clean up previous markers and overlays first
    const cleanupExistingMarkers = () => {
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
        clustererRef.current = null;
      }
      
      markersRef.current.forEach(marker => {
        marker.setMap(null);
        google.maps.event.clearInstanceListeners(marker);
      });
      markersRef.current = [];
      
      overlaysRef.current.forEach(overlay => {
        overlay.setMap(null);
      });
      overlaysRef.current = [];
      
      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null);
        google.maps.event.clearInstanceListeners(userMarkerRef.current);
        userMarkerRef.current = null;
      }
    };

    cleanupExistingMarkers();

    // Add user location marker if available
    if (contextUserLocation) {
      userMarkerRef.current = new google.maps.Marker({
        position: contextUserLocation,
        map: mapInstance,
        title: "Your Location",
        icon: createUserLocationMarker(),
        zIndex: 1000
      });
    }

    // Use allEvents instead of filteredEvents to show all on map regardless of distance
    if (!allEvents.length) {
      return;
    }

    // Updated filtering logic for Map.tsx to correctly handle text-based search
    const dateFilteredEvents = allEvents.filter(event => {
      const eventDate = new Date(event.date);
      
      // Apply date filtering first
      const passesDateFilter = isDateInRange(eventDate, dateRange as DateRangeFilter);
      if (!passesDateFilter) return false;
      
      // Special case: If filterType is 'nomatch', return empty results
      if (filterType === 'nomatch') {
        return false;
      }
      
      // Apply artist/venue filter if provided
      if ((filterType === 'artist' || filterType === 'venue') && filterId && filterId.trim() !== '' && filterId !== 'null') {
        const searchTerm = filterId.toLowerCase();
        
        if (filterType === 'artist') {
          // Check if event name contains the search term (case insensitive)
          const isMatch = event.name.toLowerCase().includes(searchTerm);
          return isMatch;
        } else if (filterType === 'venue') {
          // Check if venue name contains the search term (case insensitive)
          const isMatch = event.venueName.toLowerCase().includes(searchTerm);
          return isMatch;
        }
      }
      
      // If no filter specified, include all events that pass date filter
      return filterType === null;
    });

    // Check if we need to center on a venue
    let shouldCenterOnVenue = false;
    let venueToCenter = null;

    if (filterType === 'venue' && filterId && dateFilteredEvents.length > 0) {
      shouldCenterOnVenue = true;
      // Find the first matching venue to center on
      venueToCenter = dateFilteredEvents.find(event => 
        event.venueName.toLowerCase().includes(filterId.toLowerCase())
      );
    }
    
    const markers: google.maps.Marker[] = [];

    // Create markers for each event
    dateFilteredEvents.forEach((event) => {
      // Skip events with no location
      if (!event.location || !event.location.lat || !event.location.lng) {
        return;
      }

      const marker = new google.maps.Marker({
        position: event.location,
        map: mapInstance,
        title: event.name,
        icon: createEnhancedEventMarker()
      });

      markers.push(marker);

      // Add click event handler to show the modern EventInfoOverlay instead of the old overlay
      marker.addListener("click", () => {
        // Center the map on the marker with offset
        if (mapInstance) {
          // Save original center for animation
          const markerPosition = marker.getPosition();
          
          // Apply vertical offset (adjust this value as needed)
          const verticalOffset = 150; 
          
          // Use the projection to adjust the center point
          const projection = mapInstance.getProjection();
          if (projection && markerPosition) {
            const point = projection.fromLatLngToPoint(markerPosition);
            if (point) {
              // Adjust point with offset (moving down in pixels means we need to decrease latitude)
              point.y += verticalOffset / Math.pow(2, mapInstance.getZoom() || 0);
              
              // Convert back to LatLng
              const offsetLatLng = projection.fromPointToLatLng(point);
              if (offsetLatLng) {
                // Pan to the adjusted position
                mapInstance.panTo(offsetLatLng);
              }
            }
          } else {
            // Fallback if projection isn't ready
            if (markerPosition) {
              mapInstance.panTo(markerPosition);
            }
          }
        }
        
        // Then show the event overlay
        setSelectedEvent(event);
        setShowEventOverlay(true);
      });
    });

    // Save references to the current markers
    markersRef.current = markers;

    // Create clusterer AFTER creating all markers
    if (markers.length > 0) {
      // Create a custom clusterer renderer
      const clusterer = new MarkerClusterer({
        map: mapInstance,
        markers: markers,
        algorithm: new GridAlgorithm({
          maxZoom: 15,
          gridSize: 60
        }),
        renderer: {
          render: ({ count, position }) => {
            return new google.maps.Marker({
              position,
              label: {
                text: String(count),
                color: "white",
                fontSize: "12px",
                fontWeight: "bold"
              },
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: "#F97316",
                fillOpacity: 0.9,
                strokeColor: "#FFFFFF",
                strokeWeight: 2,
                scale: 22
              },
              zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
              map: mapInstance
            });
          }
        }
      });
      
      // Add custom cluster click handler to fix the double-click issue
      // Type the cluster parameter properly
      google.maps.event.addListener(clusterer, 'clusterclick', (cluster: { getMarkers: () => google.maps.Marker[], getCenter: () => google.maps.LatLng }) => {
        // Get the map
        const map = mapInstance;
        
        // Get the markers in this cluster
        const clusterMarkers = cluster.getMarkers();
        
        // Create a bounds object to contain all markers
        const bounds = new google.maps.LatLngBounds();
        
        // Add each marker's position to the bounds - with proper typing
        clusterMarkers.forEach((marker: google.maps.Marker) => {
          const position = marker.getPosition();
          if (position) {  // Check if position is not null
            bounds.extend(position);
          }
        });
        
        // Fit the map to these bounds
        map.fitBounds(bounds);
        
        // Optional: Set a slightly higher zoom level for a better view
        google.maps.event.addListenerOnce(map, 'idle', () => {
          const zoom = map.getZoom();
          if (zoom !== undefined && zoom > 16) map.setZoom(16);
        });
        
        // Prevent the default cluster click behavior
        return false;
      });
      
      // Save reference to clusterer
      clustererRef.current = clusterer;
    }

    // If we should center on a venue, do it now
    if (shouldCenterOnVenue && venueToCenter && venueToCenter.location) {
      mapInstance.setCenter(venueToCenter.location);
      mapInstance.setZoom(15); // Zoom in closer to the venue
    }

    // Close overlays when clicking elsewhere on the map
    mapInstance.addListener("click", () => {
      setShowEventOverlay(false);
      setSelectedEvent(null);
    });

    // Cleanup function for when component unmounts
    return cleanupExistingMarkers;
  }, [mapInstance, isDarkMode, allEvents, eventsLoading, contextUserLocation, dateRange, filterType, filterId]);

  return (
    <>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      {locationError && (
        <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-70 text-white p-2 rounded text-sm text-center">
          Location unavailable: Using default map view
        </div>
      )}
      {eventsLoading && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-70 text-white p-4 rounded">
          Loading events...
        </div>
      )}
      {filterType === 'nomatch' && filterId && (
        <div className="absolute top-12 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white p-2 rounded text-sm">
          No matches found for "{filterId}"
        </div>
      )}
      
      {/* Event Info Overlay */}
      {selectedEvent && (
        <EventInfoOverlay
          event={selectedEvent}
          isOpen={showEventOverlay}
          onClose={() => {
            setShowEventOverlay(false);
            setSelectedEvent(null);
          }}
          position="map"
        />
      )}
    </>
  );
}