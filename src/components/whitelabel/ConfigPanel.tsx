'use client';

/**
 * White-label configuration panel
 *
 * Allows admins to configure:
 * - Center point (click on map or enter coordinates)
 * - Radius in miles
 *
 * Shows live preview of event count within configured area.
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useWhitelabel } from './WhitelabelProvider';
import { useWhitelabelEvents } from '@/lib/whitelabel/hooks/useWhitelabelEvents';
import { MapPin, Save, RefreshCw } from 'lucide-react';

// Set Mapbox token from environment
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
}

// Get date range for preview
function getDateRange() {
  const today = new Date();
  const startDate = today.toISOString().split('T')[0];
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 56);
  return { startDate, endDate: endDate.toISOString().split('T')[0] };
}

export function ConfigPanel() {
  const { tenant } = useWhitelabel();

  // Config state - starts with tenant defaults
  const [center, setCenter] = useState(tenant.location.center);
  const [radiusMiles, setRadiusMiles] = useState(tenant.location.radiusMiles);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const circleRef = useRef<string | null>(null);

  const { startDate, endDate } = getDateRange();

  // Preview events with current config
  const { data: previewEvents, isLoading } = useWhitelabelEvents({
    center,
    radiusMiles,
    startDate,
    endDate,
  });

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const isDark = tenant.theme.background === '#000000';
    const mapStyle = isDark
      ? 'mapbox://styles/mapbox/dark-v11'
      : 'mapbox://styles/mapbox/light-v11';

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [center.lng, center.lat],
      zoom: 9,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add center marker
    const el = document.createElement('div');
    el.style.cssText = `
      width: 20px;
      height: 20px;
      background-color: ${tenant.theme.primary};
      border: 3px solid ${tenant.theme.secondary};
      border-radius: 50%;
      cursor: pointer;
    `;

    const marker = new mapboxgl.Marker({ element: el, draggable: true })
      .setLngLat([center.lng, center.lat])
      .addTo(map);

    marker.on('dragend', () => {
      const lngLat = marker.getLngLat();
      setCenter({ lat: lngLat.lat, lng: lngLat.lng });
    });

    markerRef.current = marker;

    // Click to set center
    map.on('click', (e) => {
      setCenter({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      marker.setLngLat([e.lngLat.lng, e.lngLat.lat]);
    });

    // Add radius circle when map loads
    map.on('load', () => {
      addRadiusCircle(map);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [tenant]);

  // Update marker and circle when center changes
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;

    markerRef.current.setLngLat([center.lng, center.lat]);
    updateRadiusCircle();
  }, [center]);

  // Update circle when radius changes
  useEffect(() => {
    updateRadiusCircle();
  }, [radiusMiles]);

  // Add radius circle to map
  function addRadiusCircle(map: mapboxgl.Map) {
    const circleId = 'radius-circle';

    // Create circle GeoJSON
    const circleGeoJSON = createCircleGeoJSON(center, radiusMiles);

    map.addSource(circleId, {
      type: 'geojson',
      data: circleGeoJSON,
    });

    map.addLayer({
      id: circleId,
      type: 'fill',
      source: circleId,
      paint: {
        'fill-color': tenant.theme.primary,
        'fill-opacity': 0.15,
      },
    });

    map.addLayer({
      id: `${circleId}-outline`,
      type: 'line',
      source: circleId,
      paint: {
        'line-color': tenant.theme.primary,
        'line-width': 2,
        'line-opacity': 0.6,
      },
    });

    circleRef.current = circleId;
  }

  // Update radius circle
  function updateRadiusCircle() {
    const map = mapRef.current;
    if (!map || !circleRef.current) return;

    const source = map.getSource(circleRef.current) as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(createCircleGeoJSON(center, radiusMiles));
    }
  }

  // Create circle GeoJSON from center and radius
  function createCircleGeoJSON(
    center: { lat: number; lng: number },
    radiusMiles: number
  ): GeoJSON.Feature<GeoJSON.Polygon> {
    const points = 64;
    const coords: [number, number][] = [];

    // Convert miles to degrees (approximate)
    const radiusLat = radiusMiles / 69; // ~69 miles per degree latitude
    const radiusLng = radiusMiles / (69 * Math.cos((center.lat * Math.PI) / 180));

    for (let i = 0; i < points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      const lng = center.lng + radiusLng * Math.cos(angle);
      const lat = center.lat + radiusLat * Math.sin(angle);
      coords.push([lng, lat]);
    }
    coords.push(coords[0]); // Close the polygon

    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [coords],
      },
    };
  }

  // Save config to API
  async function handleSave() {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const response = await fetch(`https://api.bndy.co.uk/api/tenants/${tenant.id}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: {
            center,
            radiusMiles,
            initialZoom: tenant.location.initialZoom,
          },
        }),
      });

      if (response.ok) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  }

  // Reset to tenant defaults
  function handleReset() {
    setCenter(tenant.location.center);
    setRadiusMiles(tenant.location.radiusMiles);
  }

  return (
    <div
      className="min-h-screen p-4"
      style={{
        backgroundColor: tenant.theme.background,
        color: tenant.theme.foreground,
      }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1
            className="text-2xl font-bold"
            style={{ color: tenant.theme.primary }}
          >
            {tenant.name} - Configuration
          </h1>
          <p className="text-sm opacity-60 mt-1">
            Configure the center point and radius for event filtering.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Map */}
          <div>
            <div
              ref={mapContainerRef}
              className="w-full h-80 rounded-lg"
              style={{ border: `2px solid ${tenant.theme.primary}33` }}
            />
            <p className="text-xs opacity-60 mt-2">
              Click on the map or drag the marker to set the center point.
            </p>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Coordinates display */}
            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: `${tenant.theme.primary}11`,
                border: `1px solid ${tenant.theme.primary}33`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4" style={{ color: tenant.theme.primary }} />
                <span className="font-semibold">Center Point</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block opacity-60 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={center.lat.toFixed(4)}
                    onChange={(e) => setCenter({ ...center, lat: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-1 rounded bg-black/20 border border-white/10"
                  />
                </div>
                <div>
                  <label className="block opacity-60 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={center.lng.toFixed(4)}
                    onChange={(e) => setCenter({ ...center, lng: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-1 rounded bg-black/20 border border-white/10"
                  />
                </div>
              </div>
            </div>

            {/* Radius slider */}
            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: `${tenant.theme.primary}11`,
                border: `1px solid ${tenant.theme.primary}33`,
              }}
            >
              <label className="block font-semibold mb-2">
                Radius: {radiusMiles} miles
              </label>
              <input
                type="range"
                min={5}
                max={50}
                step={5}
                value={radiusMiles}
                onChange={(e) => setRadiusMiles(parseInt(e.target.value))}
                className="w-full"
                style={{ accentColor: tenant.theme.primary }}
              />
              <div className="flex justify-between text-xs opacity-60 mt-1">
                <span>5 mi</span>
                <span>50 mi</span>
              </div>
            </div>

            {/* Preview */}
            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: `${tenant.theme.secondary}11`,
                border: `1px solid ${tenant.theme.secondary}33`,
              }}
            >
              <h3 className="font-semibold mb-2" style={{ color: tenant.theme.secondary }}>
                Preview
              </h3>
              {isLoading ? (
                <p className="text-sm opacity-60">Loading events...</p>
              ) : (
                <p className="text-lg">
                  <span style={{ color: tenant.theme.primary }} className="font-bold">
                    {previewEvents?.length || 0}
                  </span>{' '}
                  events within {radiusMiles} miles
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-opacity"
                style={{
                  backgroundColor: tenant.theme.primary,
                  color: tenant.theme.background,
                  opacity: isSaving ? 0.6 : 1,
                }}
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Config'}
              </button>

              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold border"
                style={{
                  borderColor: tenant.theme.primary,
                  color: tenant.theme.primary,
                }}
              >
                <RefreshCw className="w-4 h-4" />
                Reset
              </button>
            </div>

            {/* Save status */}
            {saveStatus === 'success' && (
              <p className="text-sm" style={{ color: '#22c55e' }}>
                Configuration saved successfully!
              </p>
            )}
            {saveStatus === 'error' && (
              <p className="text-sm" style={{ color: '#ef4444' }}>
                Failed to save. API endpoint not yet deployed.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
