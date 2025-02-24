// src/components/MapView.tsx - Updated
"use client";

import { useRef, useEffect } from "react";
import { Wrapper, Status } from "@googlemaps/react-wrapper";

// Separate map component to ensure proper loading after API is available
function Map() {
  const mapRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Create map once the DOM element is ready
    const map = new google.maps.Map(mapRef.current, {
      center: { lat: 51.505, lng: -0.09 },
      zoom: 10,
      gestureHandling: 'greedy',
      clickableIcons: false,
      maxZoom: 18,
      minZoom: 3,
      zoomControl: false,
      mapTypeControl: false,
      scaleControl: false,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: false,
      tilt: 0,
      // Use dark mode styling if needed
      styles: [
       // { featureType: "all", elementType: "geometry", stylers: [{ color: "#242f3e" }] },
        //{ featureType: "all", elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
       // { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
       { featureType: "all", elementType: "all", stylers: [{ hue: "#242a38" }] },
       { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
       { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
       { featureType: "road", elementType: "labels", stylers: [{ visibility: "on" }] },
       { featureType: "administrative", elementType: "labels", stylers: [{ visibility: "on" }] },
       { featureType: "poi.business", elementType: "all", stylers: [{ visibility: "off" }] }
      ]
    });
    
    // Add a marker as visual confirmation the map is working
    new google.maps.Marker({
      position: { lat: 51.505, lng: -0.09 },
      map,
      title: "London"
    });
    
  }, []);

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
}

const renderStatus = (status: Status): React.ReactElement => {
  switch (status) {
    case Status.LOADING:
      return <div className="flex items-center justify-center h-full">Loading map...</div>;
    case Status.FAILURE:
      return <div className="flex items-center justify-center h-full text-red-500">Error loading Google Maps</div>;
    default:
      return <></>;
  }
};

export default function MapView() {
  return (
    <div style={{
      width: "100%",
      height: "calc(100vh - 88px - 28px)", // Viewport height minus header and footer
      marginBottom: "0",
      paddingBottom: "0"
    }}>
      <Wrapper
        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
        render={renderStatus}
        libraries={["places"]}
      >
        <Map />
      </Wrapper>
    </div>
  );
}