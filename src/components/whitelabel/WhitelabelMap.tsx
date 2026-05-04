'use client';

/**
 * White-label map component
 *
 * Simplified map view that shows events within tenant's configured radius.
 * Uses Mapbox GL JS via shared MapboxContext.
 */

import { useEffect, useRef, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useWhitelabel } from './WhitelabelProvider';
import { useWhitelabelEvents, type WhitelabelEvent } from '@/lib/whitelabel/hooks/useWhitelabelEvents';
import { MapPin, Music } from 'lucide-react';

// Get date range for next 8 weeks
function getDateRange() {
  const today = new Date();
  const startDate = today.toISOString().split('T')[0];

  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 56);
  const endDateStr = endDate.toISOString().split('T')[0];

  return { startDate, endDate: endDateStr };
}

// Set Mapbox token from environment
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
}

export function WhitelabelMap() {
  const { tenant } = useWhitelabel();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const { startDate, endDate } = getDateRange();
  const [selectedEvent, setSelectedEvent] = useState<WhitelabelEvent | null>(null);

  const { data: events, isLoading } = useWhitelabelEvents({
    center: tenant.location.center,
    radiusMiles: tenant.location.radiusMiles,
    startDate,
    endDate,
  });

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Determine map style based on tenant theme
    const isDark = tenant.theme.background === '#000000';
    const mapStyle = isDark
      ? 'mapbox://styles/mapbox/dark-v11'
      : 'mapbox://styles/mapbox/light-v11';

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [tenant.location.center.lng, tenant.location.center.lat],
      zoom: tenant.location.initialZoom,
      attributionControl: false,
    });

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add attribution in bottom right
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [tenant]);

  // Add markers when events load
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !events) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add markers for each event
    events.forEach((event) => {
      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'wl-marker';
      el.style.cssText = `
        width: 24px;
        height: 24px;
        background-color: ${tenant.theme.primary};
        border: 2px solid ${tenant.theme.secondary};
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      `;

      // Add marker to map
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([event.location.lng, event.location.lat])
        .addTo(map);

      // Click handler
      el.addEventListener('click', () => {
        setSelectedEvent(event);
      });

      markersRef.current.push(marker);
    });
  }, [events, tenant]);

  return (
    <div className="relative h-[calc(100vh-140px)]">
      {/* Map container */}
      <div ref={mapContainerRef} className="absolute inset-0" />

      {/* Loading indicator */}
      {isLoading && (
        <div
          className="absolute top-4 left-4 px-3 py-2 rounded-lg text-sm"
          style={{
            backgroundColor: tenant.theme.background,
            color: tenant.theme.foreground,
            border: `1px solid ${tenant.theme.primary}33`,
          }}
        >
          Loading events...
        </div>
      )}

      {/* Event count indicator */}
      {events && !isLoading && (
        <div
          className="absolute top-4 left-4 px-3 py-2 rounded-lg text-sm"
          style={{
            backgroundColor: tenant.theme.background,
            color: tenant.theme.foreground,
            border: `1px solid ${tenant.theme.primary}33`,
          }}
        >
          <span style={{ color: tenant.theme.primary }}>{events.length}</span>{' '}
          events within {tenant.location.radiusMiles} miles
        </div>
      )}

      {/* Selected event popup */}
      {selectedEvent && (
        <EventPopup
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}

interface EventPopupProps {
  event: WhitelabelEvent;
  onClose: () => void;
}

function EventPopup({ event, onClose }: EventPopupProps) {
  const { tenant } = useWhitelabel();

  // Format date
  const formattedDate = new Date(event.date + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <div
      className="absolute bottom-4 left-4 right-4 max-w-md mx-auto p-4 rounded-lg shadow-lg"
      style={{
        backgroundColor: tenant.theme.background,
        border: `2px solid ${tenant.theme.primary}`,
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full"
        style={{ backgroundColor: `${tenant.theme.primary}22` }}
      >
        ×
      </button>

      {/* Event name */}
      <h3
        className="font-bold text-lg mb-2 pr-6"
        style={{ color: tenant.theme.foreground }}
      >
        {event.name}
      </h3>

      {/* Event details */}
      <div className="space-y-1 text-sm" style={{ color: tenant.theme.foreground }}>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" style={{ color: tenant.theme.primary }} />
          <span>{event.venueName}</span>
        </div>
        <div className="flex items-center gap-2 opacity-80">
          <span>{formattedDate}</span>
          <span>•</span>
          <span>{event.startTime}</span>
          <span>•</span>
          <span>{event.distanceMiles.toFixed(1)} mi</span>
        </div>
        {event.artistName && event.artistName !== event.name && (
          <div
            className="mt-2 flex items-center gap-2"
            style={{ color: tenant.theme.secondary }}
          >
            <Music className="w-4 h-4" />
            <span>{event.artistName}</span>
          </div>
        )}
      </div>
    </div>
  );
}
