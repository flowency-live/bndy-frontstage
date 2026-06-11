"use client";

import { useEffect, useRef, useState } from "react";
import { createRoot, Root } from "react-dom/client";
import { Event } from "@/lib/types";
import { MapPin, Calendar, Clock, ExternalLink } from "lucide-react";
import { createMarkerElement, clusterTier } from "@/components/mapbox/markerElements";
import { useViewToggle } from "@/context/ViewToggleContext";
import { useEvents } from "@/context/EventsContext";
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
  const { isDarkMode } = useViewToggle();
  const { userLocation } = useEvents();
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

  // Load Leaflet and its CSS dynamically (client-side only)
  useEffect(() => {
    let mounted = true;

    // Load CSS first, then Leaflet
    Promise.all([
      import("leaflet/dist/leaflet.css"),
      import("leaflet"),
    ]).then(([, L]) => {
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

    // CARTO tiles (free, no API key) — dark_all matches the neon theme
    const tileStyle = isDarkMode ? "dark_all" : "rastertiles/voyager";
    L.tileLayer(`https://{s}.basemaps.cartocdn.com/${tileStyle}/{z}/{x}/{y}{r}.png`, {
      maxZoom: 19,
      subdomains: "abcd",
    }).addTo(map);

    // Create layer group for markers
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    // Force resize multiple times to ensure proper dimensions
    // This is necessary because the container may not have final dimensions immediately
    const invalidateSizes = () => {
      map.invalidateSize();
    };

    // Call invalidateSize at various intervals
    requestAnimationFrame(invalidateSizes);
    setTimeout(invalidateSizes, 100);
    setTimeout(invalidateSizes, 300);
    setTimeout(() => {
      invalidateSizes();
      setIsMapReady(true);
    }, 500);

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

      // Neon glass markers (same system as the main map — markers.css).
      // Leaflet positions the divIcon wrapper itself, and createMarkerElement
      // returns a style-inert .bndy-mk-anchor root, so transforms never clash.
      const markerEl = createMarkerElement(
        count > 1
          ? { type: "cluster", count, kind: "gig" }
          : { type: "gig", label: group.venueName },
      );
      const tierSizes = { sm: 32, md: 40, lg: 48 } as const;
      const size = count > 1 ? tierSizes[clusterTier(count)] : 18;

      const icon = L.divIcon({
        className: "artist-map-marker-wrapper",
        html: markerEl.outerHTML,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -(size / 2 + 6)],
      });

      const marker = L.marker([group.lat, group.lng], { icon });

      // Create popup
      const popupContainer = document.createElement("div");
      popupContainer.className = "artist-popup-container";
      const popupKey = `popup-${index}`;

      const popup = L.popup({
        closeButton: false,
        className: "artist-map-popup",
        maxWidth: 300,
        minWidth: 250,
        autoPan: true,
        autoPanPadding: L.point(24, 24),
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

      // Centre the clicked marker low in the view so the popup (which opens
      // upward) is fully visible inside the small map container.
      marker.on("click", () => {
        const px = map.project(marker.getLatLng(), map.getZoom());
        px.y -= 110; // half the typical popup height
        map.panTo(map.unproject(px, map.getZoom()), { animate: true });
      });

      marker.addTo(markersLayer);
    });

    // "You are here" dot (neon kit user marker)
    if (userLocation) {
      const userEl = createMarkerElement({ type: "user" });
      const userIcon = L.divIcon({
        className: "artist-map-marker-wrapper",
        html: userEl.outerHTML,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
        interactive: false,
        zIndexOffset: -100,
      }).addTo(markersLayer);
    }

    // Frame the view around the user AND the gigs when we know where the
    // user is (so "how far from me?" is answered at a glance); gigs only
    // otherwise. maxZoom keeps the close-together case readable.
    setTimeout(() => {
      const frame: [number, number][] = [...bounds];
      if (userLocation) frame.push([userLocation.lat, userLocation.lng]);
      if (frame.length > 0) {
        const latLngBounds = L.latLngBounds(frame);
        if (latLngBounds.isValid()) {
          map.fitBounds(latLngBounds, {
            padding: [50, 50],
            maxZoom: 11,
          });
        }
      }
    }, 50);
  }, [leaflet, eventGroups, isMapReady, userLocation]);

  // Empty state
  if (validEvents.length === 0) {
    return (
      <div
        data-testid="artist-events-map"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '300px',
          background: 'var(--lv-bg-2)',
          borderRadius: '12px',
        }}
      >
        <MapPin className="w-12 h-12 text-[var(--lv-text-3)] mb-3" />
        <p className="text-[var(--lv-text-2)]">No events with location data</p>
      </div>
    );
  }

  return (
    <div
      data-testid="artist-events-map"
      className="artist-events-map"
      style={{
        position: 'relative',
        width: '100%',
        height: '450px',
        borderRadius: '12px',
        overflow: 'hidden',
        background: 'var(--lv-bg-2)',
      }}
    >
      {/* Loading overlay */}
      {!isMapReady && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--lv-bg-2)',
          zIndex: 1000,
          gap: '12px',
          color: 'var(--lv-text-2)',
          fontSize: '14px',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid var(--lv-rule)',
            borderTopColor: 'var(--lv-orange)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <p>Loading map...</p>
        </div>
      )}

      {/* Map container - MUST have explicit dimensions */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
        }}
      />

      {/* Legend */}
      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        background: 'var(--lv-bg)',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        fontSize: '12px',
        color: 'var(--lv-text-2)',
        zIndex: 500,
      }}>
        <span style={{
          width: '10px',
          height: '10px',
          background: 'var(--lv-orange)',
          borderRadius: '50%',
        }} />
        <span>
          {eventGroups.length} venue{eventGroups.length !== 1 ? "s" : ""} ·{" "}
          {validEvents.length} event{validEvents.length !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
