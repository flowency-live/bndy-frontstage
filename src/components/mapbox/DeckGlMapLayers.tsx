"use client";

/**
 * DeckGlMapLayers - Single unified Deck.gl overlay for all map markers
 *
 * Consolidates venue and event layers into ONE MapboxOverlay with ONE animation loop.
 * This prevents WebGL context conflicts from competing overlays.
 */

import { useEffect, useRef, useCallback, useMemo } from "react";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import type { PickingInfo } from "@deck.gl/core";
import type { Event, Venue } from "@/lib/types";
import { useMapbox } from "@/context/MapboxContext";

interface DeckGlMapLayersProps {
  // Venue data
  venues: Venue[];
  venueIdsWithEvents: Set<string>;
  onVenueClick: (venue: Venue) => void;
  showVenues: boolean;
  // Event data
  events: Event[];
  eventGroups: Record<string, Event[]>;
  onEventClick: (events: Event[]) => void;
  showEvents: boolean;
}

const COLORS = {
  // Venue colors
  venueLiveFill: [255, 46, 136, 255] as [number, number, number, number],
  venueLiveGlow: [255, 46, 136, 80] as [number, number, number, number],
  venueIdleFill: [6, 182, 212, 180] as [number, number, number, number],
  venueIdleGlow: [6, 182, 212, 60] as [number, number, number, number],
  // Event colors
  eventFill: [255, 140, 66, 255] as [number, number, number, number],
  eventGlow: [255, 140, 66, 80] as [number, number, number, number],
  tonightFill: [6, 232, 255, 255] as [number, number, number, number],
  tonightGlow: [6, 232, 255, 100] as [number, number, number, number],
  // Shared
  stroke: [255, 255, 255, 200] as [number, number, number, number],
  labelText: [255, 255, 255, 255] as [number, number, number, number],
  labelHalo: [0, 25, 48, 230] as [number, number, number, number],
};

interface VenueRenderData {
  id: string;
  name: string;
  position: [number, number];
  hasEvents: boolean;
  venue: Venue;
}

interface EventRenderData {
  locationKey: string;
  position: [number, number];
  name: string;
  count: number;
  isTonight: boolean;
}

function todayLocalISO(): string {
  return new Date().toLocaleDateString("en-CA");
}

export function DeckGlMapLayers({
  venues,
  venueIdsWithEvents,
  onVenueClick,
  showVenues,
  events,
  eventGroups,
  onEventClick,
  showEvents,
}: DeckGlMapLayersProps) {
  const { map, isMapReady } = useMapbox();
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const phaseRef = useRef(0);
  const zoomRef = useRef(10);

  // Store all props in refs for animation loop access
  const showVenuesRef = useRef(showVenues);
  const showEventsRef = useRef(showEvents);
  const onVenueClickRef = useRef(onVenueClick);
  const onEventClickRef = useRef(onEventClick);
  const eventGroupsRef = useRef(eventGroups);

  useEffect(() => { showVenuesRef.current = showVenues; }, [showVenues]);
  useEffect(() => { showEventsRef.current = showEvents; }, [showEvents]);
  useEffect(() => { onVenueClickRef.current = onVenueClick; }, [onVenueClick]);
  useEffect(() => { onEventClickRef.current = onEventClick; }, [onEventClick]);
  useEffect(() => { eventGroupsRef.current = eventGroups; }, [eventGroups]);

  const today = useMemo(() => todayLocalISO(), []);

  // Transform venues to render data
  const venueData = useMemo((): VenueRenderData[] => {
    return venues
      .filter((v) => v.location?.lat && v.location?.lng)
      .map((v) => ({
        id: v.id,
        name: v.name,
        position: [v.location!.lng, v.location!.lat] as [number, number],
        hasEvents: venueIdsWithEvents.has(v.id),
        venue: v,
      }));
  }, [venues, venueIdsWithEvents]);

  const liveVenues = useMemo(() => venueData.filter((v) => v.hasEvents), [venueData]);
  const idleVenues = useMemo(() => venueData.filter((v) => !v.hasEvents), [venueData]);

  // Transform events to render data
  const eventData = useMemo((): EventRenderData[] => {
    return Object.entries(eventGroups).map(([locationKey, eventsAtLocation]) => {
      const firstEvent = eventsAtLocation[0];
      const [latStr, lngStr] = locationKey.split(",");
      const hasTonight = eventsAtLocation.some((e) => e.date.startsWith(today));
      return {
        locationKey,
        position: [parseFloat(lngStr), parseFloat(latStr)] as [number, number],
        name: eventsAtLocation.length > 1
          ? firstEvent.venueName || firstEvent.name
          : firstEvent.name,
        count: eventsAtLocation.length,
        isTonight: hasTonight,
      };
    });
  }, [eventGroups, today]);

  const tonightEvents = useMemo(() => eventData.filter((e) => e.isTonight), [eventData]);
  const regularEvents = useMemo(() => eventData.filter((e) => !e.isTonight), [eventData]);

  // Store computed data in refs
  const liveVenuesRef = useRef(liveVenues);
  const idleVenuesRef = useRef(idleVenues);
  const tonightEventsRef = useRef(tonightEvents);
  const regularEventsRef = useRef(regularEvents);
  const eventDataRef = useRef(eventData);
  const venueDataRef = useRef(venueData);

  useEffect(() => { liveVenuesRef.current = liveVenues; }, [liveVenues]);
  useEffect(() => { idleVenuesRef.current = idleVenues; }, [idleVenues]);
  useEffect(() => { tonightEventsRef.current = tonightEvents; }, [tonightEvents]);
  useEffect(() => { regularEventsRef.current = regularEvents; }, [regularEvents]);
  useEffect(() => { eventDataRef.current = eventData; }, [eventData]);
  useEffect(() => { venueDataRef.current = venueData; }, [venueData]);

  // Track zoom
  useEffect(() => {
    if (!map || !isMapReady) return;
    const handleZoom = () => { zoomRef.current = map.getZoom(); };
    map.on("zoom", handleZoom);
    zoomRef.current = map.getZoom();
    return () => { map.off("zoom", handleZoom); };
  }, [map, isMapReady]);

  // Click handlers
  const handleVenueClick = useCallback((info: PickingInfo) => {
    if (!info.object) return;
    const data = info.object as VenueRenderData;
    onVenueClickRef.current(data.venue);
  }, []);

  const handleEventClick = useCallback((info: PickingInfo) => {
    if (!info.object) return;
    const data = info.object as EventRenderData;
    const eventsAtLocation = eventGroupsRef.current[data.locationKey] || [];
    if (eventsAtLocation.length > 0) {
      onEventClickRef.current(eventsAtLocation);
    }
  }, []);

  // Build all layers - single function for both venue and event layers
  const buildLayers = useCallback(() => {
    const layers = [];
    const phase = phaseRef.current;
    const zoom = zoomRef.current;
    const showLabels = zoom >= 12;

    // === VENUE LAYERS ===
    if (showVenuesRef.current) {
      const live = liveVenuesRef.current;
      const idle = idleVenuesRef.current;

      // Live venue glow (breathing)
      layers.push(
        new ScatterplotLayer({
          id: "venue-live-glow",
          data: live,
          getPosition: (d) => d.position,
          getRadius: 14 + Math.sin(phase) * 3,
          radiusUnits: "pixels",
          getFillColor: COLORS.venueLiveGlow,
          pickable: false,
          updateTriggers: { getRadius: phase },
        })
      );

      // Live venue core
      layers.push(
        new ScatterplotLayer({
          id: "venue-live-core",
          data: live,
          getPosition: (d) => d.position,
          getRadius: 8,
          radiusUnits: "pixels",
          getFillColor: COLORS.venueLiveFill,
          stroked: true,
          getLineColor: COLORS.stroke,
          lineWidthUnits: "pixels",
          getLineWidth: 1.5,
          pickable: true,
          autoHighlight: true,
          highlightColor: [255, 255, 255, 80],
          onClick: handleVenueClick,
        })
      );

      // Idle venue glow (only at higher zoom)
      if (zoom >= 10) {
        layers.push(
          new ScatterplotLayer({
            id: "venue-idle-glow",
            data: idle,
            getPosition: (d) => d.position,
            getRadius: 10,
            radiusUnits: "pixels",
            getFillColor: COLORS.venueIdleGlow,
            pickable: false,
          })
        );
      }

      // Idle venue core
      layers.push(
        new ScatterplotLayer({
          id: "venue-idle-core",
          data: idle,
          getPosition: (d) => d.position,
          getRadius: 5,
          radiusUnits: "pixels",
          getFillColor: COLORS.venueIdleFill,
          stroked: true,
          getLineColor: COLORS.stroke,
          lineWidthUnits: "pixels",
          getLineWidth: 1,
          pickable: true,
          autoHighlight: true,
          highlightColor: [255, 255, 255, 80],
          onClick: handleVenueClick,
        })
      );

      // Venue labels
      if (showLabels) {
        layers.push(
          new TextLayer({
            id: "venue-labels",
            data: live,
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
            onClick: handleVenueClick,
          })
        );
      }
    }

    // === EVENT LAYERS ===
    if (showEventsRef.current) {
      const tonight = tonightEventsRef.current;
      const regular = regularEventsRef.current;
      const allEvents = eventDataRef.current;

      // Tonight sonar pulse
      layers.push(
        new ScatterplotLayer({
          id: "event-tonight-sonar",
          data: tonight,
          getPosition: (d) => d.position,
          getRadius: 12 + (phase / Math.PI) * 18,
          radiusUnits: "pixels",
          getFillColor: [0, 0, 0, 0],
          stroked: true,
          getLineColor: [6, 232, 255, Math.max(0, 150 - (phase / Math.PI) * 150)],
          lineWidthUnits: "pixels",
          getLineWidth: 2,
          pickable: false,
          updateTriggers: { getRadius: phase, getLineColor: phase },
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
          getFillColor: COLORS.tonightGlow,
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
          pickable: true,
          autoHighlight: true,
          highlightColor: [255, 255, 255, 100],
          onClick: handleEventClick,
        })
      );

      // Regular event glow
      layers.push(
        new ScatterplotLayer({
          id: "event-regular-glow",
          data: regular,
          getPosition: (d) => d.position,
          getRadius: 14,
          radiusUnits: "pixels",
          getFillColor: COLORS.eventGlow,
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
          pickable: true,
          autoHighlight: true,
          highlightColor: [255, 255, 255, 100],
          onClick: handleEventClick,
        })
      );

      // Event count badges
      const multiEvents = allEvents.filter((e) => e.count > 1);
      if (multiEvents.length > 0) {
        layers.push(
          new TextLayer({
            id: "event-count-badges",
            data: multiEvents,
            getPosition: (d) => d.position,
            getText: (d) => String(d.count),
            getSize: 10,
            getColor: [255, 255, 255, 255],
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

      // Event labels
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
            onClick: handleEventClick,
          })
        );
      }
    }

    return layers;
  }, [handleVenueClick, handleEventClick]);

  // Single overlay and animation loop
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

    // Single animation loop for all layers
    const animate = () => {
      phaseRef.current = (phaseRef.current + 0.04) % (Math.PI * 2);

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

export default DeckGlMapLayers;
