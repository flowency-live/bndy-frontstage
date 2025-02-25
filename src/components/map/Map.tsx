// src/components/Map/Map.tsx
"use client";

import { useRef, useEffect, useState } from "react";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { useViewToggle } from "@/context/ViewToggleContext";
import { mapStyles } from "./MapStyles";
import { CustomInfoOverlay } from './CustomInfoOverlay';
import { createEnhancedEventMarker, createUserLocationMarker } from "./markerUtils";
import { createEventInfoContent, createUserLocationInfoContent } from "./EventInfoWindow";

import { DEFAULT_CENTER, SAMPLE_EVENTS } from "./sampleData";

export default function Map() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { isDarkMode } = useViewToggle();

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    try {
      const map = new google.maps.Map(mapRef.current, {
        center: DEFAULT_CENTER,
        zoom: 12,
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
        styles: mapStyles
      });

      setMapInstance(map);
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  }, []);

  // Handle markers, clustering, and info windows
  useEffect(() => {
    if (!mapInstance) return;

    // Store references
    const markers: google.maps.Marker[] = [];
    const overlays: CustomInfoOverlay[] = [];

    // Create markers for each event
    SAMPLE_EVENTS.forEach((event) => {
      const marker = new google.maps.Marker({
        position: event,
        title: event.title,
        icon: createEnhancedEventMarker()
      });

      markers.push(marker);

      // Use the imported function to create themed content
      const content = createEventInfoContent(
        {
          title: event.title,
          description: "This is a bndy event."
        },
        isDarkMode
      );

      const overlay = new CustomInfoOverlay(event, content, mapInstance);
      overlays.push(overlay);

      // Add click event handler
      marker.addListener("click", () => {
        // Close all open overlays
        overlays.forEach(o => o.hide());

        // Open this overlay
        overlay.show();
      });
    });

    // Important: Create clusterer AFTER creating all markers
    // and add all markers to it
    // Important: Create clusterer AFTER creating all markers
    const clusterer = new MarkerClusterer({
      map: mapInstance,
      markers: markers, // Add all markers to the clusterer
      // Remove the algorithm property to use the default algorithm
      renderer: {
        render: ({ count, position }) => {
          return new google.maps.Marker({
            position,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: "#F97316", // Orange
              fillOpacity: 0.9,
              strokeColor: "#FFFFFF",
              strokeWeight: 2,
              scale: Math.min(count * 3, 18) // Size based on count, max size of 18
            },
            label: {
              text: String(count),
              color: "white",
              fontSize: "12px",
              fontWeight: "bold"
            },
            zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
            map: mapInstance
          });
        }
      }
    });


    // Close overlays when clicking elsewhere on the map
    mapInstance.addListener("click", () => {
      overlays.forEach(overlay => overlay.hide());
    });

    // Cleanup function
    return () => {
      clusterer.clearMarkers();
      overlays.forEach(overlay => overlay.setMap(null));
      google.maps.event.clearInstanceListeners(mapInstance);
    };
  }, [mapInstance, isDarkMode, userLocation]);

  // Get user location - same as before
  useEffect(() => {
    if (!mapInstance) return;

    if ("geolocation" in navigator) {
      try {
        const locationTimeout = setTimeout(() => {
          setLocationError("Location request timed out");
        }, 10000);

        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(locationTimeout);
            const { latitude, longitude } = position.coords;
            const userPos = { lat: latitude, lng: longitude };
            setUserLocation(userPos);

            mapInstance.setCenter(userPos);
            mapInstance.setZoom(13);

            const userMarker = new google.maps.Marker({
              position: userPos,
              map: mapInstance,
              title: "Your Location",
              icon: createUserLocationMarker(),
              // Make sure user location marker is always on top and not clustered
              zIndex: Number(google.maps.Marker.MAX_ZINDEX) + 1000
            });

            const userInfoWindow = new google.maps.InfoWindow({
              content: createUserLocationInfoContent(isDarkMode),
            });

            userMarker.addListener("click", () => {
              userInfoWindow.open({
                anchor: userMarker,
                map: mapInstance,
                shouldFocus: false,
              });
            });
          },
          (error) => {
            clearTimeout(locationTimeout);
            console.error("Error getting location:", error.message);
            setLocationError(error.message);
          },
          {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 0
          }
        );
      } catch (e) {
        console.error("Error in geolocation request:", e);
        setLocationError("Failed to request location");
      }
    } else {
      setLocationError("Geolocation not supported by this browser");
    }
  }, [mapInstance, isDarkMode]);

  return (
    <>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      {locationError && (
        <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-70 text-white p-2 rounded text-sm text-center">
          Location unavailable: Using default map view
        </div>
      )}
    </>
  );
}