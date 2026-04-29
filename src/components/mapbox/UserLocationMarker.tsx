"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { useMapbox } from "@/context/MapboxContext";

interface UserLocationMarkerProps {
  userLocation: { lat: number; lng: number } | null;
}

/**
 * UserLocationMarker - Shows user's current location with pulsing effect
 *
 * Uses a custom HTML marker with CSS animation for the pulse effect,
 * similar to the Leaflet implementation.
 */
export function UserLocationMarker({ userLocation }: UserLocationMarkerProps) {
  const { map, isMapReady } = useMapbox();
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!map || !isMapReady || !userLocation) {
      // Remove marker if no location
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      return;
    }

    // Verify map container is valid before adding marker
    const mapContainer = map.getContainer();
    if (!mapContainer || !document.body.contains(mapContainer)) {
      return;
    }

    // Create custom HTML element for the marker
    const el = document.createElement("div");
    el.className = "mapbox-user-location-marker";
    el.innerHTML = `
      <div class="user-location-pulse"></div>
      <div class="user-location-dot"></div>
    `;

    // Create or update marker
    try {
      if (markerRef.current) {
        markerRef.current.setLngLat([userLocation.lng, userLocation.lat]);
      } else {
        markerRef.current = new mapboxgl.Marker({
          element: el,
          anchor: "center",
        })
          .setLngLat([userLocation.lng, userLocation.lat])
          .addTo(map);
      }
    } catch (e) {
      console.warn("[UserLocationMarker] Failed to add marker:", e);
    }

    // Cleanup
    return () => {
      // Don't remove on every render, only when component unmounts
    };
  }, [map, isMapReady, userLocation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    };
  }, []);

  return null;
}

export default UserLocationMarker;
