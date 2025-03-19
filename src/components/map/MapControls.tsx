// src/components/Map/MapControls.tsx
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import L from "leaflet";

interface MapControlsProps {
  map: L.Map | null;
  userLocation: google.maps.LatLngLiteral | null;
}

export const MapControls = ({ map, userLocation }: MapControlsProps) => {
  // Use a ref to track the container element
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // This approach handles the control in the DOM directly
  // rather than using Leaflet's Control API which is causing the duplication issue
  useEffect(() => {
    if (!map) return;
    
    // Only create the container once
    if (!containerRef.current) {
      // Create a container for our control
      const controlContainer = document.createElement('div');
      controlContainer.className = 'leaflet-bottom leaflet-right';
      controlContainer.id = 'custom-map-controls-container';
      
      // Ensure we don't have an existing container
      const existingContainer = document.getElementById('custom-map-controls-container');
      if (existingContainer) {
        existingContainer.remove();
      }
      
      // Add our container to the map container
      map.getContainer().appendChild(controlContainer);
      containerRef.current = controlContainer;
    }
    
    // When the component unmounts or map changes
    return () => {
      if (containerRef.current) {
        try {
          containerRef.current.remove();
          containerRef.current = null;
        } catch (e) {
          console.error("Error removing control container:", e);
        }
      }
    };
  }, [map]);
  
  // Return null if no map or container
  if (!map || !containerRef.current) return null;
  
  // Render the control using a portal directly into our container
  return createPortal(
    <div className="leaflet-control custom-location-control">
      <button 
        className="locate-button" 
        title="Center on my location"
        aria-label="Center on my location"
        onClick={() => {
          if (userLocation) {
            map.setView([userLocation.lat, userLocation.lng], 14);
          }
        }}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="22" y1="12" x2="18" y2="12"></line>
          <line x1="6" y1="12" x2="2" y2="12"></line>
          <line x1="12" y1="6" x2="12" y2="2"></line>
          <line x1="12" y1="22" x2="12" y2="18"></line>
        </svg>
      </button>
    </div>,
    containerRef.current
  );
};