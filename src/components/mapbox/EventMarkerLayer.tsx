"use client";

import { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import { Event } from "@/lib/types";
import { useMapbox } from "@/context/MapboxContext";
import { addMarkerImagesToMap, eventsToGeoJSON } from "./MapboxMarkers";

interface EventMarkerLayerProps {
  events: Event[];
  eventGroups: Record<string, Event[]>;
  onEventClick: (events: Event[]) => void;
}

const EVENT_SOURCE_ID = "events";
const EVENT_CLUSTERS_LAYER = "event-clusters";
const EVENT_CLUSTER_COUNT_LAYER = "event-cluster-count";
const EVENT_UNCLUSTERED_LAYER = "event-unclustered";

/**
 * EventMarkerLayer - Renders event markers with clustering on Mapbox
 */
export function EventMarkerLayer({ events, eventGroups, onEventClick }: EventMarkerLayerProps) {
  const { map, isMapReady } = useMapbox();
  const onEventClickRef = useRef(onEventClick);
  const eventGroupsRef = useRef(eventGroups);

  // Keep refs updated
  useEffect(() => {
    onEventClickRef.current = onEventClick;
  }, [onEventClick]);

  useEffect(() => {
    eventGroupsRef.current = eventGroups;
  }, [eventGroups]);

  // Create layers once per map instance
  useEffect(() => {
    if (!map || !isMapReady) return;

    const initLayers = async () => {
      // Skip if already initialized
      if (map.getSource(EVENT_SOURCE_ID)) return;

      try {
        await addMarkerImagesToMap(map);

        map.addSource(EVENT_SOURCE_ID, {
          type: "geojson",
          data: eventsToGeoJSON(events),
          cluster: true,
          clusterMaxZoom: 11,
          clusterRadius: 40,
        });

        map.addLayer({
          id: EVENT_CLUSTERS_LAYER,
          type: "circle",
          source: EVENT_SOURCE_ID,
          filter: ["has", "point_count"],
          paint: {
            "circle-radius": ["step", ["get", "point_count"], 16, 10, 20, 50, 24],
            "circle-color": ["step", ["get", "point_count"], "#F97316", 10, "#EA580C", 50, "#C2410C"],
            "circle-stroke-width": 2,
            "circle-stroke-color": "#FFFFFF",
          },
        });

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
          paint: { "text-color": "#FFFFFF" },
        });

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

        console.log("[EventMarkerLayer] Layers created");
      } catch (error) {
        console.error("[EventMarkerLayer] Failed to create layers:", error);
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
      const features = map.queryRenderedFeatures(e.point, { layers: [EVENT_CLUSTERS_LAYER] });
      if (features.length === 0) return;

      const clusterId = features[0].properties?.cluster_id;
      const source = map.getSource(EVENT_SOURCE_ID) as mapboxgl.GeoJSONSource;

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
      const features = map.queryRenderedFeatures(e.point, { layers: [EVENT_UNCLUSTERED_LAYER] });
      if (features.length === 0) return;

      const geometry = features[0].geometry;
      if (geometry.type === "Point") {
        const [lng, lat] = geometry.coordinates;
        const locationKey = `${lat},${lng}`;
        const eventsAtLocation = eventGroupsRef.current[locationKey] || [];

        if (eventsAtLocation.length > 0) {
          map.easeTo({ center: [lng, lat], duration: 300 });
          onEventClickRef.current(eventsAtLocation);
        }
      }
    };

    const handleMouseEnter = () => { map.getCanvas().style.cursor = "pointer"; };
    const handleMouseLeave = () => { map.getCanvas().style.cursor = ""; };

    // Wait for layers to exist
    const addHandlers = () => {
      if (!map.getLayer(EVENT_CLUSTERS_LAYER)) {
        setTimeout(addHandlers, 50);
        return;
      }

      map.on("click", EVENT_CLUSTERS_LAYER, handleClusterClick);
      map.on("click", EVENT_UNCLUSTERED_LAYER, handleMarkerClick);
      map.on("mouseenter", EVENT_CLUSTERS_LAYER, handleMouseEnter);
      map.on("mouseleave", EVENT_CLUSTERS_LAYER, handleMouseLeave);
      map.on("mouseenter", EVENT_UNCLUSTERED_LAYER, handleMouseEnter);
      map.on("mouseleave", EVENT_UNCLUSTERED_LAYER, handleMouseLeave);
      console.log("[EventMarkerLayer] Handlers attached");
    };

    addHandlers();

    return () => {
      map.off("click", EVENT_CLUSTERS_LAYER, handleClusterClick);
      map.off("click", EVENT_UNCLUSTERED_LAYER, handleMarkerClick);
      map.off("mouseenter", EVENT_CLUSTERS_LAYER, handleMouseEnter);
      map.off("mouseleave", EVENT_CLUSTERS_LAYER, handleMouseLeave);
      map.off("mouseenter", EVENT_UNCLUSTERED_LAYER, handleMouseEnter);
      map.off("mouseleave", EVENT_UNCLUSTERED_LAYER, handleMouseLeave);
      console.log("[EventMarkerLayer] Handlers removed");
    };
  }, [map, isMapReady]);

  // Manage visibility - show on mount, hide on unmount
  useEffect(() => {
    if (!map || !isMapReady) return;

    const showLayers = () => {
      if (!map.getLayer(EVENT_CLUSTERS_LAYER)) {
        setTimeout(showLayers, 50);
        return;
      }
      map.setLayoutProperty(EVENT_CLUSTERS_LAYER, "visibility", "visible");
      map.setLayoutProperty(EVENT_CLUSTER_COUNT_LAYER, "visibility", "visible");
      map.setLayoutProperty(EVENT_UNCLUSTERED_LAYER, "visibility", "visible");
      console.log("[EventMarkerLayer] Visible");
    };

    showLayers();

    return () => {
      if (map.getLayer(EVENT_CLUSTERS_LAYER)) {
        map.setLayoutProperty(EVENT_CLUSTERS_LAYER, "visibility", "none");
        map.setLayoutProperty(EVENT_CLUSTER_COUNT_LAYER, "visibility", "none");
        map.setLayoutProperty(EVENT_UNCLUSTERED_LAYER, "visibility", "none");
        console.log("[EventMarkerLayer] Hidden");
      }
    };
  }, [map, isMapReady]);

  // Update data when events change
  useEffect(() => {
    if (!map || !isMapReady) return;

    const source = map.getSource(EVENT_SOURCE_ID) as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(eventsToGeoJSON(events));
      console.log(`[EventMarkerLayer] Data updated: ${events.length} events`);
    }
  }, [map, isMapReady, events]);

  return null;
}

export default EventMarkerLayer;
