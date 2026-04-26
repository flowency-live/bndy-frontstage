"use client";

import React, { createContext, useContext, useRef, useCallback, useState, useEffect, ReactNode } from "react";
import mapboxgl from "mapbox-gl";

// Set Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

// Type declaration for window with map instance
declare global {
  interface Window {
    __BNDY_MAP__: mapboxgl.Map | null;
  }
}

interface MapboxContextValue {
  map: mapboxgl.Map | null;
  mapContainer: HTMLDivElement | null;
  isMapReady: boolean;
  isBot: boolean;
  initializeMap: (container: HTMLDivElement) => mapboxgl.Map | null;
  setMapContainer: (container: HTMLDivElement | null) => void;
}

const MapboxContext = createContext<MapboxContextValue | null>(null);

/**
 * Bot detection - prevents map loads from crawlers
 * Mapbox charges per load, so blocking bots saves money
 */
function detectBot(): boolean {
  if (typeof navigator === "undefined") return false;
  const botPatterns = /bot|crawler|spider|crawling|googlebot|bingbot|yandex|baidu|duckduckbot|slurp|facebook|twitter|linkedin|whatsapp/i;
  return botPatterns.test(navigator.userAgent);
}

interface MapboxProviderProps {
  children: ReactNode;
}

/**
 * MapboxProvider - Global singleton pattern for Mapbox GL JS
 *
 * CRITICAL FOR BILLING:
 * - Creates ONE map instance per session
 * - Persists across route navigation
 * - Reuses existing map on remount
 * - Blocks bot/crawler loads
 *
 * Usage: Wrap your app/layout with this provider
 */
export function MapboxProvider({ children }: MapboxProviderProps) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapContainer, setMapContainer] = useState<HTMLDivElement | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isBot] = useState(() => detectBot());

  // Initialize or retrieve the global map instance
  const initializeMap = useCallback((container: HTMLDivElement): mapboxgl.Map | null => {
    // Don't create map for bots
    if (isBot) {
      console.log("[MapboxProvider] Bot detected, skipping map initialization");
      return null;
    }

    // Check for existing global instance (survives HMR and route changes)
    if (typeof window !== "undefined" && window.__BNDY_MAP__) {
      console.log("[MapboxProvider] Reusing existing map instance");
      const existingMap = window.__BNDY_MAP__;

      // Move map to new container if different
      const currentContainer = existingMap.getContainer();
      if (currentContainer !== container) {
        // Mapbox doesn't support moving containers, so we need to check if valid
        if (currentContainer.parentElement) {
          console.log("[MapboxProvider] Map already mounted in another container");
        }
      }

      mapRef.current = existingMap;

      // Check if style is already loaded before setting ready
      if (existingMap.isStyleLoaded()) {
        setIsMapReady(true);
      } else {
        // Wait for style to finish loading
        existingMap.once("style.load", () => {
          console.log("[MapboxProvider] Style loaded on existing map");
          setIsMapReady(true);
        });
      }
      return existingMap;
    }

    // Check for existing ref instance
    if (mapRef.current) {
      console.log("[MapboxProvider] Reusing ref map instance");
      // Check if style is already loaded
      if (mapRef.current.isStyleLoaded()) {
        setIsMapReady(true);
      } else {
        mapRef.current.once("style.load", () => {
          setIsMapReady(true);
        });
      }
      return mapRef.current;
    }

    // Validate token exists
    if (!mapboxgl.accessToken) {
      console.error("[MapboxProvider] Mapbox access token not configured");
      return null;
    }

    console.log("[MapboxProvider] Creating new map instance (billable load)");

    // Create new map - THIS IS A BILLABLE EVENT
    const map = new mapboxgl.Map({
      container,
      style: "mapbox://styles/mapbox/streets-v12", // Can customize later
      center: [-2.0, 54.0], // UK center
      zoom: 6,
      attributionControl: true,
      trackResize: true,
      // Performance optimizations
      antialias: true,
      fadeDuration: 0, // Instant tile transitions
      crossSourceCollisions: false, // Better clustering performance
    });

    // Store globally to survive route changes
    if (typeof window !== "undefined") {
      window.__BNDY_MAP__ = map;
    }
    mapRef.current = map;

    // Mark ready when loaded
    map.on("load", () => {
      console.log("[MapboxProvider] Map loaded successfully");
      setIsMapReady(true);
    });

    map.on("error", (e) => {
      console.error("[MapboxProvider] Map error:", e);
    });

    return map;
  }, [isBot]);

  // Cleanup on unmount (rare - only on full app close)
  useEffect(() => {
    return () => {
      // Don't cleanup - we want to persist across routes
      // Only cleanup on actual app/window close
      console.log("[MapboxProvider] Provider unmounting (map preserved)");
    };
  }, []);

  const value: MapboxContextValue = {
    map: mapRef.current,
    mapContainer,
    isMapReady,
    isBot,
    initializeMap,
    setMapContainer,
  };

  return (
    <MapboxContext.Provider value={value}>
      {children}
    </MapboxContext.Provider>
  );
}

/**
 * Hook to access Mapbox context
 * Must be used within MapboxProvider
 */
export function useMapbox(): MapboxContextValue {
  const context = useContext(MapboxContext);
  if (!context) {
    throw new Error("useMapbox must be used within MapboxProvider");
  }
  return context;
}

/**
 * Static map image fallback for bots
 * Renders a placeholder instead of loading Mapbox
 */
export function StaticMapFallback() {
  return (
    <div
      className="w-full h-full bg-gradient-to-b from-blue-100 to-blue-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center"
      role="img"
      aria-label="Map placeholder for non-interactive users"
    >
      <div className="text-center text-muted-foreground">
        <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        <p>Interactive map not available</p>
      </div>
    </div>
  );
}
