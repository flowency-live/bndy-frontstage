// src/components/Map/markerUtils.ts

// src/components/Map/markerUtils.ts

// Create custom event marker that retains Google's familiar pin shape
export const createEventMarker = () => {
  return {
    // Standard Google Maps marker path
    path: "M 12,2 C 8.1340068,2 5,5.1340068 5,9 c 0,5.25 7,13 7,13 0,0 7,-7.75 7,-13 0,-3.8659932 -3.134007,-7 -7,-7 z",
    fillColor: "#F97316", // Orange-500
    fillOpacity: 1,
    strokeWeight: 1.5,
    strokeColor: "#FFFFFF", // White outline
    rotation: 0,
    scale: 2,
    anchor: new google.maps.Point(12, 22),
    labelOrigin: new google.maps.Point(12, 9)
  };
};

// Create custom marker with cyan dot in the center
export const createEnhancedEventMarker = () => {
  const markerSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
        <path fill="#F97316" stroke="#FFFFFF" stroke-width="2" d="M24,4c-7.73,0-14,6.27-14,14c0,10.5,14,26,14,26s14-15.5,14-26C38,10.27,31.73,4,24,4z"/>
        <circle cx="24" cy="18" r="4.5" fill="#06B6D4"/>
      </svg>`;

  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(markerSvg),
    scaledSize: new google.maps.Size(36, 36),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(18, 36)
  };
};

export function createMultiEventMarker(): google.maps.Icon {
  // 32x32 SVG with an orange pin and a teal circle at center
  const svg = encodeURIComponent(`
      <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <!-- Orange pin path -->
        <path fill="#F97316" d="M16 0C10 0 5.33 4.66 5.33 10.4c0 3.79 2.06 8.1 6.17 13.06 3.16 3.8 4.5 5.7 4.5 5.7s1.34-1.9 4.5-5.7c4.1-4.95 6.17-9.27 6.17-13.06C26.67 4.66 22 0 16 0z"/>
        <!-- Larger teal circle in the middle -->
        <circle fill="#00b7c4" cx="16" cy="11" r="6"/>
      </svg>
    `);

  return {
    url: `data:image/svg+xml;charset=UTF-8,${svg}`,
    // Bottom tip of pin is at (16,32)
    anchor: new google.maps.Point(16, 32),
    // We want the label text to appear in the center of the teal circle
    labelOrigin: new google.maps.Point(16, 11),
    scaledSize: new google.maps.Size(32, 32),
  };
}

// Create custom venue marker with orange dot in the center (for venues)
export const createVenueMarker = () => {
  const markerSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
      <path fill="#FF00AA" stroke="#FFFFFF" stroke-width="2" d="M24,4c-7.73,0-14,6.27-14,14c0,10.5,14,26,14,26s14-15.5,14-26C38,10.27,31.73,4,24,4z"/>
      <circle cx="24" cy="18" r="4.5" fill="#06B6D4"/>
    </svg>`;

  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(markerSvg),
    scaledSize: new google.maps.Size(36, 36),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(18, 36)
  };
};

// Create custom user location marker
export const createUserLocationMarker = () => {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: "#ffd7b5",
    fillOpacity: 1,
    strokeColor: "#D3D3D3",
    strokeWeight: 3,
    scale: 8
  };
};

// Cluster styling
export const getClusterColor = (count: number) => {
  if (count < 10) return "#F97316"; // Orange-500 for small clusters
  if (count < 50) return "#EA580C"; // Orange-600 for medium clusters
  return "#C2410C"; // Orange-700 for large clusters
};

// Get cluster size based on count
export const getClusterSize = (count: number) => {
  return Math.max(count * 3, 18); // Minimum size of 18, scales up with count
};

// Venue cluster styling
export const getVenueClusterColor = (count: number) => {
  if (count < 10) return "#06B6D4"; // Cyan-500 for small clusters
  if (count < 50) return "#0891B2"; // Cyan-600 for medium clusters
  return "#0E7490"; // Cyan-700 for large clusters
};