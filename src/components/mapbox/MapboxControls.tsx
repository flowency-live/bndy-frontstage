"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { useMapbox } from "@/context/MapboxContext";

interface MapboxControlsProps {
  userLocation: { lat: number; lng: number } | null;
}

/**
 * MapboxControls - Navigation and location controls for Mapbox
 *
 * Adds:
 * - Zoom in/out buttons (Mapbox NavigationControl)
 * - Locate user button (custom)
 */
export function MapboxControls({ userLocation }: MapboxControlsProps) {
  const { map, isMapReady } = useMapbox();
  const navigationControlRef = useRef<mapboxgl.NavigationControl | null>(null);
  const locateButtonRef = useRef<HTMLDivElement | null>(null);

  // Add Mapbox NavigationControl (zoom buttons)
  useEffect(() => {
    if (!map || !isMapReady) return;

    // Only add if not already added
    if (!navigationControlRef.current) {
      navigationControlRef.current = new mapboxgl.NavigationControl({
        showCompass: false, // Just zoom buttons, no compass
      });
      map.addControl(navigationControlRef.current, "top-right");
    }

    return () => {
      // Don't remove on unmount to preserve across route changes
    };
  }, [map, isMapReady]);

  // Add custom locate button
  useEffect(() => {
    if (!map || !isMapReady) return;

    // Create locate button container
    if (!locateButtonRef.current) {
      const container = document.createElement("div");
      container.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
      container.style.marginTop = "10px";

      const button = document.createElement("button");
      button.className = "mapboxgl-ctrl-icon";
      button.type = "button";
      button.title = "Center on my location";
      button.setAttribute("aria-label", "Center on my location");
      button.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" style="display:block;margin:auto;">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="22" y1="12" x2="18" y2="12"></line>
          <line x1="6" y1="12" x2="2" y2="12"></line>
          <line x1="12" y1="6" x2="12" y2="2"></line>
          <line x1="12" y1="22" x2="12" y2="18"></line>
        </svg>
      `;

      button.addEventListener("click", () => {
        if (userLocation && map) {
          map.flyTo({
            center: [userLocation.lng, userLocation.lat],
            zoom: 14,
            duration: 500,
          });
        }
      });

      container.appendChild(button);

      // Find the navigation control and add after it
      const mapContainer = map.getContainer();
      const ctrlTopRight = mapContainer.querySelector(".mapboxgl-ctrl-top-right");
      if (ctrlTopRight) {
        ctrlTopRight.appendChild(container);
      }

      locateButtonRef.current = container;
    }

    return () => {
      // Don't remove on unmount to preserve across route changes
    };
  }, [map, isMapReady, userLocation]);

  // Update click handler when userLocation changes
  useEffect(() => {
    if (!locateButtonRef.current || !map) return;

    const button = locateButtonRef.current.querySelector("button");
    if (button) {
      // Replace event listener with new one that has updated userLocation
      const newButton = button.cloneNode(true) as HTMLButtonElement;
      newButton.addEventListener("click", () => {
        if (userLocation && map) {
          map.flyTo({
            center: [userLocation.lng, userLocation.lat],
            zoom: 14,
            duration: 500,
          });
        }
      });
      button.parentNode?.replaceChild(newButton, button);
    }
  }, [userLocation, map]);

  // This component doesn't render anything - it manages map controls
  return null;
}

export default MapboxControls;
