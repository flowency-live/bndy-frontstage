"use client";

import React, { createContext, useContext, useRef, useCallback, useState, useEffect, ReactNode } from "react";
import mapboxgl from "mapbox-gl";

// Set Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

/**
 * Map styles for light/dark themes
 * navigation-night-v1 has blue tones that match bndy's dark blue brand
 */
export const MAPBOX_STYLES = {
  dark: "mapbox://styles/mapbox/navigation-night-v1",
  light: "mapbox://styles/mapbox/light-v11",
} as const;

export type MapStyleMode = "dark" | "light";

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
  currentStyleMode: MapStyleMode | null;
  initializeMap: (container: HTMLDivElement, isDarkMode?: boolean) => mapboxgl.Map | null;
  setMapContainer: (container: HTMLDivElement | null) => void;
  setMapStyle: (isDarkMode: boolean) => void;
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
  const [currentStyleMode, setCurrentStyleMode] = useState<MapStyleMode | null>(null);

  // Switch map style based on theme
  const setMapStyle = useCallback((isDarkMode: boolean) => {
    if (!mapRef.current) return;

    const newMode: MapStyleMode = isDarkMode ? "dark" : "light";
    if (newMode === currentStyleMode) return; // No change needed

    const newStyle = MAPBOX_STYLES[newMode];
    console.log("[MapboxProvider] Switching style to:", newMode);

    // Mark not ready while style loads - this tells marker layers to wait
    setIsMapReady(false);

    mapRef.current.setStyle(newStyle);
    mapRef.current.once("style.load", () => {
      console.log("[MapboxProvider] New style loaded:", newMode);
      setCurrentStyleMode(newMode);
      setIsMapReady(true);
    });
  }, [currentStyleMode]);

  // Initialize or retrieve the global map instance
  const initializeMap = useCallback((container: HTMLDivElement, isDarkMode: boolean = true): mapboxgl.Map | null => {
    // Don't create map for bots
    if (isBot) {
      console.log("[MapboxProvider] Bot detected, skipping map initialization");
      return null;
    }

    // Check for existing global instance (survives HMR and route changes)
    if (typeof window !== "undefined" && window.__BNDY_MAP__) {
      const existingMap = window.__BNDY_MAP__;
      const currentContainer = existingMap.getContainer();

      // Check if the existing container is still in the DOM
      if (currentContainer && currentContainer.parentElement && document.body.contains(currentContainer)) {
        // Container is valid and in DOM - can reuse
        if (currentContainer === container) {
          console.log("[MapboxProvider] Reusing existing map instance (same container)");
          mapRef.current = existingMap;

          // Check style load state with try-catch (can throw if map is in bad state)
          let styleLoaded = false;
          try {
            styleLoaded = existingMap.isStyleLoaded();
          } catch {
            styleLoaded = false;
          }

          if (styleLoaded) {
            setIsMapReady(true);
          } else {
            existingMap.once("style.load", () => {
              console.log("[MapboxProvider] Style loaded on existing map");
              setIsMapReady(true);
            });
          }
          return existingMap;
        } else {
          // Different container but old one still valid - shouldn't happen often
          console.log("[MapboxProvider] Map exists in different container");
        }
      } else {
        // Container is gone (navigation removed it) - must recreate map
        console.log("[MapboxProvider] Old container removed, recreating map");
        try {
          existingMap.remove();
        } catch (e) {
          console.warn("[MapboxProvider] Error removing old map:", e);
        }
        window.__BNDY_MAP__ = null;
        mapRef.current = null;
        setIsMapReady(false);
        // Fall through to create new map
      }
    }

    // Check for existing ref instance
    if (mapRef.current) {
      const refContainer = mapRef.current.getContainer();
      // Only reuse if container is still valid
      if (refContainer && document.body.contains(refContainer)) {
        console.log("[MapboxProvider] Reusing ref map instance");

        // Check style load state with try-catch (can throw if map is in bad state)
        let styleLoaded = false;
        try {
          styleLoaded = mapRef.current.isStyleLoaded();
        } catch {
          styleLoaded = false;
        }

        if (styleLoaded) {
          setIsMapReady(true);
        } else {
          mapRef.current.once("style.load", () => {
            setIsMapReady(true);
          });
        }
        return mapRef.current;
      } else {
        // Ref map's container is gone
        console.log("[MapboxProvider] Ref map container invalid, will create new");
        mapRef.current = null;
      }
    }

    // Validate token exists
    if (!mapboxgl.accessToken) {
      console.error("[MapboxProvider] Mapbox access token not configured");
      return null;
    }

    const initialMode: MapStyleMode = isDarkMode ? "dark" : "light";
    const initialStyle = MAPBOX_STYLES[initialMode];
    console.log("[MapboxProvider] Creating new map instance (billable load), style:", initialMode);

    // Create new map - THIS IS A BILLABLE EVENT
    const map = new mapboxgl.Map({
      container,
      style: initialStyle,
      center: [-2.0, 54.0], // UK center
      zoom: 6,
      attributionControl: true,
      trackResize: true,
      // Performance optimizations
      antialias: true,
      fadeDuration: 0, // Instant tile transitions
      crossSourceCollisions: false, // Better clustering performance
    });

    setCurrentStyleMode(initialMode);

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
    currentStyleMode,
    initializeMap,
    setMapContainer,
    setMapStyle,
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
