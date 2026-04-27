"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import { useViewToggle } from "@/context/ViewToggleContext";
import { useEvents } from "@/context/EventsContext";
import { useVenues } from "@/hooks/useVenues";
import { useAllPublicEvents } from "@/hooks/useAllPublicEvents";
import type { Event, Venue } from "@/lib/types";
import { isDateInRange, DateRangeFilter, getFormattedDateRange } from "@/lib/utils/date-filter-utils";
import EventInfoOverlay from "../overlays/EventInfoOverlay";
import VenueInfoOverlay from "../overlays/VenueInfoOverlay";
import { useMapbox } from "@/context/MapboxContext";
import { MapboxContainer } from "./MapboxContainer";
import { VenueMarkerLayer } from "./VenueMarkerLayer";
import { EventMarkerLayer } from "./EventMarkerLayer";
import { UserLocationMarker } from "./UserLocationMarker";
import { MapboxControls } from "./MapboxControls";

// Map date range filter labels
const dateRangeLabels: Record<string, string> = {
  today: "Today",
  thisWeek: "This Week",
  thisWeekend: "This Weekend",
  nextWeek: "Next Week",
  nextWeekend: "Next Weekend",
};

type FilterType = "artist" | "venue" | "nomatch" | null;

interface MapboxMapProps {
  filterType?: FilterType;
  filterId?: string | null;
  entityExists?: boolean;
  onClearSearch?: () => void;
}

/**
 * MapboxMap - Main map component using Mapbox GL JS
 *
 * This replaces the Leaflet Map component with identical functionality
 * but using WebGL-based rendering for better performance.
 *
 * CRITICAL: Uses MapboxContext singleton - NO new map loads on re-render
 */
const MapboxMap = ({ filterType, filterId, entityExists = false, onClearSearch }: MapboxMapProps) => {
  const { userLocation, dateRange } = useEvents();
  const { isDarkMode, mapMode } = useViewToggle();
  const { map, isMapReady, isBot } = useMapbox();

  // Calculate date range for queries
  const { startDate, endDate } = useMemo(() => {
    return getFormattedDateRange(dateRange as DateRangeFilter);
  }, [dateRange]);

  // Fetch ALL public events in date range
  const { data: allEvents = [], isLoading: eventsLoading } = useAllPublicEvents({
    startDate,
    endDate,
    enabled: mapMode === "events",
  });

  // Fetch all venues (only when in venue mode)
  const { data: venues = [], isLoading: venuesLoading } = useVenues();

  // UI state for overlays
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [showEventOverlay, setShowEventOverlay] = useState(false);
  const [showVenueOverlay, setShowVenueOverlay] = useState(false);
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>([]);

  // No match message
  const getNoMatchMessage = () => {
    if (!filterType || !filterId) return "";
    if (filterType === "nomatch") {
      if (entityExists && dateRange) {
        const dateRangeLabel = dateRangeLabels[dateRange as string] || "selected date range";
        return `No events for "${filterId}" in ${dateRangeLabel}`;
      }
      return `No matches found for "${filterId}"`;
    }
    return "";
  };

  // Set up map click listener - only close overlays when clicking empty map area
  useEffect(() => {
    if (!map || !isMapReady) return;

    const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
      // Check if click was on any marker layer - if so, don't close overlays
      // The marker layer handlers will handle the click
      const markerLayers = [
        "event-clusters",
        "event-unclustered",
        "venue-clusters",
        "venue-unclustered",
      ];

      const clickedFeatures = map.queryRenderedFeatures(e.point, {
        layers: markerLayers.filter(layer => map.getLayer(layer)),
      });

      if (clickedFeatures.length > 0) {
        // Click was on a marker, let the marker handler deal with it
        return;
      }

      // Click was on empty map area - close overlays
      setShowEventOverlay(false);
      setSelectedEvents([]);
      setShowVenueOverlay(false);
      setSelectedVenue(null);
      if (onClearSearch) {
        onClearSearch();
      }
    };

    map.on("click", handleMapClick);

    return () => {
      map.off("click", handleMapClick);
    };
  }, [map, isMapReady, onClearSearch]);

  // Memoize location grouping
  const eventLocationGroups = useMemo(() => {
    if (!allEvents || allEvents.length === 0) return {};

    const eventsOnly = allEvents.filter(
      (e): e is Event => (e as Event).date !== undefined
    );

    // Apply date filtering
    let dateFiltered = eventsOnly;
    if (dateRange) {
      dateFiltered = eventsOnly.filter((event) => {
        const eventDate = new Date(event.date);
        return isDateInRange(eventDate, dateRange as DateRangeFilter);
      });
    }

    // Apply search/filter
    let searchFiltered = dateFiltered;
    if (filterType && filterId && filterId.trim() !== "") {
      if (filterType === "nomatch") {
        searchFiltered = [];
      } else {
        const searchTerm = filterId.toLowerCase();
        if (filterType === "artist") {
          searchFiltered = dateFiltered.filter((event) =>
            event.name.toLowerCase().includes(searchTerm)
          );
        } else if (filterType === "venue") {
          searchFiltered = dateFiltered.filter((event) =>
            event.venueName.toLowerCase().includes(searchTerm)
          );
        }
      }
    }

    // Group by location
    const locationGroups: Record<string, Event[]> = {};
    searchFiltered.forEach((event) => {
      if (!event.location) return;
      const locationKey = `${event.location.lat},${event.location.lng}`;
      if (!locationGroups[locationKey]) {
        locationGroups[locationKey] = [];
      }
      locationGroups[locationKey].push(event);
    });

    return locationGroups;
  }, [allEvents, dateRange, filterType, filterId]);

  // Memoize representative events for markers
  const filteredEvents = useMemo(() => {
    return Object.values(eventLocationGroups).map((group) => group[0]);
  }, [eventLocationGroups]);

  // Apply filters to venues
  useEffect(() => {
    if (!venues || venues.length === 0) return;
    if (filterType && filterId && filterId.trim() !== "") {
      if (filterType === "nomatch") {
        setFilteredVenues([]);
      } else if (filterType === "venue") {
        const searchTerm = filterId.toLowerCase();
        const filtered = venues.filter((venue) =>
          venue.name.toLowerCase().includes(searchTerm)
        );
        setFilteredVenues(filtered);
      } else {
        setFilteredVenues(venues);
      }
    } else {
      setFilteredVenues(venues);
    }
  }, [venues, filterType, filterId]);

  // Highlight single search result
  useEffect(() => {
    if (!filterType || !filterId || filterType === "nomatch") return;
    if (!map || !isMapReady) return;
    if (filterId.length < 3) return;

    const repositionTimeout = setTimeout(() => {
      if (mapMode === "events") {
        if (filteredEvents.length === 1) {
          const eventItem = filteredEvents[0];
          if (eventItem.location) {
            map.flyTo({
              center: [eventItem.location.lng, eventItem.location.lat],
              zoom: 15,
              duration: 500,
            });
            const key = `${eventItem.location.lat},${eventItem.location.lng}`;
            const group = eventLocationGroups[key] || [eventItem];
            setTimeout(() => handleEventClick(group), 600);
          }
        }
      } else if (mapMode === "venues") {
        if (filteredVenues.length === 1) {
          const venueItem = filteredVenues[0];
          if (venueItem.location) {
            map.flyTo({
              center: [venueItem.location.lng, venueItem.location.lat],
              zoom: 15,
              duration: 500,
            });
            setTimeout(() => handleVenueClick(venueItem), 600);
          }
        }
      }
    }, 300);

    return () => clearTimeout(repositionTimeout);
  }, [filterType, filterId, mapMode, filteredEvents, filteredVenues, eventLocationGroups, map, isMapReady]);

  // Handle event marker click
  const handleEventClick = useCallback((events: Event[]) => {
    const sortedEvents = [...events].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      if (a.startTime && b.startTime) {
        return a.startTime.localeCompare(b.startTime);
      }
      return 0;
    });
    setSelectedEvents(sortedEvents);
    setShowEventOverlay(true);
    setShowVenueOverlay(false);
    setSelectedVenue(null);
  }, []);

  // Handle venue marker click
  const handleVenueClick = useCallback((venue: Venue) => {
    setSelectedVenue(venue);
    setShowVenueOverlay(true);
    setShowEventOverlay(false);
    setSelectedEvents([]);
  }, []);

  // Handle overlay close
  const handleEventOverlayClose = useCallback(() => {
    setShowEventOverlay(false);
    setSelectedEvents([]);
    if (onClearSearch) onClearSearch();
  }, [onClearSearch]);

  const handleVenueOverlayClose = useCallback(() => {
    setShowVenueOverlay(false);
    setSelectedVenue(null);
    if (onClearSearch) onClearSearch();
  }, [onClearSearch]);

  // Bot fallback is handled by MapboxContainer
  if (isBot) {
    return (
      <div className="w-full h-full relative">
        <MapboxContainer userLocation={userLocation} isDarkMode={isDarkMode} />
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <MapboxContainer userLocation={userLocation} isDarkMode={isDarkMode} />

      {isMapReady && (
        <>
          <UserLocationMarker userLocation={userLocation} />
          <MapboxControls userLocation={userLocation} />

          {mapMode === "events" && (
            <EventMarkerLayer
              events={filteredEvents}
              eventGroups={eventLocationGroups}
              onEventClick={handleEventClick}
            />
          )}

          {mapMode === "venues" && (
            <VenueMarkerLayer
              venues={filteredVenues}
              onVenueClick={handleVenueClick}
            />
          )}
        </>
      )}

      {/* Loading indicators */}
      {eventsLoading && mapMode === "events" && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-70 text-white p-4 rounded z-20">
          Loading events...
        </div>
      )}

      {venuesLoading && mapMode === "venues" && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-70 text-white p-4 rounded z-20">
          Loading venues...
        </div>
      )}

      {/* No match message */}
      {filterType === "nomatch" && filterId && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white p-2 rounded text-sm z-20 whitespace-nowrap">
          {getNoMatchMessage()}
        </div>
      )}

      {mapMode === "events" && !eventsLoading && filteredEvents.length === 0 && filterType !== "nomatch" && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white p-2 rounded text-sm z-20 whitespace-nowrap">
          {`No events in bndy.live ${dateRangeLabels[dateRange as string] || "current filters"}`}
        </div>
      )}

      {mapMode === "venues" && !venuesLoading && filteredVenues.length === 0 && filterType !== "nomatch" && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white p-2 rounded text-sm z-20 whitespace-nowrap">
          No matching venues
        </div>
      )}

      {/* Map not ready */}
      {!isMapReady && !isBot && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-70 text-white p-4 rounded z-20">
          Loading map...
        </div>
      )}

      {/* Overlays */}
      {selectedEvents.length > 0 && (
        <EventInfoOverlay
          events={selectedEvents}
          isOpen={showEventOverlay}
          onClose={handleEventOverlayClose}
          position="map"
        />
      )}

      {selectedVenue && (
        <VenueInfoOverlay
          venue={selectedVenue}
          isOpen={showVenueOverlay}
          onClose={handleVenueOverlayClose}
          position="map"
        />
      )}
    </div>
  );
};

export default MapboxMap;
