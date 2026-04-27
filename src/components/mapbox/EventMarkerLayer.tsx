"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { Event } from "@/lib/types";
import { useMapbox } from "@/context/MapboxContext";
import { addMarkerImagesToMap, eventsToGeoJSON } from "./MapboxMarkers";

interface EventMarkerLayerProps {
  events: Event[];
  eventGroups: Record<string, Event[]>;
  onEventClick: (events: Event[]) => void;
  visible: boolean;
}

const EVENT_SOURCE_ID = "events";
const EVENT_CLUSTERS_LAYER = "event-clusters";
const EVENT_CLUSTER_COUNT_LAYER = "event-cluster-count";
const EVENT_UNCLUSTERED_LAYER = "event-unclustered";

/**
 * EventMarkerLayer - Renders event markers with clustering on Mapbox
 *
 * IMPORTANT: This component stays mounted. Visibility is controlled by prop.
 */
export function EventMarkerLayer({ events, eventGroups, onEventClick, visible }: EventMarkerLayerProps) {
  const { map, isMapReady } = useMapbox();
  const initializedRef = useRef(false);
  const onEventClickRef = useRef(onEventClick);
  const eventGroupsRef = useRef(eventGroups);
  const visibleRef = useRef(visible);

  // Keep refs updated
  useEffect(() => {
    onEventClickRef.current = onEventClick;
  }, [onEventClick]);

  useEffect(() => {
    eventGroupsRef.current = eventGroups;
  }, [eventGroups]);

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  // Initialize layers and handlers ONCE
  useEffect(() => {
    if (!map || !isMapReady || initializedRef.current) return;

    const init = async () => {
      try {
        // Wait for style
        if (!map.isStyleLoaded()) {
          await new Promise<void>(resolve => map.once("style.load", () => resolve()));
        }

        await addMarkerImagesToMap(map);

        // Create source if doesn't exist
        if (!map.getSource(EVENT_SOURCE_ID)) {
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

          // Set initial visibility based on prop
          const initialVisibility = visibleRef.current ? "visible" : "none";
          map.setLayoutProperty(EVENT_CLUSTERS_LAYER, "visibility", initialVisibility);
          map.setLayoutProperty(EVENT_CLUSTER_COUNT_LAYER, "visibility", initialVisibility);
          map.setLayoutProperty(EVENT_UNCLUSTERED_LAYER, "visibility", initialVisibility);

          console.log("[EventMarkerLayer] Layers created, visibility:", initialVisibility);
        }

        // Add click handlers (using refs so they stay current)
        map.on("click", EVENT_CLUSTERS_LAYER, (e) => {
          const features = map.queryRenderedFeatures(e.point, { layers: [EVENT_CLUSTERS_LAYER] });
          if (features.length === 0) return;

          const clusterId = features[0].properties?.cluster_id;
          const source = map.getSource(EVENT_SOURCE_ID) as mapboxgl.GeoJSONSource;
          if (source && clusterId !== undefined) {
            source.getClusterExpansionZoom(clusterId, (err, zoom) => {
              if (err) return;
              const geometry = features[0].geometry;
              if (geometry.type === "Point") {
                map.easeTo({ center: geometry.coordinates as [number, number], zoom: zoom ?? 12 });
              }
            });
          }
        });

        map.on("click", EVENT_UNCLUSTERED_LAYER, (e) => {
          const features = map.queryRenderedFeatures(e.point, { layers: [EVENT_UNCLUSTERED_LAYER] });
          if (features.length === 0) return;

          const geometry = features[0].geometry;
          if (geometry.type === "Point") {
            const [lng, lat] = geometry.coordinates;
            const locationKey = `${lat},${lng}`;
            const eventsAtLocation = eventGroupsRef.current[locationKey] || [];

            console.log("[EventMarkerLayer] Click - locationKey:", locationKey, "events:", eventsAtLocation.length);

            if (eventsAtLocation.length > 0) {
              map.easeTo({ center: [lng, lat], duration: 300 });
              onEventClickRef.current(eventsAtLocation);
            }
          }
        });

        // Cursor handlers
        map.on("mouseenter", EVENT_CLUSTERS_LAYER, () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", EVENT_CLUSTERS_LAYER, () => { map.getCanvas().style.cursor = ""; });
        map.on("mouseenter", EVENT_UNCLUSTERED_LAYER, () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", EVENT_UNCLUSTERED_LAYER, () => { map.getCanvas().style.cursor = ""; });

        initializedRef.current = true;
        console.log("[EventMarkerLayer] Initialized");
      } catch (error) {
        console.error("[EventMarkerLayer] Init failed:", error);
      }
    };

    init();
  }, [map, isMapReady]);

  // Control visibility via prop
  useEffect(() => {
    if (!map || !isMapReady) return;
    if (!map.getLayer(EVENT_CLUSTERS_LAYER)) return;

    const visibility = visible ? "visible" : "none";
    map.setLayoutProperty(EVENT_CLUSTERS_LAYER, "visibility", visibility);
    map.setLayoutProperty(EVENT_CLUSTER_COUNT_LAYER, "visibility", visibility);
    map.setLayoutProperty(EVENT_UNCLUSTERED_LAYER, "visibility", visibility);
    console.log("[EventMarkerLayer] Visibility:", visibility);
  }, [map, isMapReady, visible]);

  // Update data when events change
  useEffect(() => {
    if (!map || !isMapReady) return;

    const source = map.getSource(EVENT_SOURCE_ID) as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(eventsToGeoJSON(events));
      console.log("[EventMarkerLayer] Data updated:", events.length, "events");
    }
  }, [map, isMapReady, events]);

  return null;
}

export default EventMarkerLayer;
