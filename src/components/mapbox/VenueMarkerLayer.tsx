"use client";

import { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import { Venue } from "@/lib/types";
import { useMapbox } from "@/context/MapboxContext";
import { venuesToGeoJSON } from "./MapboxMarkers";
import { useDiffedMarkers, DiffedMarkerSpec } from "./useDiffedMarkers";

interface VenueMarkerLayerProps {
  venues: Venue[];
  venueIdsWithEvents: Set<string>;
  onVenueClick: (venue: Venue) => void;
  visible: boolean;
}

const VENUE_SOURCE_ID = "venues";
// Invisible anchor layer: keeps the clustered source's tiles processed so
// querySourceFeatures() returns features. Never visible.
const VENUE_ANCHOR_LAYER = "venue-anchors";

/**
 * VenueMarkerLayer - Renders neon HTML venue markers with clustering on Mapbox
 *
 * COLOR SEMANTICS (intentionally flipped 2026-06-10, per design kit):
 *   hasEvents → PINK full-bloom (venue is "live")
 *   no events → dim CYAN (idle)
 * Clusters are pink if ANY member venue has gigs (clusterProperties.hasLive).
 *
 * Visual source of truth: Projects/bndy/design-kit/marker-kit.html
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

  // Reset initialization when style changes (theme toggle removes sources)
  useEffect(() => {
    if (!map) return;

    const handleStyleLoad = () => {
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

  // Initialize source ONCE (or reinitialize after style change)
  // IMPORTANT: This must be synchronous so source exists before useDiffedMarkers runs
  useEffect(() => {
    if (!map || !isMapReady) return;

    // Skip if already initialized and source exists
    try {
      if (initializedRef.current && map.getSource(VENUE_SOURCE_ID)) return;
    } catch {
      // Style not loaded yet - but isMapReady should guarantee it is
    }

    // Verify map container is valid
    const mapContainer = map.getContainer();
    if (!mapContainer || !document.body.contains(mapContainer)) return;

    // isMapReady guarantees style is loaded, so create source synchronously
    try {
      if (!map.getSource(VENUE_SOURCE_ID)) {
        map.addSource(VENUE_SOURCE_ID, {
          type: "geojson",
          data: venuesToGeoJSON(venuesRef.current, venueIdsWithEventsRef.current),
          cluster: true,
          clusterMaxZoom: 10,
          clusterRadius: 30,
          clusterProperties: {
            hasLive: ["any", ["to-boolean", ["get", "hasEvents"]]],
          },
        });

        map.addLayer({
          id: VENUE_ANCHOR_LAYER,
          type: "circle",
          source: VENUE_SOURCE_ID,
          paint: { "circle-radius": 1, "circle-opacity": 0 },
        });
      }
      initializedRef.current = true;
    } catch (error) {
      console.error("[VenueMarkerLayer] Init failed:", error);
    }
  }, [map, isMapReady, currentStyleMode]);

  // Build marker specs from clustered source features (stable; reads via refs)
  const buildSpecs = useCallback((features: GeoJSON.Feature[]): DiffedMarkerSpec[] => {
    const specs: DiffedMarkerSpec[] = [];
    const mapInstance = map;

    for (const feature of features) {
      if (feature.geometry.type !== "Point") continue;
      const [lng, lat] = feature.geometry.coordinates as [number, number];
      const props = feature.properties as Record<string, unknown>;

      if (props && props.cluster) {
        const clusterId = props.cluster_id as number;
        const count = (props.point_count as number) ?? 0;
        const hasLive = Boolean(props.hasLive);
        specs.push({
          key: `vc:${clusterId}`,
          lngLat: [lng, lat],
          opts: { type: "cluster", count, kind: hasLive ? "venue-live" : "venue-idle" },
          onClick: () => {
            if (!mapInstance) return;
            const source = mapInstance.getSource(VENUE_SOURCE_ID) as mapboxgl.GeoJSONSource;
            source?.getClusterExpansionZoom(clusterId, (err, zoom) => {
              if (err) return;
              mapInstance.easeTo({ center: [lng, lat], zoom: zoom ?? 12 });
            });
          },
        });
        continue;
      }

      const venueId = (props?.id as string) ?? "";
      const name = (props?.name as string) ?? "";
      const hasGigs = Boolean(props?.hasEvents);

      // Tile geometry is quantized — pin singles to their exact stored coords
      const venueRecord = venueMapRef.current.get(venueId);
      const exact: [number, number] = venueRecord?.location
        ? [venueRecord.location.lng, venueRecord.location.lat]
        : [lng, lat];

      specs.push({
        key: `v:${venueId}`,
        lngLat: exact,
        opts: {
          type: "venue",
          hasGigs,
          label: name,
          sub: hasGigs ? "live gigs" : undefined,
        },
        onClick: () => {
          const venue = venueMapRef.current.get(venueId);
          if (venue) {
            if (venue.location && mapInstance) {
              mapInstance.easeTo({ center: [venue.location.lng, venue.location.lat], duration: 300 });
            }
            onVenueClickRef.current(venue);
          }
        },
      });
    }

    return specs;
  }, [map]);

  // Diffed HTML marker rendering
  useDiffedMarkers({
    map,
    isMapReady,
    sourceId: VENUE_SOURCE_ID,
    enabled: visible,
    buildSpecs,
  });

  // Refresh data when becoming visible (handles race where venues arrived during init)
  useEffect(() => {
    if (!map || !isMapReady || !visible) return;

    try {
      const source = map.getSource(VENUE_SOURCE_ID) as mapboxgl.GeoJSONSource;
      if (source && venuesRef.current.length > 0) {
        source.setData(venuesToGeoJSON(venuesRef.current, venueIdsWithEventsRef.current));
        console.log("[VenueMarkerLayer] Refreshed data on visibility:", venuesRef.current.length, "venues");
      }
    } catch {
      // Map style not ready yet, will be set during init
    }
  }, [map, isMapReady, visible]);

  // Update data when venues or their event status change
  useEffect(() => {
    if (!map || !isMapReady) return;

    try {
      const source = map.getSource(VENUE_SOURCE_ID) as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData(venuesToGeoJSON(venues, venueIdsWithEvents));
        console.log("[VenueMarkerLayer] Data updated:", venues.length, "venues");
      }
    } catch {
      // Map or source not ready yet
    }
  }, [map, isMapReady, venues, venueIdsWithEvents]);

  return null;
}

export default VenueMarkerLayer;
