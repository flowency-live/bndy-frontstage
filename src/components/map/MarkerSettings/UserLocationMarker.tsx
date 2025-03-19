// src/components/Map/UserLocationMarker.tsx
import { useEffect, useRef } from "react";
import L from "leaflet";

interface UserLocationMarkerProps {
  map: L.Map | null;
  userLocation: google.maps.LatLngLiteral | null;
}

export const UserLocationMarker = ({ map, userLocation }: UserLocationMarkerProps) => {
  const markerRef = useRef<L.Marker | null>(null);
  const initialRenderRef = useRef<boolean>(true);

  // Handle user location marker
  useEffect(() => {
    if (!map) return;
    
    // Function to create or update marker
    const createOrUpdateMarker = () => {
      // If no user location yet, don't show a marker
      if (!userLocation) {
        cleanupMarker();
        return;
      }

      // Create HTML for a more visible marker
      const userMarkerHtml = `
        <div class="user-location-marker">
          <div class="user-location-pulse"></div>
          <div class="user-location-dot"></div>
        </div>
      `;

      // Determine marker position
      const position: L.LatLngExpression = [userLocation.lat, userLocation.lng];
      
      // Create or update marker
      if (!markerRef.current) {
        // Find and remove any duplicate user location markers
        map.eachLayer((layer) => {
          if (layer instanceof L.Marker) {
            const el = layer.getElement();
            if (el && el.querySelector('.user-location-marker')) {
              layer.remove();
            }
          }
        });

        const icon = L.divIcon({
          className: 'user-location-marker-container',
          html: userMarkerHtml,
          iconSize: [20, 20],
          iconAnchor: [10, 10] // Center of the icon
        });

        const marker = L.marker(position, {
          icon,
          zIndexOffset: 1000, // Ensure it's on top
          interactive: true, // Make it clickable
          bubblingMouseEvents: false // Don't let clicks bubble to map
        });
        
        marker.bindPopup('Your Location')
              .on('click', () => marker.openPopup());
        
        marker.addTo(map);
        markerRef.current = marker;
      } else {
        // Update existing marker position
        markerRef.current.setLatLng(position);
      }
    };
    
    // Function to remove marker and circle
    const cleanupMarker = () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    };
    
    // If this is the first render and we have location data, create marker immediately
    if (initialRenderRef.current && map && userLocation) {
      initialRenderRef.current = false;
      setTimeout(() => createOrUpdateMarker(), 100); // Short delay to ensure map is ready
    } else {
      // Otherwise create/update the marker when userLocation changes
      createOrUpdateMarker();
    }
    
    // Cleanup on unmount or when dependencies change
    return cleanupMarker;
  }, [map, userLocation]);

  return null; // This component doesn't render anything
};