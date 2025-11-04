// src/components/Map/MapContainer.tsx
import { useEffect, forwardRef, useImperativeHandle, useRef } from "react";
import L from "leaflet";
import { lightTileLayer, darkTileLayer } from "@/components/map/LeafletSettings/TileProviders";
import { completeLeafletIconFix } from "@/components/map/LeafletSettings/leaflet-icon-fix";

interface MapContainerProps {
  userLocation: google.maps.LatLngLiteral | null;
  isDarkMode: boolean;
}

export const MapContainer = forwardRef<L.Map | null, MapContainerProps>(
  ({ userLocation, isDarkMode }, ref) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);

    // Forward the map instance to the parent component
    useImperativeHandle(ref, () => mapRef.current!);

    // Initialize the map on component mount
    useEffect(() => {
      // Fix Leaflet's default icon paths
      completeLeafletIconFix();

      // If already initialized, do nothing.
      if (mapRef.current) {
        return;
      }

      if (!mapContainerRef.current) {
        return;
      }

      // Set initial center based on user location or default center of the UK
      const defaultCenter = { lat: 54.0, lng: -2.0 };
      const center = userLocation
        ? [userLocation.lat, userLocation.lng]
        : [defaultCenter.lat, defaultCenter.lng];

      // Create the map instance
      const map = L.map(mapContainerRef.current, {
        center: center as [number, number],
        zoom: 12,
        zoomControl: false,
        attributionControl: true,
        closePopupOnClick: true,
      });

      // Add tile layer based on the theme
      const tileLayer = isDarkMode ? darkTileLayer : lightTileLayer;
      const layer = L.tileLayer(tileLayer.url, {
        maxZoom: 19,
      }).addTo(map);

      // Apply blue filter class to tile pane for washed-out aesthetic
      // Use requestAnimationFrame to ensure DOM is ready
      console.log("=== MAP INIT: CODE IS RUNNING ===");
      console.log("Map initialized, isDarkMode:", isDarkMode);
      console.log("Tile layer config:", tileLayer);
      requestAnimationFrame(() => {
        console.log("requestAnimationFrame callback executing");
        const tilePane = map.getPane('tilePane');
        console.log("tilePane element:", tilePane);
        if (tilePane) {
          const newClassName = `leaflet-tile-pane ${tileLayer.className}`;
          console.log("Setting className to:", newClassName);
          tilePane.className = newClassName;
          console.log("className after set:", tilePane.className);
          console.log("tilePane computed style filter:", window.getComputedStyle(tilePane).filter);
        } else {
          console.error("TILE PANE NOT FOUND!");
        }
      });

      // NOTE: We're not adding location controls here anymore
      // This is now handled by MapControls.tsx using React portals

      // Save the map instance
      mapRef.current = map;

      // Clean up when component unmounts
      return () => {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
      // We intentionally leave the dependency array empty so that this effect runs only once.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update the tile layer when theme changes
    useEffect(() => {
      if (!mapRef.current) return;
      mapRef.current.eachLayer((layer) => {
        if (layer instanceof L.TileLayer) {
          mapRef.current?.removeLayer(layer);
        }
      });
      const tileLayer = isDarkMode ? darkTileLayer : lightTileLayer;
      L.tileLayer(tileLayer.url, {
        maxZoom: 19,
      }).addTo(mapRef.current);

      // Apply blue filter class to tile pane
      // Use requestAnimationFrame to ensure DOM is ready
      console.log("=== MAP THEME CHANGE: CODE IS RUNNING ===");
      console.log("Theme changed to isDarkMode:", isDarkMode);
      console.log("New tile layer config:", tileLayer);
      requestAnimationFrame(() => {
        console.log("Theme change requestAnimationFrame callback executing");
        const tilePane = mapRef.current?.getPane('tilePane');
        console.log("tilePane element:", tilePane);
        if (tilePane) {
          const newClassName = `leaflet-tile-pane ${tileLayer.className}`;
          console.log("Setting className to:", newClassName);
          tilePane.className = newClassName;
          console.log("className after set:", tilePane.className);
          console.log("tilePane computed style filter:", window.getComputedStyle(tilePane).filter);
        } else {
          console.error("TILE PANE NOT FOUND ON THEME CHANGE!");
        }
      });
    }, [isDarkMode]);

    // Update map view when user location changes
    useEffect(() => {
      if (!mapRef.current || !userLocation) return;
      if (!mapRef.current.getBounds().contains(userLocation)) {
        mapRef.current.setView([userLocation.lat, userLocation.lng], mapRef.current.getZoom());
      }
    }, [userLocation]);

    return (
      <div
        ref={mapContainerRef}
        className="w-full h-full"
        style={{ zIndex: 10 }}
      />
    );
  }
);

MapContainer.displayName = "MapContainer";