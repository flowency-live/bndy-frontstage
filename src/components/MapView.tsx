// src/components/MapView.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Script from "next/script";

export default function MapView() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral>({
    lat: 51.505,
    lng: -0.09,
  });

  // Use useCallback so the function is stable for the useEffect dependency array.
  const handleScriptLoad = useCallback(() => {
    if (mapRef.current && !map) {
      // Check if window.google is defined without casting to any.
      if (typeof window.google === "undefined") return;
      const newMap = new window.google.maps.Map(mapRef.current, {
        center: userLocation,
        zoom: 10,
        disableDefaultUI: true,
      });
      setMap(newMap);
    }
  }, [map, userLocation]);

  // Request user location on mount.
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

  // Re-center the map when userLocation changes.
  useEffect(() => {
    if (map) {
      map.setCenter(userLocation);
    }
  }, [userLocation, map]);

  // If the Google Maps script is loaded and map is still null (e.g., after toggling back), initialize it.
  useEffect(() => {
    if (typeof window.google !== "undefined" && mapRef.current && !map) {
      handleScriptLoad();
    }
  }, [map, handleScriptLoad]);

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
