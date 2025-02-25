// src/components/Map/mapStyles.ts
export const mapStyles = [
    { featureType: "all", elementType: "all", stylers: [{ hue: "#242a38" }] },
    { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "road", elementType: "labels", stylers: [{ visibility: "on" }] },
    { featureType: "administrative", elementType: "labels", stylers: [{ visibility: "on" }] },
    { featureType: "poi.business", elementType: "all", stylers: [{ visibility: "off" }] }
  ];