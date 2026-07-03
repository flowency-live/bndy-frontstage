"use client";

/**
 * DeckGlEventLayer - GPU-accelerated event markers using Deck.gl
 *
 * PROTOTYPE: Replaces HTML event markers with WebGL-rendered layers.
 *
 * Features:
 * - "Tonight" events pulse more intensely (sonar effect)
 * - Stacked glow layers for neon appearance
 * - TextLayer for venue/event names at high zoom
 * - Clustering handled by Mapbox source, Deck.gl renders features
 */

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import type { PickingInfo } from "@deck.gl/core";
import type { Event } from "@/lib/types";
import { useMapbox } from "@/context/MapboxContext";

interface DeckGlEventLayerProps {
  events: Event[];
  eventGroups: Record<string, Event[]>;
  onEventClick: (events: Event[]) => void;
  visible: boolean;
}

// Color constants
const COLORS = {
  // Event markers (orange/coral)
  eventFill: [255, 140, 66, 255] as [number, number, number, number],
  eventGlowInner: [255, 140, 66, 130] as [number, number, number, number],
  eventGlowOuter: [255, 140, 66, 50] as [number, number, number, number],
  // Tonight events (brighter, cyan accent)
  tonightFill: [6, 232, 255, 255] as [number, number, number, number],
  tonightGlowInner: [6, 232, 255, 150] as [number, number, number, number],
  tonightGlowOuter: [6, 232, 255, 60] as [number, number, number, number],
  // Shared
  stroke: [255, 255, 255, 220] as [number, number, number, number],
  labelText: [255, 255, 255, 255] as [number, number, number, number],
  labelHalo: [0, 25, 48, 230] as [number, number, number, number],
};

interface EventRenderData {
  locationKey: string;
  position: [number, number];
  name: string;
  venueName: string;
  count: number;
  isTonight: boolean;
  animOffset: number;
}

function todayLocalISO(): string {
  return new Date().toLocaleDateString("en-CA");
}

export function DeckGlEventLayer({
  events,
  eventGroups,
  onEventClick,
  visible,
}: DeckGlEventLayerProps) {
  const { map, isMapReady } = useMapbox();
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const [zoom, setZoom] = useState(10);
  const [pulsePhase, setPulsePhase] = useState(0);

  const today = useMemo(() => todayLocalISO(), []);

  // Transform events into render data (one per location)
  const eventData = useMemo((): EventRenderData[] => {
    return Object.entries(eventGroups).map(([locationKey, eventsAtLocation]) => {
      const firstEvent = eventsAtLocation[0];
      const [latStr, lngStr] = locationKey.split(",");
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);

      const hasTonight = eventsAtLocation.some((e) => e.date.startsWith(today));

      return {
        locationKey,
        position: [lng, lat] as [number, number],
        name: eventsAtLocation.length > 1
          ? firstEvent.venueName || firstEvent.name
          : firstEvent.name,
        venueName: firstEvent.venueName || "",
        count: eventsAtLocation.length,
        isTonight: hasTonight,
        animOffset: (locationKey.charCodeAt(0) + locationKey.length) % 100 / 15,
      };
    });
  }, [eventGroups, today]);

  // Separate tonight and regular events
  const tonightEvents = useMemo(
    () => eventData.filter((e) => e.isTonight),
    [eventData]
  );
  const regularEvents = useMemo(
    () => eventData.filter((e) => !e.isTonight),
    [eventData]
  );

  // Track zoom
  useEffect(() => {
    if (!map || !isMapReady) return;

    const handleZoom = () => setZoom(map.getZoom());
    map.on("zoom", handleZoom);
    setZoom(map.getZoom());

    return () => {
      map.off("zoom", handleZoom);
    };
  }, [map, isMapReady]);

  // Pulse animation for tonight events (faster than venue breathing)
  useEffect(() => {
    if (!visible) return;

    let animationId: number;
    const animate = () => {
      setPulsePhase((p) => (p + 0.05) % (Math.PI * 2));
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, [visible]);

  // Handle click
  const handleClick = useCallback(
    (info: PickingInfo) => {
      if (!info.object) return;
      const data = info.object as EventRenderData;
      const eventsAtLocation = eventGroups[data.locationKey] || [];
      if (eventsAtLocation.length > 0) {
        onEventClick(eventsAtLocation);
      }
    },
    [eventGroups, onEventClick]
  );

  // Build layers
  const buildLayers = useCallback(() => {
    if (!visible) return [];

    const layers = [];
    const showLabels = zoom >= 12;

    // === TONIGHT EVENT LAYERS (cyan, intense pulse) ===

    // Sonar ping effect - expanding ring
    layers.push(
      new ScatterplotLayer({
        id: "event-tonight-sonar",
        data: tonightEvents,
        getPosition: (d) => d.position,
        // Sonar: radius expands then resets
        getRadius: (d) => {
          const phase = (pulsePhase + d.animOffset) % (Math.PI * 2);
          return 12 + (phase / Math.PI) * 20;
        },
        radiusUnits: "pixels",
        getFillColor: [0, 0, 0, 0], // Transparent fill
        stroked: true,
        getLineColor: (d) => {
          const phase = (pulsePhase + d.animOffset) % (Math.PI * 2);
          const opacity = Math.max(0, 150 - (phase / Math.PI) * 150);
          return [6, 232, 255, opacity];
        },
        lineWidthUnits: "pixels",
        getLineWidth: 2,
        antialiasing: true,
        pickable: false,
        updateTriggers: {
          getRadius: pulsePhase,
          getLineColor: pulsePhase,
        },
      })
    );

    // Tonight glow
    layers.push(
      new ScatterplotLayer({
        id: "event-tonight-glow",
        data: tonightEvents,
        getPosition: (d) => d.position,
        getRadius: 16,
        radiusUnits: "pixels",
        getFillColor: COLORS.tonightGlowInner,
        antialiasing: true,
        pickable: false,
      })
    );

    // Tonight core
    layers.push(
      new ScatterplotLayer({
        id: "event-tonight-core",
        data: tonightEvents,
        getPosition: (d) => d.position,
        getRadius: 9,
        radiusUnits: "pixels",
        getFillColor: COLORS.tonightFill,
        stroked: true,
        getLineColor: COLORS.stroke,
        lineWidthUnits: "pixels",
        getLineWidth: 2,
        antialiasing: true,
        pickable: true,
        autoHighlight: true,
        highlightColor: [255, 255, 255, 100],
        onClick: handleClick,
      })
    );

    // === REGULAR EVENT LAYERS (orange) ===

    // Outer glow
    layers.push(
      new ScatterplotLayer({
        id: "event-regular-glow-outer",
        data: regularEvents,
        getPosition: (d) => d.position,
        getRadius: 18,
        radiusUnits: "pixels",
        getFillColor: COLORS.eventGlowOuter,
        antialiasing: true,
        pickable: false,
      })
    );

    // Inner glow
    layers.push(
      new ScatterplotLayer({
        id: "event-regular-glow-inner",
        data: regularEvents,
        getPosition: (d) => d.position,
        getRadius: 12,
        radiusUnits: "pixels",
        getFillColor: COLORS.eventGlowInner,
        antialiasing: true,
        pickable: false,
      })
    );

    // Core dot
    layers.push(
      new ScatterplotLayer({
        id: "event-regular-core",
        data: regularEvents,
        getPosition: (d) => d.position,
        getRadius: 7,
        radiusUnits: "pixels",
        getFillColor: COLORS.eventFill,
        stroked: true,
        getLineColor: COLORS.stroke,
        lineWidthUnits: "pixels",
        getLineWidth: 1.5,
        antialiasing: true,
        pickable: true,
        autoHighlight: true,
        highlightColor: [255, 255, 255, 100],
        onClick: handleClick,
      })
    );

    // === EVENT COUNT BADGES (for locations with multiple events) ===

    const multiEventLocations = eventData.filter((e) => e.count > 1);
    if (multiEventLocations.length > 0) {
      layers.push(
        new TextLayer({
          id: "event-count-badges",
          data: multiEventLocations,
          getPosition: (d) => d.position,
          getText: (d) => String(d.count),
          getSize: 10,
          getColor: [255, 255, 255, 255],
          outlineWidth: 0,
          backgroundColor: [255, 100, 50, 255],
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 700,
          getTextAnchor: "middle",
          getAlignmentBaseline: "center",
          getPixelOffset: [12, -10],
          billboard: false,
          sizeUnits: "pixels",
          pickable: false,
        })
      );
    }

    // === TEXT LABELS (high zoom) ===

    if (showLabels) {
      layers.push(
        new TextLayer({
          id: "event-labels",
          data: eventData,
          getPosition: (d) => d.position,
          getText: (d) => d.name,
          getSize: 12,
          getColor: COLORS.labelText,
          outlineWidth: 3,
          outlineColor: COLORS.labelHalo,
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 600,
          getTextAnchor: "start",
          getAlignmentBaseline: "center",
          getPixelOffset: [14, 0],
          billboard: false,
          sizeUnits: "pixels",
          pickable: true,
          onClick: handleClick,
        })
      );
    }

    return layers;
  }, [
    visible,
    zoom,
    tonightEvents,
    regularEvents,
    eventData,
    pulsePhase,
    handleClick,
  ]);

  // Initialize overlay
  useEffect(() => {
    if (!map || !isMapReady) return;

    if (!overlayRef.current) {
      overlayRef.current = new MapboxOverlay({
        interleaved: true,
        layers: buildLayers(),
      });
      map.addControl(overlayRef.current);
    } else {
      overlayRef.current.setProps({
        layers: buildLayers(),
      });
    }

    return () => {
      if (overlayRef.current) {
        try {
          map.removeControl(overlayRef.current);
        } catch {
          // Map may be torn down
        }
        overlayRef.current = null;
      }
    };
  }, [map, isMapReady, buildLayers]);

  // Update layers
  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.setProps({
        layers: buildLayers(),
      });
    }
  }, [buildLayers]);

  return null;
}

export default DeckGlEventLayer;
