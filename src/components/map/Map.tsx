// src/components/Map/Map.tsx
"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useViewToggle } from "@/context/ViewToggleContext";
import { useEvents } from "@/context/EventsContext";
import { useVenues } from "@/hooks/useVenues";
import { useAllPublicEvents } from "@/hooks/useAllPublicEvents";
import type { Event, Venue } from "@/lib/types";
import { isDateInRange, DateRangeFilter } from "@/lib/utils/date-filter-utils";
import EventInfoOverlay from "../overlays/EventInfoOverlay";
import VenueInfoOverlay from "../overlays/VenueInfoOverlay";

// Dynamically import Leaflet‑based components with SSR disabled
const MapContainer = dynamic(
  () => import("./MapContainer").then((mod) => mod.MapContainer),
  { ssr: false }
);
const UserLocationMarker = dynamic(
  () =>
    import("./MarkerSettings/UserLocationMarker").then(
      (mod) => mod.UserLocationMarker
    ),
  { ssr: false }
);
const EventMarkerLayer = dynamic(
  () =>
    import("./MarkerSettings/EventMarkerLayer").then(
      (mod) => mod.EventMarkerLayer
    ),
  { ssr: false }
);
const VenueMarkerLayer = dynamic(
  () =>
    import("./MarkerSettings/VenueMarkerLayer").then(
      (mod) => mod.VenueMarkerLayer
    ),
  { ssr: false }
);
const MapControls = dynamic(
  () => import("./MapControls").then((mod) => mod.MapControls),
  { ssr: false }
);

// Dynamically import Leaflet CSS and configuration using ESM imports
const initLeaflet = async () => {
  await import("leaflet/dist/leaflet.css");
  await import("leaflet.markercluster/dist/MarkerCluster.css");
  await import("leaflet.markercluster/dist/MarkerCluster.Default.css");
  await import("./LeafletSettings/LeafletConfig");
};

import L, { Map as LMap, Marker as LMarker } from "leaflet";

// Map date range filter labels
const dateRangeLabels: Record<string, string> = {
  today: "Today",
  thisWeek: "This Week",
  thisWeekend: "This Weekend",
  nextWeek: "Next Week",
  nextWeekend: "Next Weekend",
};

type FilterType = "artist" | "venue" | "nomatch" | null;

interface MapProps {
  filterType?: FilterType;
  filterId?: string | null;
  entityExists?: boolean;
  onClearSearch?: () => void;
}

const Map = ({ filterType, filterId, entityExists = false, onClearSearch }: MapProps) => {

  const {
    userLocation,
    dateRange,
  } = useEvents();
  const { isDarkMode, mapMode } = useViewToggle();

  // Calculate date range for queries
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (dateRange) {
      case "today": {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return { startDate: today.toISOString().split('T')[0], endDate: tomorrow.toISOString().split('T')[0] };
      }
      case "thisWeek": {
        const endOfWeek = new Date(today);
        endOfWeek.setDate(endOfWeek.getDate() + (6 - today.getDay()));
        return { startDate: today.toISOString().split('T')[0], endDate: endOfWeek.toISOString().split('T')[0] };
      }
      case "thisWeekend": {
        const saturday = new Date(today);
        saturday.setDate(today.getDate() + (6 - today.getDay() || 7));
        const monday = new Date(saturday);
        monday.setDate(saturday.getDate() + 2);
        return { startDate: saturday.toISOString().split('T')[0], endDate: monday.toISOString().split('T')[0] };
      }
      case "nextWeek": {
        const startNextWeek = new Date(today);
        startNextWeek.setDate(today.getDate() + (7 - today.getDay()));
        const endNextWeek = new Date(startNextWeek);
        endNextWeek.setDate(startNextWeek.getDate() + 6);
        return { startDate: startNextWeek.toISOString().split('T')[0], endDate: endNextWeek.toISOString().split('T')[0] };
      }
      case "nextWeekend": {
        const todayDay = now.getDay();
        const daysUntilNextFriday = todayDay === 0 ? 5 : todayDay === 1 ? 11 : todayDay === 2 ? 10 : todayDay === 3 ? 9 : todayDay === 4 ? 8 : todayDay === 5 ? 7 : 6;
        const nextFriday = new Date(today);
        nextFriday.setDate(now.getDate() + daysUntilNextFriday);
        const nextSunday = new Date(nextFriday);
        nextSunday.setDate(nextFriday.getDate() + 2);
        return { startDate: nextFriday.toISOString().split('T')[0], endDate: nextSunday.toISOString().split('T')[0] };
      }
      default:
        return { startDate: undefined, endDate: undefined };
    }
  }, [dateRange]);

  // Fetch ALL public events in date range (matches venue pattern)
  const { data: allEvents = [], isLoading: eventsLoading } = useAllPublicEvents({
    startDate,
    endDate,
    enabled: mapMode === "events",
  });

  // Fetch all venues (only when in venue mode)
  const { data: venues = [], isLoading: venuesLoading } = useVenues();

  const [leafletInitialized, setLeafletInitialized] = useState(false);
  const leafletRef = useRef<typeof L | null>(null);

  // Map and marker refs (using Leaflet types)
  const mapRef = useRef<LMap | null>(null);
  const eventMarkersRef = useRef<Record<string, LMarker>>({});
  const venueMarkersRef = useRef<Record<string, LMarker>>({});
  const eventClusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const venueClusterRef = useRef<L.MarkerClusterGroup | null>(null);

  // UI state for overlays
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [showEventOverlay, setShowEventOverlay] = useState(false);
  const [showVenueOverlay, setShowVenueOverlay] = useState(false);

  // Filtered data
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>([]);
  const [eventLocationGroups, setEventLocationGroups] = useState<Record<string, Event[]>>({});
  // No Filter match message
  const getNoMatchMessage = () => {
    if (!filterType || !filterId) return "";

    if (filterType === "nomatch") {
      // Entity exists but no events in the current date range
      if (entityExists && dateRange) {
        const dateRangeLabel = dateRangeLabels[dateRange as string] || "selected date range";
        return `No events for "${filterId}" in ${dateRangeLabel}`;
      }
      // No matches at all
      return `No matches found for "${filterId}"`;
    }

    return "";
  };

  // Initialize Leaflet on client side only
  useEffect(() => {
    if (typeof window !== "undefined" && !leafletInitialized) {
      initLeaflet()
        .then(() => {
          import("leaflet").then((L) => {
            leafletRef.current = L;
            import("leaflet.markercluster");
            setLeafletInitialized(true);
          });
        })
        .catch((error) => {
          console.error("Error initializing Leaflet:", error);
        });
    }
  }, [leafletInitialized]); // <-- Added 'leafletInitialized' to the dependency array

  // Set up map click listener using Leaflet's API
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleMapClick = () => {
      // Close overlays without checking their previous state
      setShowEventOverlay(false);
      setSelectedEvents([]);
      setShowVenueOverlay(false);
      setSelectedVenue(null);

      // Always clear search on map click - this simpler approach is more reliable
      if (onClearSearch) {
        onClearSearch();
      }
    };

    map.on("click", handleMapClick);

    return () => {
      map.off("click", handleMapClick);
    };
  }, [onClearSearch]);


  // Apply filters to events
  useEffect(() => {
    if (!allEvents || allEvents.length === 0) return;
    const eventsOnly = allEvents.filter(
      (e): e is Event => (e as Event).date !== undefined
    );
    let dateFiltered = eventsOnly;
    if (dateRange) {
      dateFiltered = eventsOnly.filter((event) => {
        const eventDate = new Date(event.date);
        return isDateInRange(eventDate, dateRange as DateRangeFilter);
      });
    }
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
    const locationGroups: Record<string, Event[]> = {};
    searchFiltered.forEach((event) => {
      if (!event.location) return;
      const locationKey = `${event.location.lat},${event.location.lng}`;
      if (!locationGroups[locationKey]) {
        locationGroups[locationKey] = [];
      }
      locationGroups[locationKey].push(event);
    });
    setEventLocationGroups(locationGroups);
    const representativeEvents = Object.values(locationGroups).map(
      (group) => group[0]
    );
    setFilteredEvents(representativeEvents);
  }, [allEvents, dateRange, filterType, filterId]);

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

  // Highlight single search result: reposition map and simulate marker click.
  useEffect(() => {
    if (!filterType || !filterId || filterType === "nomatch") return;
    if (!leafletInitialized) return;

    // Only highlight and reposition for searches with 3+ characters
    if (filterId.length < 3) return;

    // Create a debounced function for repositioning
    const repositionTimeout = setTimeout(() => {
      if (mapMode === "events") {
        const activeData = filteredEvents;
        if (activeData.length === 1) {
          const eventItem = activeData[0];
          if (eventItem.location) {
            const latLng: [number, number] = [eventItem.location.lat, eventItem.location.lng];
            if (mapRef.current && typeof mapRef.current.flyTo === "function") {
              mapRef.current.flyTo(latLng, 15, { animate: true, duration: 0.5 });
            } else if (mapRef.current) {
              mapRef.current.setView(latLng, 15);
            }
            const key = `${eventItem.location.lat},${eventItem.location.lng}`;
            const group =
              eventLocationGroups[key] && eventLocationGroups[key].length > 1
                ? eventLocationGroups[key]
                : [eventItem];
            setTimeout(() => {
              handleEventClick(group);
            }, 600);
          }
        }
      } else if (mapMode === "venues") {
        const activeData = filteredVenues;
        if (activeData.length === 1) {
          const venueItem = activeData[0];
          if (venueItem.location) {
            const latLng: [number, number] = [venueItem.location.lat, venueItem.location.lng];
            if (mapRef.current && typeof mapRef.current.flyTo === "function") {
              mapRef.current.flyTo(latLng, 15, { animate: true, duration: 0.5 });
            } else if (mapRef.current) {
              mapRef.current.setView(latLng, 15);
            }
            setTimeout(() => {
              handleVenueClick(venueItem);
            }, 600);
          }
        }
      }
    }, 300); // Small delay to prevent immediate repositioning

    // Clean up timeout
    return () => clearTimeout(repositionTimeout);
  }, [filterType, filterId, mapMode, filteredEvents, filteredVenues, eventLocationGroups, leafletInitialized]);


  // Handle event marker click: sort events and open overlay
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

  // Handle venue marker click: open overlay
  const handleVenueClick = useCallback((venue: Venue) => {
    setSelectedVenue(venue);
    setShowVenueOverlay(true);
    setShowEventOverlay(false);
    setSelectedEvents([]);
  }, []);

  const renderMapComponents = leafletInitialized && typeof window !== "undefined";

  return (
    <div className="w-full h-full relative">
      {renderMapComponents && (
        <>
          <MapContainer ref={mapRef} userLocation={userLocation} isDarkMode={isDarkMode} />
          <UserLocationMarker map={mapRef.current} userLocation={userLocation} />
          <MapControls map={mapRef.current} userLocation={userLocation} />
          {mapMode === "events" && (
            <EventMarkerLayer
              map={mapRef.current}
              events={filteredEvents}
              eventGroups={eventLocationGroups}
              onEventClick={handleEventClick}
              markersRef={eventMarkersRef}
              clusterRef={eventClusterRef}
            />
          )}
          {mapMode === "venues" && (
            <VenueMarkerLayer
              map={mapRef.current}
              venues={filteredVenues}
              onVenueClick={handleVenueClick}
              markersRef={venueMarkersRef}
              clusterRef={venueClusterRef}
            />
          )}
        </>
      )}

      {(eventsLoading && mapMode === "events") && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-70 text-white p-4 rounded z-20">
          Loading events...
        </div>
      )}

      {(venuesLoading && mapMode === "venues") && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-70 text-white p-4 rounded z-20">
          Loading venues...
        </div>
      )}



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



      {!renderMapComponents && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-70 text-white p-4 rounded z-20">
          Loading map...
        </div>
      )}

      {selectedEvents.length > 0 && (
        <EventInfoOverlay
          events={selectedEvents}
          isOpen={showEventOverlay}
          onClose={() => {
            // Close the overlay
            setShowEventOverlay(false);
            setSelectedEvents([]);

            // Clear search filters
            if (onClearSearch) {
              onClearSearch();
            }
          }}
          position="map"
        />
      )}

      {selectedVenue && (
        <VenueInfoOverlay
          venue={selectedVenue}
          isOpen={showVenueOverlay}
          onClose={() => {
            // Close the overlay
            setShowVenueOverlay(false);
            setSelectedVenue(null);

            // Clear search filters
            if (onClearSearch) {
              onClearSearch();
            }
          }}
          position="map"
        />
      )}
    </div>
  );
};

export default Map;
