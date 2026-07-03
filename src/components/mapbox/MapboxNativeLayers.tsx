"use client";

/**
 * MapboxNativeLayers - Native Mapbox GL layers with built-in clustering
 *
 * Uses Mapbox's GeoJSON source with cluster:true for automatic clustering.
 * GPU-accelerated circle layers with glow effects via blur.
 */

import { useEffect, useRef, useMemo } from "react";
import type { Event, Venue } from "@/lib/types";
import { useMapbox } from "@/context/MapboxContext";

interface MapboxNativeLayersProps {
  venues: Venue[];
  venueIdsWithEvents: Set<string>;
  onVenueClick: (venue: Venue) => void;
  showVenues: boolean;
  events: Event[];
  eventGroups: Record<string, Event[]>;
  onEventClick: (events: Event[]) => void;
  showEvents: boolean;
}

function todayLocalISO(): string {
  return new Date().toLocaleDateString("en-CA");
}

export function MapboxNativeLayers({
  venues,
  venueIdsWithEvents,
  onVenueClick,
  showVenues,
  events,
  eventGroups,
  onEventClick,
  showEvents,
}: MapboxNativeLayersProps) {
  const { map, isMapReady } = useMapbox();
  const layersAddedRef = useRef(false);
  const venuesRef = useRef(venues);
  const eventGroupsRef = useRef(eventGroups);

  // Keep refs updated
  useEffect(() => { venuesRef.current = venues; }, [venues]);
  useEffect(() => { eventGroupsRef.current = eventGroups; }, [eventGroups]);

  const today = useMemo(() => todayLocalISO(), []);

  // Build venue GeoJSON
  const venueGeoJson = useMemo(() => {
    const features = venues
      .filter((v) => v.location?.lat && v.location?.lng)
      .map((v) => ({
        type: "Feature" as const,
        properties: {
          id: v.id,
          name: v.name,
          hasEvents: venueIdsWithEvents.has(v.id) ? 1 : 0,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [v.location!.lng, v.location!.lat],
        },
      }));
    return { type: "FeatureCollection" as const, features };
  }, [venues, venueIdsWithEvents]);

  // Build event GeoJSON
  const eventGeoJson = useMemo(() => {
    const features = Object.entries(eventGroups).map(([locationKey, eventsAtLocation]) => {
      const [latStr, lngStr] = locationKey.split(",");
      const firstEvent = eventsAtLocation[0];
      const hasTonight = eventsAtLocation.some((e) => e.date.startsWith(today));
      return {
        type: "Feature" as const,
        properties: {
          locationKey,
          name: eventsAtLocation.length > 1
            ? firstEvent.venueName || firstEvent.name
            : firstEvent.name,
          count: eventsAtLocation.length,
          isTonight: hasTonight ? 1 : 0,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [parseFloat(lngStr), parseFloat(latStr)],
        },
      };
    });
    return { type: "FeatureCollection" as const, features };
  }, [eventGroups, today]);

  // Initialize sources and layers
  useEffect(() => {
    if (!map || !isMapReady) return;

    const setupLayers = () => {
      // Clean up existing
      const layerIds = [
        "venue-clusters", "venue-cluster-count", "venue-live-glow", "venue-live",
        "venue-idle-glow", "venue-idle", "venue-labels",
        "event-clusters", "event-cluster-count", "event-tonight-glow", "event-tonight",
        "event-regular-glow", "event-regular", "event-labels"
      ];
      layerIds.forEach(id => {
        if (map.getLayer(id)) map.removeLayer(id);
      });
      if (map.getSource("venues")) map.removeSource("venues");
      if (map.getSource("events")) map.removeSource("events");

      // Add venue source with clustering
      map.addSource("venues", {
        type: "geojson",
        data: venueGeoJson,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      // Add event source with clustering
      map.addSource("events", {
        type: "geojson",
        data: eventGeoJson,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      // === VENUE LAYERS ===

      // Venue clusters
      map.addLayer({
        id: "venue-clusters",
        type: "circle",
        source: "venues",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#ff2e88",
          "circle-radius": ["step", ["get", "point_count"], 20, 10, 30, 50, 40],
          "circle-opacity": 0.8,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
          "circle-blur": 0.3,
        },
      });

      // Venue cluster count
      map.addLayer({
        id: "venue-cluster-count",
        type: "symbol",
        source: "venues",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 14,
        },
        paint: {
          "text-color": "#ffffff",
        },
      });

      // Venue live glow (has events)
      map.addLayer({
        id: "venue-live-glow",
        type: "circle",
        source: "venues",
        filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "hasEvents"], 1]],
        paint: {
          "circle-color": "#ff2e88",
          "circle-radius": 14,
          "circle-opacity": 0.4,
          "circle-blur": 0.8,
        },
      });

      // Venue live core
      map.addLayer({
        id: "venue-live",
        type: "circle",
        source: "venues",
        filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "hasEvents"], 1]],
        paint: {
          "circle-color": "#ff2e88",
          "circle-radius": 8,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      // Venue idle glow
      map.addLayer({
        id: "venue-idle-glow",
        type: "circle",
        source: "venues",
        filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "hasEvents"], 0]],
        paint: {
          "circle-color": "#06b6d4",
          "circle-radius": 10,
          "circle-opacity": 0.3,
          "circle-blur": 0.6,
        },
      });

      // Venue idle core
      map.addLayer({
        id: "venue-idle",
        type: "circle",
        source: "venues",
        filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "hasEvents"], 0]],
        paint: {
          "circle-color": "#06b6d4",
          "circle-radius": 5,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#ffffff",
        },
      });

      // Venue labels
      map.addLayer({
        id: "venue-labels",
        type: "symbol",
        source: "venues",
        filter: ["!", ["has", "point_count"]],
        minzoom: 12,
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Regular"],
          "text-size": 12,
          "text-offset": [1, 0],
          "text-anchor": "left",
          "text-max-width": 10,
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "#001930",
          "text-halo-width": 2,
        },
      });

      // === EVENT LAYERS ===

      // Event clusters
      map.addLayer({
        id: "event-clusters",
        type: "circle",
        source: "events",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#ff8c42",
          "circle-radius": ["step", ["get", "point_count"], 20, 10, 30, 50, 40],
          "circle-opacity": 0.8,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
          "circle-blur": 0.3,
        },
      });

      // Event cluster count
      map.addLayer({
        id: "event-cluster-count",
        type: "symbol",
        source: "events",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 14,
        },
        paint: {
          "text-color": "#ffffff",
        },
      });

      // Tonight event glow
      map.addLayer({
        id: "event-tonight-glow",
        type: "circle",
        source: "events",
        filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "isTonight"], 1]],
        paint: {
          "circle-color": "#06e8ff",
          "circle-radius": 16,
          "circle-opacity": 0.5,
          "circle-blur": 0.8,
        },
      });

      // Tonight event core
      map.addLayer({
        id: "event-tonight",
        type: "circle",
        source: "events",
        filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "isTonight"], 1]],
        paint: {
          "circle-color": "#06e8ff",
          "circle-radius": 9,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      // Regular event glow
      map.addLayer({
        id: "event-regular-glow",
        type: "circle",
        source: "events",
        filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "isTonight"], 0]],
        paint: {
          "circle-color": "#ff8c42",
          "circle-radius": 14,
          "circle-opacity": 0.4,
          "circle-blur": 0.7,
        },
      });

      // Regular event core
      map.addLayer({
        id: "event-regular",
        type: "circle",
        source: "events",
        filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "isTonight"], 0]],
        paint: {
          "circle-color": "#ff8c42",
          "circle-radius": 7,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#ffffff",
        },
      });

      // Event labels
      map.addLayer({
        id: "event-labels",
        type: "symbol",
        source: "events",
        filter: ["!", ["has", "point_count"]],
        minzoom: 12,
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Regular"],
          "text-size": 12,
          "text-offset": [1, 0],
          "text-anchor": "left",
          "text-max-width": 10,
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "#001930",
          "text-halo-width": 2,
        },
      });

      layersAddedRef.current = true;
    };

    // Wait for style to be loaded
    if (map.isStyleLoaded()) {
      setupLayers();
    } else {
      map.once("style.load", setupLayers);
    }

    return () => {
      // Cleanup on unmount
      const layerIds = [
        "venue-clusters", "venue-cluster-count", "venue-live-glow", "venue-live",
        "venue-idle-glow", "venue-idle", "venue-labels",
        "event-clusters", "event-cluster-count", "event-tonight-glow", "event-tonight",
        "event-regular-glow", "event-regular", "event-labels"
      ];
      layerIds.forEach(id => {
        if (map.getLayer(id)) map.removeLayer(id);
      });
      if (map.getSource("venues")) map.removeSource("venues");
      if (map.getSource("events")) map.removeSource("events");
    };
  }, [map, isMapReady]);

  // Update venue data
  useEffect(() => {
    if (!map || !isMapReady || !layersAddedRef.current) return;
    const source = map.getSource("venues") as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(venueGeoJson);
    }
  }, [map, isMapReady, venueGeoJson]);

  // Update event data
  useEffect(() => {
    if (!map || !isMapReady || !layersAddedRef.current) return;
    const source = map.getSource("events") as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(eventGeoJson);
    }
  }, [map, isMapReady, eventGeoJson]);

  // Toggle visibility
  useEffect(() => {
    if (!map || !isMapReady || !layersAddedRef.current) return;

    const venueLayerIds = ["venue-clusters", "venue-cluster-count", "venue-live-glow", "venue-live", "venue-idle-glow", "venue-idle", "venue-labels"];
    const eventLayerIds = ["event-clusters", "event-cluster-count", "event-tonight-glow", "event-tonight", "event-regular-glow", "event-regular", "event-labels"];

    venueLayerIds.forEach(id => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, "visibility", showVenues ? "visible" : "none");
      }
    });

    eventLayerIds.forEach(id => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, "visibility", showEvents ? "visible" : "none");
      }
    });
  }, [map, isMapReady, showVenues, showEvents]);

  // Click handlers
  useEffect(() => {
    if (!map || !isMapReady) return;

    const handleVenueClick = (e: mapboxgl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ["venue-live", "venue-idle", "venue-labels"],
      });
      if (features.length > 0) {
        const feature = features[0];
        const venueId = feature.properties?.id;
        const venue = venuesRef.current.find((v) => v.id === venueId);
        if (venue) {
          e.originalEvent.stopPropagation();
          onVenueClick(venue);
        }
      }
    };

    const handleVenueClusterClick = (e: mapboxgl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ["venue-clusters"],
      });
      if (features.length > 0) {
        const clusterId = features[0].properties?.cluster_id;
        const source = map.getSource("venues") as mapboxgl.GeoJSONSource;
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          const coords = (features[0].geometry as GeoJSON.Point).coordinates;
          map.easeTo({
            center: coords as [number, number],
            zoom: zoom!,
          });
        });
      }
    };

    const handleEventClick = (e: mapboxgl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ["event-tonight", "event-regular", "event-labels"],
      });
      if (features.length > 0) {
        const feature = features[0];
        const locationKey = feature.properties?.locationKey;
        const eventsAtLocation = eventGroupsRef.current[locationKey] || [];
        if (eventsAtLocation.length > 0) {
          e.originalEvent.stopPropagation();
          onEventClick(eventsAtLocation);
        }
      }
    };

    const handleEventClusterClick = (e: mapboxgl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ["event-clusters"],
      });
      if (features.length > 0) {
        const clusterId = features[0].properties?.cluster_id;
        const source = map.getSource("events") as mapboxgl.GeoJSONSource;
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          const coords = (features[0].geometry as GeoJSON.Point).coordinates;
          map.easeTo({
            center: coords as [number, number],
            zoom: zoom!,
          });
        });
      }
    };

    // Cursor changes
    const setCursorPointer = () => { map.getCanvas().style.cursor = "pointer"; };
    const setCursorDefault = () => { map.getCanvas().style.cursor = ""; };

    // Register handlers
    map.on("click", "venue-live", handleVenueClick);
    map.on("click", "venue-idle", handleVenueClick);
    map.on("click", "venue-labels", handleVenueClick);
    map.on("click", "venue-clusters", handleVenueClusterClick);
    map.on("click", "event-tonight", handleEventClick);
    map.on("click", "event-regular", handleEventClick);
    map.on("click", "event-labels", handleEventClick);
    map.on("click", "event-clusters", handleEventClusterClick);

    map.on("mouseenter", "venue-live", setCursorPointer);
    map.on("mouseenter", "venue-idle", setCursorPointer);
    map.on("mouseenter", "venue-clusters", setCursorPointer);
    map.on("mouseenter", "event-tonight", setCursorPointer);
    map.on("mouseenter", "event-regular", setCursorPointer);
    map.on("mouseenter", "event-clusters", setCursorPointer);

    map.on("mouseleave", "venue-live", setCursorDefault);
    map.on("mouseleave", "venue-idle", setCursorDefault);
    map.on("mouseleave", "venue-clusters", setCursorDefault);
    map.on("mouseleave", "event-tonight", setCursorDefault);
    map.on("mouseleave", "event-regular", setCursorDefault);
    map.on("mouseleave", "event-clusters", setCursorDefault);

    return () => {
      map.off("click", "venue-live", handleVenueClick);
      map.off("click", "venue-idle", handleVenueClick);
      map.off("click", "venue-labels", handleVenueClick);
      map.off("click", "venue-clusters", handleVenueClusterClick);
      map.off("click", "event-tonight", handleEventClick);
      map.off("click", "event-regular", handleEventClick);
      map.off("click", "event-labels", handleEventClick);
      map.off("click", "event-clusters", handleEventClusterClick);

      map.off("mouseenter", "venue-live", setCursorPointer);
      map.off("mouseenter", "venue-idle", setCursorPointer);
      map.off("mouseenter", "venue-clusters", setCursorPointer);
      map.off("mouseenter", "event-tonight", setCursorPointer);
      map.off("mouseenter", "event-regular", setCursorPointer);
      map.off("mouseenter", "event-clusters", setCursorPointer);

      map.off("mouseleave", "venue-live", setCursorDefault);
      map.off("mouseleave", "venue-idle", setCursorDefault);
      map.off("mouseleave", "venue-clusters", setCursorDefault);
      map.off("mouseleave", "event-tonight", setCursorDefault);
      map.off("mouseleave", "event-regular", setCursorDefault);
      map.off("mouseleave", "event-clusters", setCursorDefault);
    };
  }, [map, isMapReady, onVenueClick, onEventClick]);

  return null;
}

export default MapboxNativeLayers;
