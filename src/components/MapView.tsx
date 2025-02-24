// src/components/MapView.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

export default function MapView() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral>({
    lat: 51.505,
    lng: -0.09,
  });

  // Initialize the map
  function handleScriptLoad() {
    if (mapRef.current && !map) {
      const google = (window as any).google;
      if (!google) return;
      const newMap = new google.maps.Map(mapRef.current, {
        center: userLocation,
        zoom: 10,
        disableDefaultUI: true,
      });
      setMap(newMap);
    }
  }

  // Request user location once on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserLocation({ lat: latitude, lng: longitude });
        },
        () => {
          console.log("User denied geolocation or an error occurred.");
        }
      );
    }
  }, []);

  // Re-center the map when userLocation updates
  useEffect(() => {
    if (map) {
      map.setCenter(userLocation);
    }
  }, [userLocation, map]);

  // If the script is already loaded and map is null (e.g., after toggling back), initialize the map.
  useEffect(() => {
    if ((window as any).google && mapRef.current && !map) {
      handleScriptLoad();
    }
  }, [map]);

  return (
    <div className="relative w-full h-[600px]">
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        strategy="lazyOnload"
        onLoad={handleScriptLoad}
      />
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
