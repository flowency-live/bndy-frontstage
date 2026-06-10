"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { useMapbox } from "@/context/MapboxContext";
import { createMarkerElement } from "./markerElements";

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

    // Neon kit user-location marker (blue core + sonar, styles/markers.css)
    const el = createMarkerElement({ type: "user" });

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
