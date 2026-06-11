"use client";

import { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import { Event } from "@/lib/types";
import { useMapbox } from "@/context/MapboxContext";
import { eventsToGeoJSON } from "./MapboxMarkers";
import { useDiffedMarkers, DiffedMarkerSpec } from "./useDiffedMarkers";

interface EventMarkerLayerProps {
  events: Event[];
  eventGroups: Record<string, Event[]>;
  onEventClick: (events: Event[]) => void;
  visible: boolean;
}

const EVENT_SOURCE_ID = "events";
// Invisible anchor layer: keeps the clustered source's tiles processed so
// querySourceFeatures() returns features. Never visible.
const EVENT_ANCHOR_LAYER = "event-anchors";

/** Local YYYY-MM-DD for "tonight" detection */
function todayLocalISO(): string {
  return new Date().toLocaleDateString("en-CA");
}

/**
 * EventMarkerLayer - Renders neon HTML event markers with clustering on Mapbox
 *
 * The GeoJSON source still does the clustering; rendering is diffed HTML
 * markers (see useDiffedMarkers) styled by src/styles/markers.css.
 * Visual source of truth: Projects/bndy/design-kit/marker-kit.html
 *
 * IMPORTANT: This component stays mounted. Visibility is controlled by prop.
 */
export function EventMarkerLayer({ events, eventGroups, onEventClick, visible }: EventMarkerLayerProps) {
  console.log("[EventMarkerLayer] RENDER - visible:", visible, "events:", events.length);
  const { map, isMapReady, currentStyleMode } = useMapbox();
  console.log("[EventMarkerLayer] CONTEXT - map:", !!map, "isMapReady:", isMapReady);
  const initializedRef = useRef(false);
  const lastMapIdRef = useRef<string | null>(null);
  const onEventClickRef = useRef(onEventClick);
  const eventGroupsRef = useRef(eventGroups);
  const visibleRef = useRef(visible);
  const eventsRef = useRef(events);

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

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  // Reset initialization when map instance changes (after navigation)
  useEffect(() => {
    if (!map) return;
    const mapId = map.getContainer()?.id || "default";
    if (lastMapIdRef.current && lastMapIdRef.current !== mapId) {
      console.log("[EventMarkerLayer] Map instance changed, resetting init");
      initializedRef.current = false;
    }
    lastMapIdRef.current = mapId;
  }, [map]);

  // Reset initialization when style changes (theme toggle removes sources)
  useEffect(() => {
    if (!map) return;

    const handleStyleLoad = () => {
      if (initializedRef.current && !map.getSource(EVENT_SOURCE_ID)) {
        console.log("[EventMarkerLayer] Style changed, resetting init");
        initializedRef.current = false;
      }
    };

    map.on("style.load", handleStyleLoad);
    return () => {
      map.off("style.load", handleStyleLoad);
    };
  }, [map]);

  // Initialize source ONCE (or reinitialize after style change)
  useEffect(() => {
    console.log("[EventMarkerLayer] Init effect - map:", !!map, "isMapReady:", isMapReady);
    if (!map || !isMapReady) {
      console.log("[EventMarkerLayer] Skipping init - map or isMapReady false");
      return;
    }

    try {
      if (initializedRef.current && map.getSource(EVENT_SOURCE_ID)) {
        console.log("[EventMarkerLayer] Already initialized, skipping");
        return;
      }
    } catch {
      // Style not loaded yet, proceed with initialization
    }

    console.log("[EventMarkerLayer] Starting init()");
    const init = async () => {
      try {
        const mapContainer = map.getContainer();
        console.log("[EventMarkerLayer] mapContainer:", !!mapContainer, "inDOM:", mapContainer ? document.body.contains(mapContainer) : false);
        if (!mapContainer || !document.body.contains(mapContainer)) {
          console.log("[EventMarkerLayer] Container not in DOM, aborting");
          return;
        }

        let styleLoaded = false;
        try {
          styleLoaded = map.isStyleLoaded();
        } catch {
          styleLoaded = false;
        }
        console.log("[EventMarkerLayer] styleLoaded:", styleLoaded);
        if (!styleLoaded) {
          console.log("[EventMarkerLayer] Waiting for style.load...");
          await new Promise<void>(resolve => map.once("style.load", () => resolve()));
          console.log("[EventMarkerLayer] style.load fired");
        }

        if (!map.getSource(EVENT_SOURCE_ID)) {
          console.log("[EventMarkerLayer] Adding source with", eventsRef.current.length, "events");
          map.addSource(EVENT_SOURCE_ID, {
            type: "geojson",
            data: eventsToGeoJSON(eventsRef.current),
            cluster: true,
            clusterMaxZoom: 11,
            clusterRadius: 40,
          });

          // Anchor layer: tiny radius to ensure tiles are processed for querySourceFeatures
          // (circle-radius: 0 may prevent tile processing in clustered sources)
          map.addLayer({
            id: EVENT_ANCHOR_LAYER,
            type: "circle",
            source: EVENT_SOURCE_ID,
            paint: { "circle-radius": 0.5, "circle-opacity": 0 },
          });

          console.log("[EventMarkerLayer] Source created");
        }

        initializedRef.current = true;
        console.log("[EventMarkerLayer] Initialized");
      } catch (error) {
        console.error("[EventMarkerLayer] Init failed:", error);
      }
    };

    init();
  }, [map, isMapReady, currentStyleMode]);

  // Build marker specs from clustered source features (stable; reads via refs)
  const buildSpecs = useCallback((features: GeoJSON.Feature[]): DiffedMarkerSpec[] => {
    const specs: DiffedMarkerSpec[] = [];
    const today = todayLocalISO();
    const mapInstance = map;

    for (const feature of features) {
      if (feature.geometry.type !== "Point") continue;
      const [lng, lat] = feature.geometry.coordinates as [number, number];
      const props = feature.properties as Record<string, unknown>;

      if (props && props.cluster) {
        const clusterId = props.cluster_id as number;
        const count = (props.point_count as number) ?? 0;
        specs.push({
          key: `ec:${clusterId}`,
          lngLat: [lng, lat],
          opts: { type: "cluster", count, kind: "gig" },
          onClick: () => {
            if (!mapInstance) return;
            const source = mapInstance.getSource(EVENT_SOURCE_ID) as mapboxgl.GeoJSONSource;
            source?.getClusterExpansionZoom(clusterId, (err, zoom) => {
              if (err) return;
              mapInstance.easeTo({ center: [lng, lat], zoom: zoom ?? 12 });
            });
          },
        });
        continue;
      }

      // Single event location (multiple events can share a locationKey — one
      // marker per location, click opens all of them)
      const locationKey = (props?.locationKey as string) ?? `${lat},${lng}`;
      const eventsAtLocation = eventGroupsRef.current[locationKey] || [];
      const count = eventsAtLocation.length;
      const name = (props?.name as string) ?? "";
      const venueName = (props?.venueName as string) ?? "";
      const date = (props?.date as string) ?? "";

      specs.push({
        key: `e:${locationKey}`,
        lngLat: [lng, lat],
        opts: {
          type: "gig",
          isTonight: date.startsWith(today),
          label: count > 1 ? venueName || name : name,
          sub: count > 1 ? `${count} gigs` : venueName,
        },
        onClick: () => {
          console.log("[EventMarkerLayer] Click - locationKey:", locationKey);
          const group = eventGroupsRef.current[locationKey] || [];
          if (group.length > 0 && mapInstance) {
            mapInstance.easeTo({ center: [lng, lat], duration: 300 });
            onEventClickRef.current(group);
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
    sourceId: EVENT_SOURCE_ID,
    enabled: visible,
    buildSpecs,
  });

  // Refresh data when becoming visible (handles race where events arrived during init)
  useEffect(() => {
    if (!map || !isMapReady || !visible) return;

    try {
      const source = map.getSource(EVENT_SOURCE_ID) as mapboxgl.GeoJSONSource;
      if (source && eventsRef.current.length > 0) {
        source.setData(eventsToGeoJSON(eventsRef.current));
        console.log("[EventMarkerLayer] Refreshed data on visibility:", eventsRef.current.length, "events");
      }
    } catch {
      // Map style not ready yet, will be set during init
    }
  }, [map, isMapReady, visible]);

  // Update data when events change
  useEffect(() => {
    if (!map || !isMapReady) return;

    try {
      const source = map.getSource(EVENT_SOURCE_ID) as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData(eventsToGeoJSON(events));
        console.log("[EventMarkerLayer] Data updated:", events.length, "events");
      }
    } catch {
      // Map or source not ready yet
    }
  }, [map, isMapReady, events]);

  return null;
}

export default EventMarkerLayer;
