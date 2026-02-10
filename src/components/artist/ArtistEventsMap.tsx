"use client";

import { useEffect, useRef, useMemo } from "react";
import { createRoot, Root } from "react-dom/client";
import L from "leaflet";
import { Event } from "@/lib/types";
import { completeLeafletIconFix } from "@/components/map/LeafletSettings/leaflet-icon-fix";
import { tileLayer } from "@/components/map/LeafletSettings/TileProviders";
import { createEventMarkerIcon } from "@/components/map/LeafletSettings/LeafletMarkers";
import EventMarkerPopup from "./EventMarkerPopup";

interface ArtistEventsMapProps {
  events: Event[];
}

/**
 * ArtistEventsMap - Displays artist events on a Leaflet map
 *
 * Features:
 * - Orange teardrop markers for each event location
 * - Clickable markers showing date, time, and venue via popup
 * - Count badge for multiple events at same location
 * - Auto-fits bounds to show all markers
 */
export default function ArtistEventsMap({ events }: ArtistEventsMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const popupRootsRef = useRef<Map<L.Marker, Root>>(new Map());

  // Filter events with valid locations
  const validEvents = useMemo(() => {
    return events.filter(
      (event) =>
        event.location &&
        event.location.lat !== 0 &&
        event.location.lng !== 0
    );
  }, [events]);

  // Group events by location
  const eventGroups = useMemo(() => {
    const groups: Record<string, Event[]> = {};

    validEvents.forEach((event) => {
      const locationKey = `${event.location.lat},${event.location.lng}`;
      if (!groups[locationKey]) {
        groups[locationKey] = [];
      }
      groups[locationKey].push(event);
    });

    return groups;
  }, [validEvents]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || validEvents.length === 0) return;

    // Fix Leaflet's default icon paths
    completeLeafletIconFix();

    // Don't reinitialize if map already exists
    if (mapRef.current) return;

    // Default center (UK)
    const defaultCenter: [number, number] = [54.0, -2.0];

    // Create map
    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 6,
      zoomControl: true,
      attributionControl: false,
      // Performance settings
      preferCanvas: true,
      fadeAnimation: false,
      markerZoomAnimation: false,
    });

    // Add tile layer
    L.tileLayer(tileLayer.url, {
      maxZoom: 19,
      className: tileLayer.className,
    }).addTo(map);

    mapRef.current = map;

    // Cleanup on unmount
    return () => {
      // Cleanup popup roots
      popupRootsRef.current.forEach((root) => {
        root.unmount();
      });
      popupRootsRef.current.clear();

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [validEvents.length]);

  // Add markers and fit bounds
  useEffect(() => {
    const map = mapRef.current;
    if (!map || validEvents.length === 0) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      marker.remove();
    });
    markersRef.current = [];

    // Cleanup popup roots
    popupRootsRef.current.forEach((root) => {
      root.unmount();
    });
    popupRootsRef.current.clear();

    // Create markers for each location group
    const bounds: [number, number][] = [];

    Object.entries(eventGroups).forEach(([, eventsAtLocation]) => {
      if (eventsAtLocation.length === 0) return;

      const firstEvent = eventsAtLocation[0];
      const { lat, lng } = firstEvent.location;

      // Add to bounds
      bounds.push([lat, lng]);

      // Create marker with count if multiple events
      const hasMultiple = eventsAtLocation.length > 1;
      const icon = createEventMarkerIcon(hasMultiple ? eventsAtLocation.length : undefined);

      const marker = L.marker([lat, lng], {
        icon,
        title: hasMultiple
          ? `${eventsAtLocation.length} events`
          : eventsAtLocation[0].venueName,
      });

      // Create popup content container
      const popupContainer = document.createElement("div");
      const root = createRoot(popupContainer);
      popupRootsRef.current.set(marker, root);

      // Create popup
      const popup = L.popup({
        closeButton: false,
        className: "artist-event-popup",
        maxWidth: 300,
        minWidth: 220,
      }).setContent(popupContainer);

      marker.bindPopup(popup);

      // Render popup content on open
      marker.on("popupopen", () => {
        root.render(
          <EventMarkerPopup
            events={eventsAtLocation}
            onClose={() => marker.closePopup()}
          />
        );
      });

      marker.addTo(map);
      markersRef.current.push(marker);
    });

    // Fit bounds if we have markers
    if (bounds.length > 0) {
      const latLngBounds = L.latLngBounds(bounds);
      if (latLngBounds.isValid()) {
        map.fitBounds(latLngBounds, {
          padding: [50, 50],
          maxZoom: 14,
        });
      }
    }
  }, [eventGroups, validEvents.length]);

  // Empty state
  if (validEvents.length === 0) {
    return (
      <div
        data-testid="artist-events-map"
        aria-label="Artist events map - no events to display"
        className="h-[400px] md:h-[500px] rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
      >
        <p className="text-slate-500 dark:text-slate-400">No events to display on map</p>
      </div>
    );
  }

  return (
    <div
      data-testid="artist-events-map"
      aria-label={`Artist events map showing ${validEvents.length} events`}
      className="h-[400px] md:h-[500px] rounded-lg overflow-hidden relative"
    >
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Custom popup styles */}
      <style jsx global>{`
        .artist-event-popup .leaflet-popup-content-wrapper {
          padding: 0;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .artist-event-popup .leaflet-popup-content {
          margin: 0;
        }
        .artist-event-popup .leaflet-popup-tip {
          background: white;
        }
        .dark .artist-event-popup .leaflet-popup-content-wrapper {
          background: #1e293b;
        }
        .dark .artist-event-popup .leaflet-popup-tip {
          background: #1e293b;
        }
      `}</style>
    </div>
  );
}
