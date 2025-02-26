// src/components/Map/Map.tsx - Fixed search with no matches
"use client";

import { useRef, useEffect, useState } from "react";
import { MarkerClusterer, GridAlgorithm } from "@googlemaps/markerclusterer";
import { useViewToggle } from "@/context/ViewToggleContext";
import { useEvents } from "@/context/EventsContext";
import { mapStyles } from "./MapStyles";
import { CustomInfoOverlay } from './CustomInfoOverlay';
import { createEnhancedEventMarker, createUserLocationMarker } from "./markerUtils";
import { createEventInfoContent } from "./EventInfoWindow";
import { formatEventDate, formatTime } from "@/lib/utils/date-utils";
import { isDateInRange, DateRangeFilter } from '@/lib/utils/date-filter-utils';
import { DEFAULT_CENTER } from "./sampleData";

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
  if (clustererRef.current) {
    clustererRef.current.clearMarkers();
    clustererRef.current = null;
  }
  
  // Remove all markers from the map
  markersRef.current.forEach(marker => {
    marker.setMap(null);
  });
  markersRef.current = [];
  
  // Clean up overlays
  overlaysRef.current.forEach(overlay => {
    overlay.setMap(null);
  });
  overlaysRef.current = [];
  
  // Clean up user marker if it exists
  if (userMarkerRef.current) {
    userMarkerRef.current.setMap(null);
    userMarkerRef.current = null;
  }

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
    console.log("No events to display on map");
    return;
  }

  console.log(`Total events before filtering: ${allEvents.length}`);
  console.log(`Current date filter: ${dateRange}`);
  console.log(`Current filter: ${filterType} - "${filterId}"`);

  // Updated filtering logic - KEY CHANGE: Handle 'nomatch' filterType
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

  console.log(`Displaying ${dateFilteredEvents.length} events on map after filtering`);

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
  const overlays: CustomInfoOverlay[] = [];

  // Create markers for each event
  dateFilteredEvents.forEach((event) => {
    // Skip events with no location
    if (!event.location || !event.location.lat || !event.location.lng) {
      console.log(`Skipping event without location: ${event.name}`);
      return;
    }

    const marker = new google.maps.Marker({
      position: event.location,
      map: mapInstance,
      title: event.name,
      icon: createEnhancedEventMarker()
    });

    markers.push(marker);

    // Format event details
    const eventDate = formatEventDate(new Date(event.date));
    const eventTime = formatTime(event.startTime);

    // Use the imported function to create themed content
    const content = createEventInfoContent(
      {
        title: event.name,
        description: `${event.venueName} - ${eventDate} at ${eventTime}`
      },
      isDarkMode
    );

    const overlay = new CustomInfoOverlay(event.location, content, mapInstance);
    overlays.push(overlay);

    // Add click event handler
    marker.addListener("click", () => {
      // Close all open overlays
      overlays.forEach(o => o.hide());

      // Open this overlay
      overlay.show();
    });
  });

  // Save references to the current markers and overlays
  markersRef.current = markers;
  overlaysRef.current = overlays;

  // Create clusterer AFTER creating all markers
  if (markers.length > 0) {
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
    
    // Save reference to clusterer
    clustererRef.current = clusterer;
  }

  // If we should center on a venue, do it now
  if (shouldCenterOnVenue && venueToCenter && venueToCenter.location) {
    console.log(`Centering map on venue: ${venueToCenter.venueName}`);
    mapInstance.setCenter(venueToCenter.location);
    mapInstance.setZoom(15); // Zoom in closer to the venue
  }

  // Close overlays when clicking elsewhere on the map
  mapInstance.addListener("click", () => {
    overlays.forEach(overlay => overlay.hide());
  });

  // Cleanup function for when component unmounts
  return () => {
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    }
    
    markersRef.current.forEach(marker => {
      marker.setMap(null);
      google.maps.event.clearInstanceListeners(marker);
    });
    
    overlaysRef.current.forEach(overlay => {
      overlay.setMap(null);
    });
    
    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
      google.maps.event.clearInstanceListeners(userMarkerRef.current);
    }
    
    if (mapInstance) {
      google.maps.event.clearInstanceListeners(mapInstance);
    }
  };
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
    </>
  );
}