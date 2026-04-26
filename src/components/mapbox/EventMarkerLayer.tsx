"use client";

import { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import { Event } from "@/lib/types";
import { useMapbox } from "@/context/MapboxContext";
import { addMarkerImagesToMap, eventsToGeoJSON } from "./MapboxMarkers";

interface EventMarkerLayerProps {
  events: Event[];
  eventGroups: Record<string, Event[]>; // Grouped by location key
  onEventClick: (events: Event[]) => void;
}

const EVENT_SOURCE_ID = "events";
const EVENT_CLUSTERS_LAYER = "event-clusters";
const EVENT_CLUSTER_COUNT_LAYER = "event-cluster-count";
const EVENT_UNCLUSTERED_LAYER = "event-unclustered";

/**
 * EventMarkerLayer - Renders event markers with clustering on Mapbox
 *
 * Unlike venues, events can have multiple items at the same location.
 * When clicking an unclustered marker, we pass all events at that location.
 *
 * CRITICAL: This does NOT create new map loads - it only updates data sources.
 */
export function EventMarkerLayer({ events, eventGroups, onEventClick }: EventMarkerLayerProps) {
  const { map, isMapReady } = useMapbox();
  const isInitializedRef = useRef(false);
  const onEventClickRef = useRef(onEventClick);

  // Keep callback ref updated
  useEffect(() => {
    onEventClickRef.current = onEventClick;
  }, [onEventClick]);

  // Handle click on event marker or cluster
  const handleMapClick = useCallback((e: mapboxgl.MapMouseEvent) => {
    if (!map) return;

    // Check for cluster click first
    const clusterFeatures = map.queryRenderedFeatures(e.point, {
      layers: [EVENT_CLUSTERS_LAYER],
    });

    if (clusterFeatures.length > 0) {
      const clusterId = clusterFeatures[0].properties?.cluster_id;
      const source = map.getSource(EVENT_SOURCE_ID) as mapboxgl.GeoJSONSource;

      if (source && clusterId !== undefined) {
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          const geometry = clusterFeatures[0].geometry;
          if (geometry.type === "Point") {
            map.easeTo({
              center: geometry.coordinates as [number, number],
              zoom: zoom ?? 12,
            });
          }
        });
      }
      return;
    }

    // Check for unclustered event click
    const eventFeatures = map.queryRenderedFeatures(e.point, {
      layers: [EVENT_UNCLUSTERED_LAYER],
    });

    if (eventFeatures.length > 0) {
      const feature = eventFeatures[0];
      const geometry = feature.geometry;

      if (geometry.type === "Point") {
        const [lng, lat] = geometry.coordinates;
        const locationKey = `${lat},${lng}`;

        // Get all events at this location
        const eventsAtLocation = eventGroups[locationKey] || [];

        if (eventsAtLocation.length > 0) {
          // Pan to event
          map.easeTo({
            center: [lng, lat],
            duration: 300,
          });
          onEventClickRef.current(eventsAtLocation);
        }
      }
    }
  }, [map, eventGroups]);

  // Initialize layers when map is ready
  useEffect(() => {
    if (!map || !isMapReady || isInitializedRef.current) return;

    // Wait for style to be fully loaded before adding layers
    const setupWhenReady = () => {
      if (!map.isStyleLoaded()) {
        map.once("style.load", setupLayers);
        return;
      }
      setupLayers();
    };

    const setupLayers = async () => {
      try {
        // Add marker images first
        await addMarkerImagesToMap(map);

        // Add source with clustering enabled
        if (!map.getSource(EVENT_SOURCE_ID)) {
          map.addSource(EVENT_SOURCE_ID, {
            type: "geojson",
            data: eventsToGeoJSON(events),
            cluster: true,
            clusterMaxZoom: 11, // Disable clustering at zoom 12+
            clusterRadius: 40, // Slightly larger radius for events
          });
        }

        // Cluster circles layer
        if (!map.getLayer(EVENT_CLUSTERS_LAYER)) {
          map.addLayer({
            id: EVENT_CLUSTERS_LAYER,
            type: "circle",
            source: EVENT_SOURCE_ID,
            filter: ["has", "point_count"],
            paint: {
              // Size based on point count
              "circle-radius": [
                "step",
                ["get", "point_count"],
                16, // Default size
                10, 20, // 10+ points
                50, 24, // 50+ points
              ],
              // Orange gradient based on count
              "circle-color": [
                "step",
                ["get", "point_count"],
                "#F97316", // Orange-500
                10, "#EA580C", // Orange-600
                50, "#C2410C", // Orange-700
              ],
              "circle-stroke-width": 2,
              "circle-stroke-color": "#FFFFFF",
            },
          });
        }

        // Cluster count text layer
        if (!map.getLayer(EVENT_CLUSTER_COUNT_LAYER)) {
          map.addLayer({
            id: EVENT_CLUSTER_COUNT_LAYER,
            type: "symbol",
            source: EVENT_SOURCE_ID,
            filter: ["has", "point_count"],
            layout: {
              "text-field": ["get", "point_count_abbreviated"],
              "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
              "text-size": 12,
              "text-allow-overlap": true,
            },
            paint: {
              "text-color": "#FFFFFF",
            },
          });
        }

        // Unclustered event markers - teardrop shape using symbol
        if (!map.getLayer(EVENT_UNCLUSTERED_LAYER)) {
          map.addLayer({
            id: EVENT_UNCLUSTERED_LAYER,
            type: "circle",
            source: EVENT_SOURCE_ID,
            filter: ["!", ["has", "point_count"]],
            paint: {
              "circle-radius": 8,
              "circle-color": "#F97316",
              "circle-stroke-width": 2,
              "circle-stroke-color": "#FFFFFF",
            },
          });
        }

        // Add click handlers
        map.on("click", EVENT_CLUSTERS_LAYER, handleMapClick);
        map.on("click", EVENT_UNCLUSTERED_LAYER, handleMapClick);

        // Change cursor on hover
        map.on("mouseenter", EVENT_CLUSTERS_LAYER, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", EVENT_CLUSTERS_LAYER, () => {
          map.getCanvas().style.cursor = "";
        });
        map.on("mouseenter", EVENT_UNCLUSTERED_LAYER, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", EVENT_UNCLUSTERED_LAYER, () => {
          map.getCanvas().style.cursor = "";
        });

        isInitializedRef.current = true;
        console.log("[EventMarkerLayer] Layers initialized");
      } catch (error) {
        console.error("[EventMarkerLayer] Failed to initialize:", error);
      }
    };

    setupWhenReady();

    // Cleanup
    return () => {
      if (map) {
        map.off("click", EVENT_CLUSTERS_LAYER, handleMapClick);
        map.off("click", EVENT_UNCLUSTERED_LAYER, handleMapClick);
      }
    };
  }, [map, isMapReady, events, handleMapClick]);

  // Update data when events change (NO new map load!)
  useEffect(() => {
    if (!map || !isMapReady || !isInitializedRef.current) return;

    const source = map.getSource(EVENT_SOURCE_ID) as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(eventsToGeoJSON(events));
      console.log(`[EventMarkerLayer] Updated ${events.length} events (no map reload)`);
    }
  }, [map, isMapReady, events]);

  // This component doesn't render anything - it manages map layers
  return null;
}

export default EventMarkerLayer;
