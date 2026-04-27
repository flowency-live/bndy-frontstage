"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { Venue } from "@/lib/types";
import { useMapbox } from "@/context/MapboxContext";
import { addMarkerImagesToMap, venuesToGeoJSON } from "./MapboxMarkers";

interface VenueMarkerLayerProps {
  venues: Venue[];
  onVenueClick: (venue: Venue) => void;
  visible: boolean;
}

const VENUE_SOURCE_ID = "venues";
const VENUE_CLUSTERS_LAYER = "venue-clusters";
const VENUE_CLUSTER_COUNT_LAYER = "venue-cluster-count";
const VENUE_UNCLUSTERED_LAYER = "venue-unclustered";

/**
 * VenueMarkerLayer - Renders venue markers with clustering on Mapbox
 *
 * IMPORTANT: This component stays mounted. Visibility is controlled by prop.
 */
export function VenueMarkerLayer({ venues, onVenueClick, visible }: VenueMarkerLayerProps) {
  const { map, isMapReady } = useMapbox();
  const initializedRef = useRef(false);
  const onVenueClickRef = useRef(onVenueClick);
  const venueMapRef = useRef<Map<string, Venue>>(new Map());
  const visibleRef = useRef(visible);

  // Keep refs updated
  useEffect(() => {
    onVenueClickRef.current = onVenueClick;
  }, [onVenueClick]);

  useEffect(() => {
    const venueMap = new Map<string, Venue>();
    venues.forEach((v) => venueMap.set(v.id, v));
    venueMapRef.current = venueMap;
  }, [venues]);

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
        if (!map.getSource(VENUE_SOURCE_ID)) {
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

          // Set initial visibility based on prop
          const initialVisibility = visibleRef.current ? "visible" : "none";
          map.setLayoutProperty(VENUE_CLUSTERS_LAYER, "visibility", initialVisibility);
          map.setLayoutProperty(VENUE_CLUSTER_COUNT_LAYER, "visibility", initialVisibility);
          map.setLayoutProperty(VENUE_UNCLUSTERED_LAYER, "visibility", initialVisibility);

          console.log("[VenueMarkerLayer] Layers created, visibility:", initialVisibility);
        }

        // Add click handlers (using refs so they stay current)
        map.on("click", VENUE_CLUSTERS_LAYER, (e) => {
          const features = map.queryRenderedFeatures(e.point, { layers: [VENUE_CLUSTERS_LAYER] });
          if (features.length === 0) return;

          const clusterId = features[0].properties?.cluster_id;
          const source = map.getSource(VENUE_SOURCE_ID) as mapboxgl.GeoJSONSource;
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

        map.on("click", VENUE_UNCLUSTERED_LAYER, (e) => {
          const features = map.queryRenderedFeatures(e.point, { layers: [VENUE_UNCLUSTERED_LAYER] });
          if (features.length === 0) return;

          const venueId = features[0].properties?.id;
          const venue = venueMapRef.current.get(venueId);

          console.log("[VenueMarkerLayer] Click - venueId:", venueId, "found:", !!venue);

          if (venue) {
            if (venue.location) {
              map.easeTo({ center: [venue.location.lng, venue.location.lat], duration: 300 });
            }
            onVenueClickRef.current(venue);
          }
        });

        // Cursor handlers
        map.on("mouseenter", VENUE_CLUSTERS_LAYER, () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", VENUE_CLUSTERS_LAYER, () => { map.getCanvas().style.cursor = ""; });
        map.on("mouseenter", VENUE_UNCLUSTERED_LAYER, () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", VENUE_UNCLUSTERED_LAYER, () => { map.getCanvas().style.cursor = ""; });

        initializedRef.current = true;
        console.log("[VenueMarkerLayer] Initialized");
      } catch (error) {
        console.error("[VenueMarkerLayer] Init failed:", error);
      }
    };

    init();
  }, [map, isMapReady]);

  // Control visibility via prop
  useEffect(() => {
    if (!map || !isMapReady) return;
    if (!map.getLayer(VENUE_CLUSTERS_LAYER)) return;

    const visibility = visible ? "visible" : "none";
    map.setLayoutProperty(VENUE_CLUSTERS_LAYER, "visibility", visibility);
    map.setLayoutProperty(VENUE_CLUSTER_COUNT_LAYER, "visibility", visibility);
    map.setLayoutProperty(VENUE_UNCLUSTERED_LAYER, "visibility", visibility);
    console.log("[VenueMarkerLayer] Visibility:", visibility);
  }, [map, isMapReady, visible]);

  // Update data when venues change
  useEffect(() => {
    if (!map || !isMapReady) return;

    const source = map.getSource(VENUE_SOURCE_ID) as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(venuesToGeoJSON(venues));
      console.log("[VenueMarkerLayer] Data updated:", venues.length, "venues");
    }
  }, [map, isMapReady, venues]);

  return null;
}

export default VenueMarkerLayer;
