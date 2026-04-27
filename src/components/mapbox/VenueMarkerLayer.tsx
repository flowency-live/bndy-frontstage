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
 *
 * Uses Mapbox's built-in clustering which is more performant than
 * leaflet.markercluster for large datasets.
 *
 * CRITICAL: This does NOT create new map loads - it only updates data sources.
 */
export function VenueMarkerLayer({ venues, onVenueClick }: VenueMarkerLayerProps) {
  const { map, isMapReady } = useMapbox();
  const isInitializedRef = useRef(false);
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

  // Handle click on venue marker or cluster
  const handleMapClick = useCallback((e: mapboxgl.MapMouseEvent) => {
    if (!map) return;

    // Check for cluster click first
    const clusterFeatures = map.queryRenderedFeatures(e.point, {
      layers: [VENUE_CLUSTERS_LAYER],
    });

    if (clusterFeatures.length > 0) {
      const clusterId = clusterFeatures[0].properties?.cluster_id;
      const source = map.getSource(VENUE_SOURCE_ID) as mapboxgl.GeoJSONSource;

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

    // Check for unclustered venue click
    const venueFeatures = map.queryRenderedFeatures(e.point, {
      layers: [VENUE_UNCLUSTERED_LAYER],
    });

    if (venueFeatures.length > 0) {
      const venueId = venueFeatures[0].properties?.id;
      const venue = venueMapRef.current.get(venueId);
      if (venue) {
        // Pan to venue
        if (venue.location) {
          map.easeTo({
            center: [venue.location.lng, venue.location.lat],
            duration: 300,
          });
        }
        onVenueClickRef.current(venue);
      }
    }
  }, [map]);

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
        if (!map.getSource(VENUE_SOURCE_ID)) {
          map.addSource(VENUE_SOURCE_ID, {
            type: "geojson",
            data: venuesToGeoJSON(venues),
            cluster: true,
            clusterMaxZoom: 11, // Disable clustering at zoom 12+
            clusterRadius: 30, // Cluster radius in pixels
          });
        }

        // Cluster circles layer
        if (!map.getLayer(VENUE_CLUSTERS_LAYER)) {
          map.addLayer({
            id: VENUE_CLUSTERS_LAYER,
            type: "circle",
            source: VENUE_SOURCE_ID,
            filter: ["has", "point_count"],
            paint: {
              // Size based on point count
              "circle-radius": [
                "step",
                ["get", "point_count"],
                15, // Default size
                10, 18, // 10+ points
                50, 22, // 50+ points
              ],
              // Pink gradient based on count
              "circle-color": [
                "step",
                ["get", "point_count"],
                "#FF1493", // Base pink
                10, "#E0115F", // Deeper pink for 10+
                50, "#C71585", // Magenta for 50+
              ],
              "circle-stroke-width": 2,
              "circle-stroke-color": "#FFFFFF",
            },
          });
        }

        // Cluster count text layer
        if (!map.getLayer(VENUE_CLUSTER_COUNT_LAYER)) {
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
            paint: {
              "text-color": "#FFFFFF",
            },
          });
        }

        // Unclustered venue markers
        if (!map.getLayer(VENUE_UNCLUSTERED_LAYER)) {
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
        }

        // Add click handlers
        map.on("click", VENUE_CLUSTERS_LAYER, handleMapClick);
        map.on("click", VENUE_UNCLUSTERED_LAYER, handleMapClick);

        // Change cursor on hover
        map.on("mouseenter", VENUE_CLUSTERS_LAYER, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", VENUE_CLUSTERS_LAYER, () => {
          map.getCanvas().style.cursor = "";
        });
        map.on("mouseenter", VENUE_UNCLUSTERED_LAYER, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", VENUE_UNCLUSTERED_LAYER, () => {
          map.getCanvas().style.cursor = "";
        });

        isInitializedRef.current = true;
        console.log("[VenueMarkerLayer] Layers initialized");
      } catch (error) {
        console.error("[VenueMarkerLayer] Failed to initialize:", error);
      }
    };

    setupWhenReady();

    // Cleanup - hide layers when component unmounts (mode switch)
    return () => {
      if (map) {
        map.off("click", VENUE_CLUSTERS_LAYER, handleMapClick);
        map.off("click", VENUE_UNCLUSTERED_LAYER, handleMapClick);

        // Hide layers when switching modes
        if (map.getLayer(VENUE_CLUSTERS_LAYER)) {
          map.setLayoutProperty(VENUE_CLUSTERS_LAYER, "visibility", "none");
        }
        if (map.getLayer(VENUE_CLUSTER_COUNT_LAYER)) {
          map.setLayoutProperty(VENUE_CLUSTER_COUNT_LAYER, "visibility", "none");
        }
        if (map.getLayer(VENUE_UNCLUSTERED_LAYER)) {
          map.setLayoutProperty(VENUE_UNCLUSTERED_LAYER, "visibility", "none");
        }
      }
    };
  }, [map, isMapReady, venues, handleMapClick]);

  // Show layers when component mounts (after initialization)
  useEffect(() => {
    if (!map || !isMapReady || !isInitializedRef.current) return;

    // Make layers visible
    if (map.getLayer(VENUE_CLUSTERS_LAYER)) {
      map.setLayoutProperty(VENUE_CLUSTERS_LAYER, "visibility", "visible");
    }
    if (map.getLayer(VENUE_CLUSTER_COUNT_LAYER)) {
      map.setLayoutProperty(VENUE_CLUSTER_COUNT_LAYER, "visibility", "visible");
    }
    if (map.getLayer(VENUE_UNCLUSTERED_LAYER)) {
      map.setLayoutProperty(VENUE_UNCLUSTERED_LAYER, "visibility", "visible");
    }
  }, [map, isMapReady]);

  // Update data when venues change (NO new map load!)
  useEffect(() => {
    if (!map || !isMapReady || !isInitializedRef.current) return;

    const source = map.getSource(VENUE_SOURCE_ID) as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(venuesToGeoJSON(venues));
      console.log(`[VenueMarkerLayer] Updated ${venues.length} venues (no map reload)`);
    }
  }, [map, isMapReady, venues]);

  // This component doesn't render anything - it manages map layers
  return null;
}

export default VenueMarkerLayer;
