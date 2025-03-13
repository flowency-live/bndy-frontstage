// src/components/Map/Map.tsx - Updated with venue support, clustering removed in venue mode
"use client";

import { useRef, useEffect, useState } from "react";
import { MarkerClusterer, GridAlgorithm } from "@googlemaps/markerclusterer";
import { useViewToggle } from "@/context/ViewToggleContext";
import { useEvents } from "@/context/EventsContext";
import { mapStyles } from "./MapStyles";
import { CustomInfoOverlay } from './CustomInfoOverlay';
import { 
  createEnhancedEventMarker, 
  createUserLocationMarker,
  createVenueMarker,
  getClusterColor,
  getVenueClusterColor
} from "./markerUtils";
import { formatEventDate, formatTime } from "@/lib/utils/date-utils";
import { isDateInRange, DateRangeFilter } from '@/lib/utils/date-filter-utils';
import { DEFAULT_CENTER } from "./sampleData";
import EventInfoOverlay from "@/components/overlays/EventInfoOverlay";
import VenueInfoOverlay from "@/components/overlays/VenueInfoOverlay";
import { Event, Venue } from "@/lib/types";
import { getAllVenuesForMap } from "@/lib/services/venue-service";

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
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);

  // Add state for the selected event and modern overlay
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [showEventOverlay, setShowEventOverlay] = useState(false);
  const [showVenueOverlay, setShowVenueOverlay] = useState(false);

  const { isDarkMode, mapMode } = useViewToggle();
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

  // Load venues when in venue mode
  useEffect(() => {
    if (mapMode === 'venues' && !venues.length) {
      const fetchVenues = async () => {
        setLoading(true);
        try {
          const venueData = await getAllVenuesForMap();
          setVenues(venueData);
        } catch (error) {
          console.error("Error fetching venues:", error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchVenues();
    }
  }, [mapMode, venues.length]);

  // Handle markers, clustering, and info windows
  useEffect(() => {
    if (!mapInstance) return;
    if (mapMode === 'events' && eventsLoading) return;
    if (mapMode === 'venues' && loading) return;

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

    const markers: google.maps.Marker[] = [];

    if (mapMode === 'events') {
      // Handle events mode
      if (!allEvents.length) return;

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

        // Add click event handler to show the modern EventInfoOverlay
        marker.addListener("click", () => {
          // Center the map on the marker with offset
          if (mapInstance) {
            const markerPosition = marker.getPosition();
            
            // Apply vertical offset (adjust this value as needed)
            const verticalOffset = 150; 
            
            // Use the projection to adjust the center point
            const projection = mapInstance.getProjection();
            if (projection && markerPosition) {
              const point = projection.fromLatLngToPoint(markerPosition);
              if (point) {
                point.y += verticalOffset / Math.pow(2, mapInstance.getZoom() || 0);
                const offsetLatLng = projection.fromPointToLatLng(point);
                if (offsetLatLng) {
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
          
          // Close any open overlays first
          setShowVenueOverlay(false);
          setSelectedVenue(null);
          
          // Then show the event overlay
          setSelectedEvent(event);
          setShowEventOverlay(true);
        });
      });

      // Save references to the current markers
      markersRef.current = markers;

      // Create clusterer for events
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
                  fillColor: getClusterColor(count),
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
        
        google.maps.event.addListener(clusterer, 'clusterclick', (cluster: { getMarkers: () => google.maps.Marker[], getCenter: () => google.maps.LatLng }) => {
          const map = mapInstance;
          const clusterMarkers = cluster.getMarkers();
          const bounds = new google.maps.LatLngBounds();
          clusterMarkers.forEach((marker: google.maps.Marker) => {
            const position = marker.getPosition();
            if (position) {
              bounds.extend(position);
            }
          });
          map.fitBounds(bounds);
          google.maps.event.addListenerOnce(map, 'idle', () => {
            const zoom = map.getZoom();
            if (zoom !== undefined && zoom > 16) map.setZoom(16);
          });
          return false;
        });
        
        clustererRef.current = clusterer;
      }

      // If we should center on a venue, do it now
      if (shouldCenterOnVenue && venueToCenter && venueToCenter.location) {
        mapInstance.setCenter(venueToCenter.location);
        mapInstance.setZoom(15);
      }
    } else if (mapMode === 'venues') {
      // Handle venues mode
      if (!venues.length) return;
      
      // Create markers for each venue
      venues.forEach((venue) => {
        if (!venue.location || !venue.location.lat || !venue.location.lng) {
          return;
        }

        const marker = new google.maps.Marker({
          position: venue.location,
          map: mapInstance,
          title: venue.name,
          icon: createVenueMarker()
        });

        markers.push(marker);

        marker.addListener("click", () => {
          // Center the map on the marker with offset
          if (mapInstance) {
            const markerPosition = marker.getPosition();
            const verticalOffset = 150; 
            const projection = mapInstance.getProjection();
            if (projection && markerPosition) {
              const point = projection.fromLatLngToPoint(markerPosition);
              if (point) {
                point.y += verticalOffset / Math.pow(2, mapInstance.getZoom() || 0);
                const offsetLatLng = projection.fromPointToLatLng(point);
                if (offsetLatLng) {
                  mapInstance.panTo(offsetLatLng);
                }
              }
            } else if (markerPosition) {
              mapInstance.panTo(markerPosition);
            }
          }
          
          // Close any open overlays first
          setShowEventOverlay(false);
          setSelectedEvent(null);
          
          // Then show the venue overlay
          setSelectedVenue(venue);
          setShowVenueOverlay(true);
        });
      });

      // Save references to the current markers
      markersRef.current = markers;

      // NOTE: Clustering is intentionally removed for venue mode.
      // If you see a block like this, remove or comment it out:
      /*
      if (markers.length > 0) {
        const clusterer = new MarkerClusterer({
          ...
        });
        ...
        clustererRef.current = clusterer;
      }
      */
    }

    // Close overlays when clicking elsewhere on the map
    mapInstance.addListener("click", () => {
      setShowEventOverlay(false);
      setSelectedEvent(null);
      setShowVenueOverlay(false);
      setSelectedVenue(null);
    });

    return cleanupExistingMarkers;
  }, [
    mapInstance,
    isDarkMode,
    allEvents,
    eventsLoading,
    contextUserLocation,
    dateRange,
    filterType,
    filterId,
    mapMode,
    venues,
    loading
  ]);

  return (
    <>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      
      {locationError && (
        <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-70 text-white p-2 rounded text-sm text-center">
          Location unavailable: Using default map view
        </div>
      )}
      
      {eventsLoading && mapMode === 'events' && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-70 text-white p-4 rounded">
          Loading events...
        </div>
      )}
      
      {loading && mapMode === 'venues' && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-70 text-white p-4 rounded">
          Loading venues...
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
          events={[selectedEvent]}
          isOpen={showEventOverlay}
          onClose={() => {
            setShowEventOverlay(false);
            setSelectedEvent(null);
          }}
          position="map"
        />
      )}
      
      {/* Venue Info Overlay */}
      {selectedVenue && (
        <VenueInfoOverlay
          venue={selectedVenue}
          isOpen={showVenueOverlay}
          onClose={() => {
            setShowVenueOverlay(false);
            setSelectedVenue(null);
          }}
          position="map"
        />
      )}
    </>
  );
}
