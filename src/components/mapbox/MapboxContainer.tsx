"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMapbox, StaticMapFallback } from "@/context/MapboxContext";

interface MapboxContainerProps {
  userLocation?: { lat: number; lng: number } | null;
  isDarkMode?: boolean;
  className?: string;
  onMapReady?: (map: mapboxgl.Map) => void;
}

/**
 * MapboxContainer - The actual map rendering component
 *
 * CRITICAL: This component does NOT create new map instances on remount.
 * It uses the global singleton from MapboxContext.
 *
 * The map survives:
 * - Route navigation
 * - Component remounts
 * - Filter changes
 * - View toggles
 *
 * Only creates a new map when:
 * - First load of the session
 * - After window.__BNDY_MAP__ is explicitly cleared
 *
 * Access map via useMapbox() hook or onMapReady callback
 */
export function MapboxContainer({ userLocation, isDarkMode, className, onMapReady }: MapboxContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { map, isMapReady, isBot, initializeMap } = useMapbox();

  // Initialize map when container is ready
  useEffect(() => {
    if (!containerRef.current || isBot) return;

    // Initialize or retrieve existing map
    const mapInstance = initializeMap(containerRef.current);

    if (mapInstance) {
      // Notify parent when map is ready
      if (onMapReady) {
        onMapReady(mapInstance);
      }

      // Fly to user location if provided
      if (userLocation) {
        mapInstance.flyTo({
          center: [userLocation.lng, userLocation.lat],
          zoom: 12,
          duration: 1000,
        });
      }
    }
  }, [initializeMap, isBot, userLocation, onMapReady]);

  // Handle dark mode style changes
  useEffect(() => {
    if (!map || !isMapReady) return;

    // Mapbox style switching - doesn't count as new load
    const newStyle = isDarkMode
      ? "mapbox://styles/mapbox/dark-v11"
      : "mapbox://styles/mapbox/streets-v12";

    // Only change if different (setStyle is expensive)
    const currentStyle = map.getStyle();
    if (currentStyle?.name !== newStyle) {
      // Note: setStyle removes all custom layers/sources
      // We'll need to re-add markers after style change
      // For now, keeping consistent style
      // map.setStyle(newStyle);
    }
  }, [map, isMapReady, isDarkMode]);

  // Render static fallback for bots
  if (isBot) {
    return <StaticMapFallback />;
  }

  return (
    <div
      ref={containerRef}
      className={`w-full h-full ${className || ""}`}
      style={{ minHeight: "400px" }}
      aria-label="Interactive map"
      role="application"
    />
  );
}

export default MapboxContainer;
