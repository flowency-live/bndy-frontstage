"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { Venue } from "@/lib/types";
import { useMapbox } from "@/context/MapboxContext";
import { addMarkerImagesToMap, venuesToGeoJSON } from "./MapboxMarkers";

interface VenueMarkerLayerProps {
  venues: Venue[];
  venueIdsWithEvents: Set<string>;
  onVenueClick: (venue: Venue) => void;
  visible: boolean;
}

const VENUE_SOURCE_ID = "venues";
const VENUE_CLUSTERS_LAYER = "venue-clusters";
const VENUE_CLUSTER_COUNT_LAYER = "venue-cluster-count";
const VENUE_GLOW_LAYER = "venue-glow";
const VENUE_UNCLUSTERED_LAYER = "venue-unclustered";
const VENUE_LABELS_LAYER = "venue-labels";
const VENUE_INDICATOR_LAYER = "venue-indicator";

/**
 * VenueMarkerLayer - Renders venue markers with clustering on Mapbox
 *
 * IMPORTANT: This component stays mounted. Visibility is controlled by prop.
 */
export function VenueMarkerLayer({ venues, venueIdsWithEvents, onVenueClick, visible }: VenueMarkerLayerProps) {
  const { map, isMapReady, currentStyleMode } = useMapbox();
  const initializedRef = useRef(false);
  const lastMapIdRef = useRef<string | null>(null);
  const onVenueClickRef = useRef(onVenueClick);
  const venueMapRef = useRef<Map<string, Venue>>(new Map());
  const visibleRef = useRef(visible);
  const venueIdsWithEventsRef = useRef(venueIdsWithEvents);
  const venuesRef = useRef(venues);

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

  useEffect(() => {
    venueIdsWithEventsRef.current = venueIdsWithEvents;
  }, [venueIdsWithEvents]);

  useEffect(() => {
    venuesRef.current = venues;
  }, [venues]);

  // Reset initialization when map instance changes (after navigation)
  useEffect(() => {
    if (!map) return;
    const mapId = map.getContainer()?.id || "default";
    if (lastMapIdRef.current && lastMapIdRef.current !== mapId) {
      console.log("[VenueMarkerLayer] Map instance changed, resetting init");
      initializedRef.current = false;
    }
    lastMapIdRef.current = mapId;
  }, [map]);

  // Reset initialization when style changes (theme toggle)
  useEffect(() => {
    if (!map) return;

    const handleStyleLoad = () => {
      // After style change, our source is gone - need to reinitialize
      if (initializedRef.current && !map.getSource(VENUE_SOURCE_ID)) {
        console.log("[VenueMarkerLayer] Style changed, resetting init");
        initializedRef.current = false;
      }
    };

    map.on("style.load", handleStyleLoad);
    return () => {
      map.off("style.load", handleStyleLoad);
    };
  }, [map]);

  // Initialize layers and handlers ONCE (or reinitialize after style change)
  useEffect(() => {
    if (!map || !isMapReady) return;

    // Skip if already initialized AND source still exists (source is removed on style change)
    // Wrap in try-catch as getSource can throw if style isn't loaded
    try {
      if (initializedRef.current && map.getSource(VENUE_SOURCE_ID)) return;
    } catch {
      // Style not loaded yet, proceed with initialization
    }

    const init = async () => {
      try {
        // Verify map container is valid
        const mapContainer = map.getContainer();
        if (!mapContainer || !document.body.contains(mapContainer)) {
          return;
        }

        // Wait for style - wrap in try-catch as isStyleLoaded can throw if map is in bad state
        let styleLoaded = false;
        try {
          styleLoaded = map.isStyleLoaded();
        } catch {
          styleLoaded = false;
        }
        if (!styleLoaded) {
          await new Promise<void>(resolve => map.once("style.load", () => resolve()));
        }

        await addMarkerImagesToMap(map);

        // Create source if doesn't exist
        // Use refs to avoid stale closure issue (venues may update during async init)
        if (!map.getSource(VENUE_SOURCE_ID)) {
          map.addSource(VENUE_SOURCE_ID, {
            type: "geojson",
            data: venuesToGeoJSON(venuesRef.current, venueIdsWithEventsRef.current),
            cluster: true,
            clusterMaxZoom: 10,  // Clusters until zoom 10, labels from 11
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

          // Glow layer for venues with events (renders underneath)
          // Only show at mid-zoom (hidden when labels appear at zoom 11+)
          map.addLayer({
            id: VENUE_GLOW_LAYER,
            type: "circle",
            source: VENUE_SOURCE_ID,
            maxzoom: 11,
            filter: ["all", ["!", ["has", "point_count"]], ["get", "hasEvents"]],
            paint: {
              "circle-radius": 16,
              "circle-color": "#06B6D4",  // Cyan glow
              "circle-opacity": 0.4,
              "circle-blur": 1,
            },
          });

          // Unclustered venue dots - only show at mid-zoom (hidden when labels appear at 11+)
          map.addLayer({
            id: VENUE_UNCLUSTERED_LAYER,
            type: "circle",
            source: VENUE_SOURCE_ID,
            maxzoom: 11,
            filter: ["!", ["has", "point_count"]],
            paint: {
              // Active venues: CYAN with glow (has events) - clear differentiation
              // Inactive venues: smaller pink dots, visible but subtle
              "circle-radius": ["case", ["get", "hasEvents"], 8, 5],
              "circle-color": ["case", ["get", "hasEvents"], "#06B6D4", "#FF1493"],
              "circle-opacity": ["case", ["get", "hasEvents"], 1, 0.6],
              "circle-stroke-width": ["case", ["get", "hasEvents"], 2, 1],
              "circle-stroke-color": ["case", ["get", "hasEvents"], "#FFFFFF", "#FFFFFF"],
            },
          });

          // Indicator dot layer - colored dot left of venue name (zoom 11+)
          // Cyan for active venues, pink for inactive
          map.addLayer({
            id: VENUE_INDICATOR_LAYER,
            type: "circle",
            source: VENUE_SOURCE_ID,
            minzoom: 11,
            filter: ["!", ["has", "point_count"]],
            paint: {
              "circle-radius": ["case", ["get", "hasEvents"], 5, 4],
              "circle-color": ["case", ["get", "hasEvents"], "#06B6D4", "#FF1493"],
              "circle-stroke-width": 1.5,
              "circle-stroke-color": "#ffffff",
              "circle-translate": [-8, 0],
            },
          });

          // Venue name labels - show at zoom 11+
          // Simple text with dark halo - no fancy pill backgrounds
          map.addLayer({
            id: VENUE_LABELS_LAYER,
            type: "symbol",
            source: VENUE_SOURCE_ID,
            minzoom: 11,
            filter: ["!", ["has", "point_count"]],
            layout: {
              "text-field": ["get", "name"],
              "text-size": 12,
              "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
              "text-anchor": "left",
              "text-offset": [0.8, 0],
              "text-max-width": 10,
              "text-allow-overlap": false,
              "text-ignore-placement": false,
              "symbol-sort-key": ["case", ["get", "hasEvents"], 0, 1],
            },
            paint: {
              "text-color": "#ffffff",
              "text-halo-color": "rgba(20, 24, 32, 0.95)",
              "text-halo-width": 4,
              "text-halo-blur": 0,
              "text-opacity": ["case", ["get", "hasEvents"], 1, 0.6],
            },
          });

          // Set initial visibility based on prop
          const initialVisibility = visibleRef.current ? "visible" : "none";
          map.setLayoutProperty(VENUE_CLUSTERS_LAYER, "visibility", initialVisibility);
          map.setLayoutProperty(VENUE_CLUSTER_COUNT_LAYER, "visibility", initialVisibility);
          map.setLayoutProperty(VENUE_GLOW_LAYER, "visibility", initialVisibility);
          map.setLayoutProperty(VENUE_UNCLUSTERED_LAYER, "visibility", initialVisibility);
          map.setLayoutProperty(VENUE_INDICATOR_LAYER, "visibility", initialVisibility);
          map.setLayoutProperty(VENUE_LABELS_LAYER, "visibility", initialVisibility);

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

        // Click handler for venue labels (at high zoom)
        const handleLabelClick = (e: mapboxgl.MapMouseEvent) => {
          const features = map.queryRenderedFeatures(e.point, { layers: [VENUE_LABELS_LAYER, VENUE_INDICATOR_LAYER] });
          if (features.length === 0) return;

          const venueId = features[0].properties?.id;
          const venue = venueMapRef.current.get(venueId);

          console.log("[VenueMarkerLayer] Label click - venueId:", venueId, "found:", !!venue);

          if (venue) {
            if (venue.location) {
              map.easeTo({ center: [venue.location.lng, venue.location.lat], duration: 300 });
            }
            onVenueClickRef.current(venue);
          }
        };

        map.on("click", VENUE_LABELS_LAYER, handleLabelClick);
        map.on("click", VENUE_INDICATOR_LAYER, handleLabelClick);

        // Cursor handlers
        map.on("mouseenter", VENUE_CLUSTERS_LAYER, () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", VENUE_CLUSTERS_LAYER, () => { map.getCanvas().style.cursor = ""; });
        map.on("mouseenter", VENUE_UNCLUSTERED_LAYER, () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", VENUE_UNCLUSTERED_LAYER, () => { map.getCanvas().style.cursor = ""; });
        map.on("mouseenter", VENUE_LABELS_LAYER, () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", VENUE_LABELS_LAYER, () => { map.getCanvas().style.cursor = ""; });
        map.on("mouseenter", VENUE_INDICATOR_LAYER, () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", VENUE_INDICATOR_LAYER, () => { map.getCanvas().style.cursor = ""; });

        // Ensure visibility is correct after all initialization
        // (handles case where source already existed but visibility wasn't set)
        if (map.getLayer(VENUE_CLUSTERS_LAYER)) {
          const visibility = visibleRef.current ? "visible" : "none";
          map.setLayoutProperty(VENUE_CLUSTERS_LAYER, "visibility", visibility);
          map.setLayoutProperty(VENUE_CLUSTER_COUNT_LAYER, "visibility", visibility);
          map.setLayoutProperty(VENUE_GLOW_LAYER, "visibility", visibility);
          map.setLayoutProperty(VENUE_UNCLUSTERED_LAYER, "visibility", visibility);
          map.setLayoutProperty(VENUE_INDICATOR_LAYER, "visibility", visibility);
          map.setLayoutProperty(VENUE_LABELS_LAYER, "visibility", visibility);
          console.log("[VenueMarkerLayer] Final visibility set:", visibility);
        }

        initializedRef.current = true;
        console.log("[VenueMarkerLayer] Initialized");
      } catch (error) {
        console.error("[VenueMarkerLayer] Init failed:", error);
      }
    };

    init();
  }, [map, isMapReady, currentStyleMode]);

  // Control visibility via prop - also refresh data when becoming visible
  useEffect(() => {
    if (!map || !isMapReady) return;

    // Guard against map being in bad state (style not loaded)
    try {
      if (!map.getLayer(VENUE_CLUSTERS_LAYER)) return;

      const visibility = visible ? "visible" : "none";
      map.setLayoutProperty(VENUE_CLUSTERS_LAYER, "visibility", visibility);
      map.setLayoutProperty(VENUE_CLUSTER_COUNT_LAYER, "visibility", visibility);
      map.setLayoutProperty(VENUE_GLOW_LAYER, "visibility", visibility);
      map.setLayoutProperty(VENUE_UNCLUSTERED_LAYER, "visibility", visibility);
      map.setLayoutProperty(VENUE_INDICATOR_LAYER, "visibility", visibility);
      map.setLayoutProperty(VENUE_LABELS_LAYER, "visibility", visibility);
      console.log("[VenueMarkerLayer] Visibility:", visibility);

      // When becoming visible, ensure data is fresh (handles race where venues arrived during init)
      if (visible) {
        const source = map.getSource(VENUE_SOURCE_ID) as mapboxgl.GeoJSONSource;
        if (source && venuesRef.current.length > 0) {
          source.setData(venuesToGeoJSON(venuesRef.current, venueIdsWithEventsRef.current));
          console.log("[VenueMarkerLayer] Refreshed data on visibility:", venuesRef.current.length, "venues");
        }
      }
    } catch (e) {
      // Map style not ready yet, will be set during init
    }
  }, [map, isMapReady, visible]);

  // Update data when venues change
  useEffect(() => {
    if (!map || !isMapReady) return;

    try {
      const source = map.getSource(VENUE_SOURCE_ID) as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData(venuesToGeoJSON(venues, venueIdsWithEventsRef.current));
        console.log("[VenueMarkerLayer] Data updated:", venues.length, "venues");

        // Defensive: re-apply visibility after data update
        // This ensures layers stay hidden when they should be
        if (map.getLayer(VENUE_CLUSTERS_LAYER)) {
          const visibility = visibleRef.current ? "visible" : "none";
          map.setLayoutProperty(VENUE_CLUSTERS_LAYER, "visibility", visibility);
          map.setLayoutProperty(VENUE_CLUSTER_COUNT_LAYER, "visibility", visibility);
          map.setLayoutProperty(VENUE_GLOW_LAYER, "visibility", visibility);
          map.setLayoutProperty(VENUE_UNCLUSTERED_LAYER, "visibility", visibility);
          map.setLayoutProperty(VENUE_INDICATOR_LAYER, "visibility", visibility);
          map.setLayoutProperty(VENUE_LABELS_LAYER, "visibility", visibility);
        }
      }
    } catch (e) {
      // Map or source not ready yet
    }
  }, [map, isMapReady, venues]);

  // Update GeoJSON when events change (affects hasEvents property)
  useEffect(() => {
    if (!map || !isMapReady) return;

    try {
      const source = map.getSource(VENUE_SOURCE_ID) as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData(venuesToGeoJSON(venues, venueIdsWithEvents));
        console.log("[VenueMarkerLayer] Events updated, refreshing venue hasEvents");
      }
    } catch {
      // Source not ready
    }
  }, [map, isMapReady, venues, venueIdsWithEvents]);

  return null;
}

export default VenueMarkerLayer;
