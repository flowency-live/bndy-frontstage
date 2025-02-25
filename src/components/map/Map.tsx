// src/components/Map/Map.tsx
"use client";

import { useRef, useEffect, useState } from "react";
import { MarkerClusterer, GridAlgorithm } from "@googlemaps/markerclusterer";
import { useViewToggle } from "@/context/ViewToggleContext";
import { useEvents } from "@/context/EventsContext";
import { mapStyles } from "./MapStyles";
import { CustomInfoOverlay } from './CustomInfoOverlay';
import { createEnhancedEventMarker } from "./markerUtils";
import { createEventInfoContent } from "./EventInfoWindow";
import { formatEventDate, formatTime } from "@/lib/utils/date-utils";
import { isDateInRange, DateRangeFilter } from '@/lib/utils/date-filter-utils';
import { DEFAULT_CENTER } from "./sampleData";

/**
 * Debug utility to visualize events by date and day of week
 */
function debugEventDates(events: any[], dateRange: string) {
  // Get first 5 events to avoid console flooding
  const sampleEvents = events.slice(0, 5);

  // Create a debug summary with dates
  const summary = sampleEvents.map(event => ({
    id: event.id.substring(0, 6) + '...',
    name: event.name.substring(0, 20) + (event.name.length > 20 ? '...' : ''),
    date: event.date,
    day: new Date(event.date).getDay(), // 0=Sunday, 1=Monday, ..., 6=Saturday
    dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(event.date).getDay()],
    venueName: event.venueName.substring(0, 15) + (event.venueName.length > 15 ? '...' : '')
  }));

  console.log(`DEBUG ${dateRange} - sample events:`, summary);

  // Count events by day of week
  const dayCount = [0, 0, 0, 0, 0, 0, 0]; // Sun, Mon, ..., Sat
  events.forEach(event => {
    const day = new Date(event.date).getDay();
    dayCount[day]++;
  });

  console.log(`DEBUG ${dateRange} - events by day:`, {
    'Sun': dayCount[0],
    'Mon': dayCount[1],
    'Tue': dayCount[2],
    'Wed': dayCount[3],
    'Thu': dayCount[4],
    'Fri': dayCount[5],
    'Sat': dayCount[6],
    'Total': dayCount.reduce((a, b) => a + b, 0)
  });
}

export default function Map({
  filterType,
  filterId
}: {
  filterType?: 'artist' | 'venue' | null;
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
        styles: mapStyles
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

    // Use allEvents instead of filteredEvents to show all on map regardless of distance
    if (!allEvents.length) {
      console.log("No events to display on map");
      return;
    }

    console.log(`Total events before filtering: ${allEvents.length}`);
    console.log(`Current date filter: ${dateRange}`);

    // Output sample events for debugging
    console.log("Sample events:", allEvents.slice(0, 2).map(e => ({
      id: e.id,
      name: e.name,
      date: e.date,
      venueName: e.venueName
    })));

    // Filter events by date for map view using the centralized date filtering
    const dateFilteredEvents = allEvents.filter(event => {
      const eventDate = new Date(event.date);
      
      // Apply artist/venue filter if provided
      const passesTypeFilter = !filterType || !filterId || (
        filterType === 'artist' && event.name.toLowerCase().includes(filterId.toLowerCase()) ||
        filterType === 'venue' && event.venueName.toLowerCase().includes(filterId.toLowerCase())
      );
    
      if (!passesTypeFilter) return false;
      
      // Use the centralized date filtering logic
      return isDateInRange(eventDate, dateRange as DateRangeFilter);
    });
    
    console.log(`Displaying ${dateFilteredEvents.length} events on map after date filtering`);
    debugEventDates(dateFilteredEvents, dateRange);
    
    // Uncomment to debug all date filters (only needed when troubleshooting)
    // debugDateFilters();

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
    </>
  );
}