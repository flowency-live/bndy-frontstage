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
export function MapboxContainer({ userLocation, isDarkMode = true, className, onMapReady }: MapboxContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { map, isMapReady, isBot, initializeMap, setMapStyle, currentStyleMode } = useMapbox();
  const initializedWithThemeRef = useRef(false);

  // Initialize map when container is ready
  useEffect(() => {
    if (!containerRef.current || isBot) return;

    // Initialize or retrieve existing map with current theme
    const mapInstance = initializeMap(containerRef.current, isDarkMode);
    initializedWithThemeRef.current = true;

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
  }, [initializeMap, isBot, userLocation, onMapReady, isDarkMode]);

  // Handle dark mode style changes after initial load
  useEffect(() => {
    if (!map || !isMapReady) return;
    if (!initializedWithThemeRef.current) return;

    // Check if theme changed from current style
    const expectedMode = isDarkMode ? "dark" : "light";
    if (currentStyleMode !== expectedMode) {
      setMapStyle(isDarkMode);
    }
  }, [map, isMapReady, isDarkMode, setMapStyle, currentStyleMode]);

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
