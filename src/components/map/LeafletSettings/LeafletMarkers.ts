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
 * Creates a custom marker icon for venues (simplified - no event count).
 */
export function createVenueMarkerIcon(): L.DivIcon {
  // Hot pink color for venue markers
  const color = '#FF1493';

  // Create the SVG for the marker (no count, no fading)
  const markerSvg = createMapPinSVG(color, undefined, false);

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
 * Updated to use simpler HTML/CSS that's more cross-browser compatible
 */
export function createUserLocationMarkerIcon(): L.DivIcon {
  // Using class-based styling instead of inline styles for better Edge compatibility
  const userMarkerHtml = `
    <div class="user-location-marker">
      <div class="user-location-pulse"></div>
      <div class="user-location-dot"></div>
    </div>
  `;
  
  return L.divIcon({
    className: 'user-location-marker-container',
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

  // Create cluster HTML - using class-based styling for better cross-browser compatibility
  const html = `
    <div class="event-cluster-icon" style="background-color: ${getClusterColor(count)};">${count}</div>
  `;

  return L.divIcon({
    html: html,
    className: 'leaflet-cluster-icon-container',
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

  // Create cluster HTML with class-based styling
  const html = `
    <div class="venue-cluster-icon" style="background-color: ${getVenueClusterColor(count)};">${count}</div>
  `;

  return L.divIcon({
    html: html,
    className: 'leaflet-cluster-icon-container',
    iconSize: L.point(40, 40)
  });
}