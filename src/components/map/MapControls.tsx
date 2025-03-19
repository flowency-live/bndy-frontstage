// src/components/Map/MapControls.tsx
import { useEffect } from "react";
import L from "leaflet";

interface MapControlsProps {
  map: L.Map | null;
  userLocation: google.maps.LatLngLiteral | null;
}

export const MapControls = ({ map, userLocation }: MapControlsProps) => {
  // Add custom controls to the map
  useEffect(() => {
    if (!map) return;

    // Add location control
    const locationButton = new L.Control({ position: 'bottomright' });
    locationButton.onAdd = () => {
      const div = L.DomUtil.create('div', 'custom-location-control');
      div.innerHTML = `
        <button 
          class="locate-button" 
          title="Center on my location"
          aria-label="Center on my location">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="22" y1="12" x2="18" y2="12"></line>
            <line x1="6" y1="12" x2="2" y2="12"></line>
            <line x1="12" y1="6" x2="12" y2="2"></line>
            <line x1="12" y1="22" x2="12" y2="18"></line>
          </svg>
        </button>
      `;
      
      // Handle click event
      div.querySelector('.locate-button')?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (userLocation) {
          map.setView([userLocation.lat, userLocation.lng], 14);
        }
      });
      
      return div;
    };
    locationButton.addTo(map);

    // Add CSS for the location button
    if (!document.getElementById('map-controls-style')) {
      const style = document.createElement('style');
      style.id = 'map-controls-style';
      style.textContent = `
        .custom-location-control {
          margin-bottom: 10px;
        }
        .locate-button {
          background: white;
          border: none;
          border-radius: 4px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 5px rgba(0,0,0,0.25);
          color: #666;
        }
        .locate-button:hover {
          background: #f4f4f4;
          color: #333;
        }
        .dark .locate-button {
          background: #333;
          color: #ccc;
        }
        .dark .locate-button:hover {
          background: #444;
          color: white;
        }
        .pulsing-marker {
          animation: markerPulse 1.5s ease-in-out infinite;
        }
        @keyframes markerPulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      // Clean up control if component unmounts
      const styleElement = document.getElementById('map-controls-style');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, [map, userLocation]);

  // This is a functional component, so no markup is returned
  return null;
};