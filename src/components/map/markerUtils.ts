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
  
  // Create custom user location marker
  export const createUserLocationMarker = () => {
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: "#06B6D4", // Cyan-500
      fillOpacity: 1,
      strokeColor: "#F97316", // Orange-500
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