// src/components/Map/UserLocationMarker.tsx
import { useEffect, useRef } from "react";
import L from "leaflet";
import { createUserLocationMarkerIcon } from "@/components/map/LeafletSettings/LeafletMarkers";

interface UserLocationMarkerProps {
  map: L.Map | null;
  userLocation: google.maps.LatLngLiteral | null;
}

export const UserLocationMarker = ({ map, userLocation }: UserLocationMarkerProps) => {
  const markerRef = useRef<L.Marker | null>(null);

  // Handle user location marker
  useEffect(() => {
    if (!map || !userLocation) {
      // Remove marker if map or location is not available
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      return;
    }

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }

    // Create new marker
    const userMarker = L.marker([userLocation.lat, userLocation.lng], {
      icon: createUserLocationMarkerIcon(),
      zIndexOffset: 1000 // Ensure user marker is on top
    });

    // Create a custom popup
    const popup = L.popup({
      className: 'user-location-popup',
      offset: [0, -15],
      closeButton: true,
      autoClose: true,
      closeOnClick: true
    }).setContent('Your Location');

    userMarker.bindPopup(popup);
    userMarker.addTo(map);
    markerRef.current = userMarker;

    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    };
  }, [map, userLocation]);

  // This is a functional component, so no markup is returned
  return null;
};