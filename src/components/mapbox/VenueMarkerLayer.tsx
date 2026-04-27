"use client";

import { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import { Venue } from "@/lib/types";
import { useMapbox } from "@/context/MapboxContext";
import { addMarkerImagesToMap, venuesToGeoJSON } from "./MapboxMarkers";

interface VenueMarkerLayerProps {
  venues: Venue[];
  onVenueClick: (venue: Venue) => void;
}

const VENUE_SOURCE_ID = "venues";
const VENUE_CLUSTERS_LAYER = "venue-clusters";
const VENUE_CLUSTER_COUNT_LAYER = "venue-cluster-count";
const VENUE_UNCLUSTERED_LAYER = "venue-unclustered";

/**
 * VenueMarkerLayer - Renders venue markers with clustering on Mapbox
 */
export function VenueMarkerLayer({ venues, onVenueClick }: VenueMarkerLayerProps) {
  const { map, isMapReady } = useMapbox();
  const onVenueClickRef = useRef(onVenueClick);
  const venueMapRef = useRef<Map<string, Venue>>(new Map());

  // Keep callback ref updated
  useEffect(() => {
    onVenueClickRef.current = onVenueClick;
  }, [onVenueClick]);

  // Build venue lookup map
  useEffect(() => {
    const venueMap = new Map<string, Venue>();
    venues.forEach((v) => venueMap.set(v.id, v));
    venueMapRef.current = venueMap;
  }, [venues]);

  // Create layers once per map instance
  useEffect(() => {
    if (!map || !isMapReady) return;

    const initLayers = async () => {
      // Skip if already initialized
      if (map.getSource(VENUE_SOURCE_ID)) return;

      try {
        await addMarkerImagesToMap(map);

        map.addSource(VENUE_SOURCE_ID, {
          type: "geojson",
          data: venuesToGeoJSON(venues),
          cluster: true,
          clusterMaxZoom: 11,
          clusterRadius: 30,
        });

        map.addLayer({
          id: VENUE_CLUSTERS_LAYER,
          type: "circle",
          source: VENUE_SOURCE_ID,
          filter: ["has", "point_count"],
          paint: {
            "circle-radius": ["step", ["get", "point_count"], 15, 10, 18, 50, 22],
            "circle-color": ["step", ["get", "point_count"], "#FF1493", 10, "#E0115F", 50, "#C71585"],
            "circle-stroke-width": 2,
            "circle-stroke-color": "#FFFFFF",
          },
        });

        map.addLayer({
          id: VENUE_CLUSTER_COUNT_LAYER,
          type: "symbol",
          source: VENUE_SOURCE_ID,
          filter: ["has", "point_count"],
          layout: {
            "text-field": ["get", "point_count_abbreviated"],
            "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 12,
            "text-allow-overlap": true,
          },
          paint: { "text-color": "#FFFFFF" },
        });

        map.addLayer({
          id: VENUE_UNCLUSTERED_LAYER,
          type: "circle",
          source: VENUE_SOURCE_ID,
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-radius": 6,
            "circle-color": "#FF1493",
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "#FFFFFF",
          },
        });

        console.log("[VenueMarkerLayer] Layers created");
      } catch (error) {
        console.error("[VenueMarkerLayer] Failed to create layers:", error);
      }
    };

    if (map.isStyleLoaded()) {
      initLayers();
    } else {
      map.once("style.load", initLayers);
    }
  }, [map, isMapReady]);

  // Manage click handlers - add on mount, remove on unmount
  useEffect(() => {
    if (!map || !isMapReady) return;

    const handleClusterClick = (e: mapboxgl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, { layers: [VENUE_CLUSTERS_LAYER] });
      if (features.length === 0) return;

      const clusterId = features[0].properties?.cluster_id;
      const source = map.getSource(VENUE_SOURCE_ID) as mapboxgl.GeoJSONSource;

      if (source && clusterId !== undefined) {
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          const geometry = features[0].geometry;
          if (geometry.type === "Point") {
            map.easeTo({
              center: geometry.coordinates as [number, number],
              zoom: zoom ?? 12,
            });
          }
        });
      }
    };

    const handleMarkerClick = (e: mapboxgl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, { layers: [VENUE_UNCLUSTERED_LAYER] });
      if (features.length === 0) return;

      const venueId = features[0].properties?.id;
      const venue = venueMapRef.current.get(venueId);

      if (venue) {
        if (venue.location) {
          map.easeTo({ center: [venue.location.lng, venue.location.lat], duration: 300 });
        }
        onVenueClickRef.current(venue);
      }
    };

    const handleMouseEnter = () => { map.getCanvas().style.cursor = "pointer"; };
    const handleMouseLeave = () => { map.getCanvas().style.cursor = ""; };

    // Wait for layers to exist
    const addHandlers = () => {
      if (!map.getLayer(VENUE_CLUSTERS_LAYER)) {
        setTimeout(addHandlers, 50);
        return;
      }

      map.on("click", VENUE_CLUSTERS_LAYER, handleClusterClick);
      map.on("click", VENUE_UNCLUSTERED_LAYER, handleMarkerClick);
      map.on("mouseenter", VENUE_CLUSTERS_LAYER, handleMouseEnter);
      map.on("mouseleave", VENUE_CLUSTERS_LAYER, handleMouseLeave);
      map.on("mouseenter", VENUE_UNCLUSTERED_LAYER, handleMouseEnter);
      map.on("mouseleave", VENUE_UNCLUSTERED_LAYER, handleMouseLeave);
      console.log("[VenueMarkerLayer] Handlers attached");
    };

    addHandlers();

    return () => {
      map.off("click", VENUE_CLUSTERS_LAYER, handleClusterClick);
      map.off("click", VENUE_UNCLUSTERED_LAYER, handleMarkerClick);
      map.off("mouseenter", VENUE_CLUSTERS_LAYER, handleMouseEnter);
      map.off("mouseleave", VENUE_CLUSTERS_LAYER, handleMouseLeave);
      map.off("mouseenter", VENUE_UNCLUSTERED_LAYER, handleMouseEnter);
      map.off("mouseleave", VENUE_UNCLUSTERED_LAYER, handleMouseLeave);
      console.log("[VenueMarkerLayer] Handlers removed");
    };
  }, [map, isMapReady]);

  // Manage visibility - show on mount, hide on unmount
  useEffect(() => {
    if (!map || !isMapReady) return;

    const showLayers = () => {
      if (!map.getLayer(VENUE_CLUSTERS_LAYER)) {
        setTimeout(showLayers, 50);
        return;
      }
      map.setLayoutProperty(VENUE_CLUSTERS_LAYER, "visibility", "visible");
      map.setLayoutProperty(VENUE_CLUSTER_COUNT_LAYER, "visibility", "visible");
      map.setLayoutProperty(VENUE_UNCLUSTERED_LAYER, "visibility", "visible");
      console.log("[VenueMarkerLayer] Visible");
    };

    showLayers();

    return () => {
      if (map.getLayer(VENUE_CLUSTERS_LAYER)) {
        map.setLayoutProperty(VENUE_CLUSTERS_LAYER, "visibility", "none");
        map.setLayoutProperty(VENUE_CLUSTER_COUNT_LAYER, "visibility", "none");
        map.setLayoutProperty(VENUE_UNCLUSTERED_LAYER, "visibility", "none");
        console.log("[VenueMarkerLayer] Hidden");
      }
    };
  }, [map, isMapReady]);

  // Update data when venues change
  useEffect(() => {
    if (!map || !isMapReady) return;

    const source = map.getSource(VENUE_SOURCE_ID) as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(venuesToGeoJSON(venues));
      console.log(`[VenueMarkerLayer] Data updated: ${venues.length} venues`);
    }
  }, [map, isMapReady, venues]);

  return null;
}

export default VenueMarkerLayer;
