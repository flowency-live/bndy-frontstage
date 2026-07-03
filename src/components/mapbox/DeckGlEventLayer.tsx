"use client";

/**
 * DeckGlEventLayer - GPU-accelerated event markers using Deck.gl
 *
 * Features:
 * - "Tonight" events pulse with sonar effect
 * - Stacked glow layers for neon appearance
 * - TextLayer for venue/event names at high zoom
 */

import { useEffect, useRef, useCallback, useMemo } from "react";
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

const COLORS = {
  eventFill: [255, 140, 66, 255] as [number, number, number, number],
  eventGlowInner: [255, 140, 66, 130] as [number, number, number, number],
  eventGlowOuter: [255, 140, 66, 50] as [number, number, number, number],
  tonightFill: [6, 232, 255, 255] as [number, number, number, number],
  tonightGlowInner: [6, 232, 255, 150] as [number, number, number, number],
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
  const pulsePhaseRef = useRef(0);
  const animationIdRef = useRef<number | null>(null);

  // Store all dynamic values in refs so animation loop reads current values
  const zoomRef = useRef(10);
  const visibleRef = useRef(visible);
  const onEventClickRef = useRef(onEventClick);
  const eventGroupsRef = useRef(eventGroups);

  // Update refs when props change
  useEffect(() => { visibleRef.current = visible; }, [visible]);
  useEffect(() => {
    onEventClickRef.current = onEventClick;
    eventGroupsRef.current = eventGroups;
  }, [onEventClick, eventGroups]);

  const today = useMemo(() => todayLocalISO(), []);

  // Transform events into render data
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

  const tonightEvents = useMemo(() => eventData.filter((e) => e.isTonight), [eventData]);
  const regularEvents = useMemo(() => eventData.filter((e) => !e.isTonight), [eventData]);

  // Store computed data in refs too
  const eventDataRef = useRef(eventData);
  const tonightEventsRef = useRef(tonightEvents);
  const regularEventsRef = useRef(regularEvents);
  useEffect(() => { eventDataRef.current = eventData; }, [eventData]);
  useEffect(() => { tonightEventsRef.current = tonightEvents; }, [tonightEvents]);
  useEffect(() => { regularEventsRef.current = regularEvents; }, [regularEvents]);

  // Track zoom level
  useEffect(() => {
    if (!map || !isMapReady) return;
    const handleZoom = () => { zoomRef.current = map.getZoom(); };
    map.on("zoom", handleZoom);
    zoomRef.current = map.getZoom();
    return () => { map.off("zoom", handleZoom); };
  }, [map, isMapReady]);

  // Handle click
  const handleClick = useCallback((info: PickingInfo) => {
    if (!info.object) return;
    const data = info.object as EventRenderData;
    const eventsAtLocation = eventGroupsRef.current[data.locationKey] || [];
    if (eventsAtLocation.length > 0) {
      onEventClickRef.current(eventsAtLocation);
    }
  }, []);

  // Build layers function - reads from refs for current values
  const buildLayers = useCallback(() => {
    if (!visibleRef.current) return [];

    const pulsePhase = pulsePhaseRef.current;
    const currentZoom = zoomRef.current;
    const tonight = tonightEventsRef.current;
    const regular = regularEventsRef.current;
    const allEvents = eventDataRef.current;

    const layers = [];
    const showLabels = currentZoom >= 12;

    // Tonight sonar effect
    layers.push(
      new ScatterplotLayer({
        id: "event-tonight-sonar",
        data: tonight,
        getPosition: (d) => d.position,
        getRadius: (d) => {
          const phase = (pulsePhase + d.animOffset) % (Math.PI * 2);
          return 12 + (phase / Math.PI) * 20;
        },
        radiusUnits: "pixels",
        getFillColor: [0, 0, 0, 0],
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
        data: tonight,
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
        data: tonight,
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

    // Regular event glow outer
    layers.push(
      new ScatterplotLayer({
        id: "event-regular-glow-outer",
        data: regular,
        getPosition: (d) => d.position,
        getRadius: 18,
        radiusUnits: "pixels",
        getFillColor: COLORS.eventGlowOuter,
        antialiasing: true,
        pickable: false,
      })
    );

    // Regular event glow inner
    layers.push(
      new ScatterplotLayer({
        id: "event-regular-glow-inner",
        data: regular,
        getPosition: (d) => d.position,
        getRadius: 12,
        radiusUnits: "pixels",
        getFillColor: COLORS.eventGlowInner,
        antialiasing: true,
        pickable: false,
      })
    );

    // Regular event core
    layers.push(
      new ScatterplotLayer({
        id: "event-regular-core",
        data: regular,
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

    // Event count badges
    const multiEventLocations = allEvents.filter((e) => e.count > 1);
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

    // Labels at high zoom
    if (showLabels) {
      layers.push(
        new TextLayer({
          id: "event-labels",
          data: allEvents,
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
  }, [handleClick]);

  // Initialize overlay and animation
  useEffect(() => {
    if (!map || !isMapReady) return;

    // Create overlay once
    if (!overlayRef.current) {
      overlayRef.current = new MapboxOverlay({
        interleaved: true,
        layers: buildLayers(),
      });
      map.addControl(overlayRef.current);
    }

    // Animation loop
    const animate = () => {
      pulsePhaseRef.current = (pulsePhaseRef.current + 0.05) % (Math.PI * 2);

      if (overlayRef.current) {
        overlayRef.current.setProps({ layers: buildLayers() });
      }

      animationIdRef.current = requestAnimationFrame(animate);
    };

    animationIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      if (overlayRef.current) {
        try { map.removeControl(overlayRef.current); } catch {}
        overlayRef.current = null;
      }
    };
  }, [map, isMapReady, buildLayers]);

  return null;
}

export default DeckGlEventLayer;
