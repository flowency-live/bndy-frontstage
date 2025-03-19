// src/components/Map/LeafletMarkers.ts
import L from "leaflet";

/**
 * Creates a simple teardrop/balloon pin marker SVG like Google Maps
 */
export const createMapPinSVG = (fillColor: string, count?: number, faded = false) => {
  const showCount = count !== undefined;
  const opacity = faded ? 0.6 : 1.0; // Lower opacity for venues with no events
  
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="29" viewBox="0 0 24 36">
      <!-- Teardrop/balloon pin shape with white border -->
      <path d="M12,0 C5.3,0 0,5.3 0,12 C0,20 12,36 12,36 C12,36 24,20 24,12 C24,5.3 18.6,0 12,0 Z" 
        fill="${fillColor}" 
        fill-opacity="${opacity}"
        stroke="#FFFFFF"
        stroke-width="1.5" />
      
      ${showCount ? `
        <!-- Count text -->
        <text x="12" y="15" font-family="Arial, sans-serif" font-size="11" font-weight="bold" 
          text-anchor="middle" dominant-baseline="middle" fill="#FFFFFF">${count}</text>
      ` : `
        <!-- Cyan dot in the center -->
        <circle cx="12" cy="12" r="3.5" fill="#06B6D4" fill-opacity="${opacity}" />
      `}
    </svg>
  `;
};

/**
 * Creates a custom marker icon for events.
 * If count is provided, it will display the number in the marker.
 */
export function createEventMarkerIcon(count?: number): L.DivIcon {
  // Create the SVG for the pin marker (orange teardrop shape with optional count)
  const markerSvg = createMapPinSVG('#F97316', count);
  
  return L.divIcon({
    className: 'event-marker',
    html: markerSvg,
    iconSize: [22, 29],
    iconAnchor: [11, 29], // Bottom tip of the teardrop
    popupAnchor: [0, -27] // Popup appears above the marker
  });
}

/**
 * Creates a custom marker icon for venues with event count.
 */
export function createVenueMarkerIcon(eventCount: number): L.DivIcon {
  // Hot pink color for venue markers
  const color = '#FF1493';
  
  // Only show count if there are multiple events
  const showCount = eventCount > 1;
  
  // Fade venues with no events
  const faded = eventCount === 0;
  
  // Create the SVG for the marker
  const markerSvg = createMapPinSVG(color, showCount ? eventCount : undefined, faded);
  
  return L.divIcon({
    className: 'venue-marker',
    html: markerSvg,
    iconSize: [22, 29],
    iconAnchor: [11, 29], // Bottom tip of the teardrop
    popupAnchor: [0, -27] // Popup appears above the marker
  });
}

/**
 * Creates a custom marker icon for the user location.
 */
export function createUserLocationMarkerIcon(): L.DivIcon {
  // This matches the Google Maps blue dot for user location
  const userMarkerHtml = `
    <div style="position: relative;">
      <!-- Outer pulsing circle -->
      <div style="
        position: absolute;
        top: -12px;
        left: -12px;
        background-color: rgba(66, 133, 244, 0.2);
        border-radius: 50%;
        width: 24px;
        height: 24px;
        animation: pulse 2s infinite;
      "></div>
      
      <!-- Inner blue dot -->
      <div style="
        position: absolute;
        top: -8px;
        left: -8px;
        background-color: rgb(66, 133, 244);
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
        width: 16px;
        height: 16px;
      "></div>
    </div>
    
    <style>
      @keyframes pulse {
        0% { transform: scale(0.7); opacity: 1; }
        70% { transform: scale(3); opacity: 0; }
        100% { transform: scale(0.7); opacity: 0; }
      }
    </style>
  `;
  
  return L.divIcon({
    className: 'user-location-marker',
    html: userMarkerHtml,
    iconSize: [1, 1], // Small size since we position with absolute
    iconAnchor: [0, 0]
  });
}

/**
 * Creates a custom cluster icon for events.
 */
export function createEventClusterIcon(cluster: L.MarkerCluster): L.DivIcon {
  const count = cluster.getChildCount();
  
  // Get color based on cluster size
  const getClusterColor = (count: number) => {
    if (count < 10) return "#F97316"; // Orange-500 for small clusters
    if (count < 50) return "#EA580C"; // Orange-600 for medium clusters
    return "#C2410C"; // Orange-700 for large clusters
  };

  // Create cluster HTML
  const html = `
    <div style="
      background-color: ${getClusterColor(count)};
      color: white;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      justify-content: center;
      align-items: center;
      font-weight: bold;
      font-size: 14px;
      border: 2px solid white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    ">${count}</div>
  `;

  return L.divIcon({
    html: html,
    className: 'leaflet-cluster-icon',
    iconSize: L.point(40, 40)
  });
}

/**
 * Creates a custom cluster icon for venues.
 */
export function createVenueClusterIcon(cluster: L.MarkerCluster): L.DivIcon {
  const count = cluster.getChildCount();
  
  // Get color based on cluster size
  const getVenueClusterColor = (count: number) => {
    if (count < 10) return "#FF1493"; // Pink for small clusters
    if (count < 50) return "#E0115F"; // Deeper pink for medium clusters
    return "#C71585"; // Magenta for large clusters
  };

  // Create cluster HTML - match the size to event clusters (40x40)
  const html = `
    <div style="
      background-color: ${getVenueClusterColor(count)};
      color: white;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      justify-content: center;
      align-items: center;
      font-weight: bold;
      font-size: 14px;
      border: 2px solid white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    ">${count}</div>
  `;

  return L.divIcon({
    html: html,
    className: 'leaflet-cluster-icon',
    iconSize: L.point(40, 40)
  });
}