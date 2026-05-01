"use client";

import { useEffect, useRef, useState } from "react";
import { createRoot, Root } from "react-dom/client";
import { Event } from "@/lib/types";
import { MapPin, Calendar, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";

interface ArtistEventsMapProps {
  events: Event[];
}

interface EventGroup {
  lat: number;
  lng: number;
  events: Event[];
  venueName: string;
  venueId: string;
}

/**
 * Format date for display
 */
function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/**
 * Format time for display
 */
function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes}${ampm}`;
}

/**
 * Popup content component
 */
function PopupContent({ group, onClose }: { group: EventGroup; onClose: () => void }) {
  return (
    <div className="artist-popup">
      {/* Header */}
      <div className="artist-popup-header">
        <Link
          href={`/venues/${group.venueId}`}
          className="artist-popup-venue"
          onClick={(e) => e.stopPropagation()}
        >
          {group.venueName}
        </Link>
        <button
          className="artist-popup-close"
          onClick={onClose}
          aria-label="Close popup"
        >
          ×
        </button>
      </div>

      {/* Events list */}
      <div className="artist-popup-events">
        {group.events.slice(0, 5).map((event) => (
          <div key={event.id} className="artist-popup-event">
            <div className="artist-popup-event-date">
              <Calendar className="w-3.5 h-3.5" />
              {formatEventDate(event.date)}
            </div>
            <div className="artist-popup-event-time">
              <Clock className="w-3.5 h-3.5" />
              {formatTime(event.startTime)}
            </div>
          </div>
        ))}
        {group.events.length > 5 && (
          <div className="artist-popup-more">
            +{group.events.length - 5} more events
          </div>
        )}
      </div>

      {/* View venue link */}
      <Link
        href={`/venues/${group.venueId}`}
        className="artist-popup-link"
        onClick={(e) => e.stopPropagation()}
      >
        View Venue
        <ExternalLink className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

/**
 * ArtistEventsMap - Displays artist events on an interactive map
 *
 * Refactored for reliability:
 * - Uses dynamic import for Leaflet (SSR-safe)
 * - Simplified lifecycle management
 * - Custom styled popups with event details
 * - Responsive design with proper container sizing
 */
export default function ArtistEventsMap({ events }: ArtistEventsMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const popupRootsRef = useRef<Map<string, Root>>(new Map());
  const [isMapReady, setIsMapReady] = useState(false);
  const [leaflet, setLeaflet] = useState<typeof import("leaflet") | null>(null);

  // Filter events with valid locations
  const validEvents = events.filter(
    (event) =>
      event.location &&
      typeof event.location.lat === "number" &&
      typeof event.location.lng === "number" &&
      event.location.lat !== 0 &&
      event.location.lng !== 0
  );

  // Group events by location (venue)
  const eventGroups: EventGroup[] = [];
  const groupMap = new Map<string, EventGroup>();

  validEvents.forEach((event) => {
    const key = `${event.location.lat.toFixed(5)},${event.location.lng.toFixed(5)}`;
    if (!groupMap.has(key)) {
      const group: EventGroup = {
        lat: event.location.lat,
        lng: event.location.lng,
        events: [],
        venueName: event.venueName,
        venueId: event.venueId,
      };
      groupMap.set(key, group);
      eventGroups.push(group);
    }
    groupMap.get(key)!.events.push(event);
  });

  // Load Leaflet dynamically (client-side only)
  useEffect(() => {
    let mounted = true;

    import("leaflet").then((L) => {
      if (!mounted) return;

      // Fix default icon paths for Leaflet
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      setLeaflet(L);
    });

    return () => {
      mounted = false;
    };
  }, []);

  // Initialize map when Leaflet is loaded
  useEffect(() => {
    if (!leaflet || !mapContainerRef.current) return;

    // Don't reinitialize if map exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.invalidateSize();
      return;
    }

    const L = leaflet;

    // Create map instance
    const map = L.map(mapContainerRef.current, {
      center: [54.0, -2.0], // UK center
      zoom: 6,
      zoomControl: true,
      attributionControl: false,
    });

    // Add CARTO Voyager tiles (free, no API key needed)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      subdomains: "abcd",
    }).addTo(map);

    // Create layer group for markers
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    // Force resize after mount to ensure proper dimensions
    requestAnimationFrame(() => {
      map.invalidateSize();
      setIsMapReady(true);
    });

    // Cleanup on unmount
    return () => {
      popupRootsRef.current.forEach((root) => root.unmount());
      popupRootsRef.current.clear();
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
      setIsMapReady(false);
    };
  }, [leaflet]);

  // Add markers when map is ready and events change
  useEffect(() => {
    if (!leaflet || !mapInstanceRef.current || !markersLayerRef.current || !isMapReady) return;

    const L = leaflet;
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;

    // Clear existing markers
    markersLayer.clearLayers();

    // Cleanup old popup roots
    popupRootsRef.current.forEach((root) => root.unmount());
    popupRootsRef.current.clear();

    if (eventGroups.length === 0) return;

    const bounds: [number, number][] = [];

    eventGroups.forEach((group, index) => {
      bounds.push([group.lat, group.lng]);

      const count = group.events.length;

      // Create custom SVG marker
      const markerHtml = `
        <div class="artist-map-marker">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 28 38">
            <defs>
              <filter id="marker-shadow-${index}" x="-50%" y="-20%" width="200%" height="150%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.3"/>
              </filter>
            </defs>
            <path d="M14,0 C6.3,0 0,6.3 0,14 C0,24 14,38 14,38 C14,38 28,24 28,14 C28,6.3 21.7,0 14,0 Z"
              fill="#F97316" stroke="#FFFFFF" stroke-width="2.5" filter="url(#marker-shadow-${index})"/>
            ${count > 1
              ? `<text x="14" y="16" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700"
                  text-anchor="middle" dominant-baseline="middle" fill="#FFFFFF">${count}</text>`
              : `<circle cx="14" cy="14" r="5" fill="#FFFFFF"/>`
            }
          </svg>
        </div>
      `;

      const icon = L.divIcon({
        className: "artist-map-marker-wrapper",
        html: markerHtml,
        iconSize: [32, 42],
        iconAnchor: [16, 42],
        popupAnchor: [0, -38],
      });

      const marker = L.marker([group.lat, group.lng], { icon });

      // Create popup
      const popupContainer = document.createElement("div");
      popupContainer.className = "artist-popup-container";
      const popupKey = `popup-${index}`;

      const popup = L.popup({
        closeButton: false,
        className: "artist-map-popup",
        maxWidth: 320,
        minWidth: 260,
        autoPan: true,
      }).setContent(popupContainer);

      marker.bindPopup(popup);

      // Render React content on popup open
      marker.on("popupopen", () => {
        if (!popupRootsRef.current.has(popupKey)) {
          const root = createRoot(popupContainer);
          popupRootsRef.current.set(popupKey, root);
        }

        const root = popupRootsRef.current.get(popupKey)!;
        root.render(
          <PopupContent group={group} onClose={() => marker.closePopup()} />
        );
      });

      marker.addTo(markersLayer);
    });

    // Fit bounds to show all markers
    if (bounds.length > 0) {
      const latLngBounds = L.latLngBounds(bounds as [number, number][]);
      if (latLngBounds.isValid()) {
        // Small delay to ensure map is fully rendered
        setTimeout(() => {
          map.fitBounds(latLngBounds, {
            padding: [50, 50],
            maxZoom: 11,
          });
        }, 50);
      }
    }
  }, [leaflet, eventGroups, isMapReady]);

  // Empty state
  if (validEvents.length === 0) {
    return (
      <div className="artist-map-empty" data-testid="artist-events-map">
        <MapPin className="w-12 h-12 text-[var(--lv-text-3)] mb-3" />
        <p className="text-[var(--lv-text-2)]">No events with location data</p>
      </div>
    );
  }

  return (
    <div className="artist-map-wrapper" data-testid="artist-events-map">
      {/* Loading overlay */}
      {!isMapReady && (
        <div className="artist-map-loading">
          <div className="artist-map-spinner" />
          <p>Loading map...</p>
        </div>
      )}

      {/* Map container */}
      <div ref={mapContainerRef} className="artist-map" />

      {/* Legend */}
      <div className="artist-map-legend">
        <span className="artist-map-legend-dot" />
        <span>
          {eventGroups.length} venue{eventGroups.length !== 1 ? "s" : ""} ·{" "}
          {validEvents.length} event{validEvents.length !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
