"use client";

/**
 * DeckGlVenueLayer - GPU-accelerated venue markers using Deck.gl
 *
 * Performance: 60fps with 10k+ points vs ~5fps with HTML markers.
 *
 * Visual effects achieved through layer stacking:
 * - Glow: Multiple ScatterplotLayers with decreasing opacity
 * - Breathing: Animated radius via requestAnimationFrame
 * - Labels: TextLayer with outline halo
 */

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import type { PickingInfo } from "@deck.gl/core";
import type { Venue } from "@/lib/types";
import { useMapbox } from "@/context/MapboxContext";

interface DeckGlVenueLayerProps {
  venues: Venue[];
  venueIdsWithEvents: Set<string>;
  onVenueClick: (venue: Venue) => void;
  visible: boolean;
}

// Color constants (RGBA arrays for Deck.gl)
const COLORS = {
  liveFill: [255, 46, 136, 255] as [number, number, number, number],
  liveGlowInner: [255, 46, 136, 120] as [number, number, number, number],
  liveGlowOuter: [255, 46, 136, 50] as [number, number, number, number],
  idleFill: [6, 182, 212, 180] as [number, number, number, number],
  idleGlowInner: [6, 182, 212, 80] as [number, number, number, number],
  stroke: [255, 255, 255, 200] as [number, number, number, number],
  labelText: [255, 255, 255, 255] as [number, number, number, number],
  labelHalo: [0, 25, 48, 230] as [number, number, number, number],
};

interface VenueRenderData {
  id: string;
  name: string;
  position: [number, number];
  hasEvents: boolean;
  animOffset: number;
}

export function DeckGlVenueLayer({
  venues,
  venueIdsWithEvents,
  onVenueClick,
  visible,
}: DeckGlVenueLayerProps) {
  const { map, isMapReady } = useMapbox();
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const [zoom, setZoom] = useState(10);
  const breathePhaseRef = useRef(0);
  const animationIdRef = useRef<number | null>(null);

  // Store callbacks in refs to avoid recreating layers
  const onVenueClickRef = useRef(onVenueClick);
  const venuesRef = useRef(venues);
  useEffect(() => {
    onVenueClickRef.current = onVenueClick;
    venuesRef.current = venues;
  }, [onVenueClick, venues]);

  // Transform venues into render data
  const venueData = useMemo((): VenueRenderData[] => {
    return venues
      .filter((v) => v.location?.lat && v.location?.lng)
      .map((v) => ({
        id: v.id,
        name: v.name,
        position: [v.location!.lng, v.location!.lat] as [number, number],
        hasEvents: venueIdsWithEvents.has(v.id),
        animOffset: (v.id.charCodeAt(0) + v.id.charCodeAt(v.id.length - 1)) % 100 / 15,
      }));
  }, [venues, venueIdsWithEvents]);

  const liveVenues = useMemo(() => venueData.filter((v) => v.hasEvents), [venueData]);
  const idleVenues = useMemo(() => venueData.filter((v) => !v.hasEvents), [venueData]);

  // Track zoom level
  useEffect(() => {
    if (!map || !isMapReady) return;
    const handleZoom = () => setZoom(map.getZoom());
    map.on("zoom", handleZoom);
    setZoom(map.getZoom());
    return () => { map.off("zoom", handleZoom); };
  }, [map, isMapReady]);

  // Handle venue click
  const handleClick = useCallback((info: PickingInfo) => {
    if (!info.object) return;
    const data = info.object as VenueRenderData;
    const venue = venuesRef.current.find((v) => v.id === data.id);
    if (venue) onVenueClickRef.current(venue);
  }, []);

  // Build layers - called by animation loop
  const buildLayers = useCallback((breathePhase: number, currentZoom: number, isVisible: boolean) => {
    if (!isVisible) return [];

    const layers = [];
    const showLabels = currentZoom >= 12;
    const showAllLabels = currentZoom >= 13;

    // Live venue glow outer
    layers.push(
      new ScatterplotLayer({
        id: "venue-live-glow-outer",
        data: liveVenues,
        getPosition: (d) => d.position,
        getRadius: (d) => 22 + Math.sin(breathePhase + d.animOffset) * 4,
        radiusUnits: "pixels",
        getFillColor: COLORS.liveGlowOuter,
        antialiasing: true,
        pickable: false,
        updateTriggers: { getRadius: breathePhase },
      })
    );

    // Live venue glow inner
    layers.push(
      new ScatterplotLayer({
        id: "venue-live-glow-inner",
        data: liveVenues,
        getPosition: (d) => d.position,
        getRadius: (d) => 14 + Math.sin(breathePhase + d.animOffset) * 2,
        radiusUnits: "pixels",
        getFillColor: COLORS.liveGlowInner,
        antialiasing: true,
        pickable: false,
        updateTriggers: { getRadius: breathePhase },
      })
    );

    // Live venue core
    layers.push(
      new ScatterplotLayer({
        id: "venue-live-core",
        data: liveVenues,
        getPosition: (d) => d.position,
        getRadius: 8,
        radiusUnits: "pixels",
        getFillColor: COLORS.liveFill,
        stroked: true,
        getLineColor: COLORS.stroke,
        lineWidthUnits: "pixels",
        getLineWidth: 1.5,
        antialiasing: true,
        pickable: true,
        autoHighlight: true,
        highlightColor: [255, 255, 255, 80],
        onClick: handleClick,
      })
    );

    // Idle venue glow (higher zoom only)
    if (currentZoom >= 10) {
      layers.push(
        new ScatterplotLayer({
          id: "venue-idle-glow",
          data: idleVenues,
          getPosition: (d) => d.position,
          getRadius: 10,
          radiusUnits: "pixels",
          getFillColor: COLORS.idleGlowInner,
          antialiasing: true,
          pickable: false,
        })
      );
    }

    // Idle venue core
    layers.push(
      new ScatterplotLayer({
        id: "venue-idle-core",
        data: idleVenues,
        getPosition: (d) => d.position,
        getRadius: 5,
        radiusUnits: "pixels",
        getFillColor: COLORS.idleFill,
        stroked: true,
        getLineColor: COLORS.stroke,
        lineWidthUnits: "pixels",
        getLineWidth: 1,
        antialiasing: true,
        pickable: true,
        autoHighlight: true,
        highlightColor: [255, 255, 255, 80],
        onClick: handleClick,
      })
    );

    // Labels at high zoom
    if (showLabels) {
      layers.push(
        new TextLayer({
          id: "venue-live-labels",
          data: liveVenues,
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

      if (showAllLabels) {
        layers.push(
          new TextLayer({
            id: "venue-idle-labels",
            data: idleVenues,
            getPosition: (d) => d.position,
            getText: (d) => d.name,
            getSize: 11,
            getColor: [255, 255, 255, 180],
            outlineWidth: 2,
            outlineColor: COLORS.labelHalo,
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 500,
            getTextAnchor: "start",
            getAlignmentBaseline: "center",
            getPixelOffset: [10, 0],
            billboard: false,
            sizeUnits: "pixels",
            pickable: true,
            onClick: handleClick,
          })
        );
      }
    }

    return layers;
  }, [liveVenues, idleVenues, handleClick]);

  // Initialize overlay ONCE and manage via animation loop
  useEffect(() => {
    if (!map || !isMapReady) return;

    // Create overlay once
    if (!overlayRef.current) {
      overlayRef.current = new MapboxOverlay({
        interleaved: true,
        layers: [],
      });
      map.addControl(overlayRef.current);
    }

    // Animation loop - updates layers without recreating overlay
    const animate = () => {
      breathePhaseRef.current = (breathePhaseRef.current + 0.03) % (Math.PI * 2);

      if (overlayRef.current) {
        overlayRef.current.setProps({
          layers: buildLayers(breathePhaseRef.current, zoom, visible),
        });
      }

      animationIdRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animationIdRef.current = requestAnimationFrame(animate);

    // Cleanup only on unmount
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (overlayRef.current) {
        try {
          map.removeControl(overlayRef.current);
        } catch {
          // Map may be torn down
        }
        overlayRef.current = null;
      }
    };
  }, [map, isMapReady]); // Only depend on map - NOT on buildLayers or zoom

  // Update layers when data/zoom/visibility changes (outside animation)
  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.setProps({
        layers: buildLayers(breathePhaseRef.current, zoom, visible),
      });
    }
  }, [buildLayers, zoom, visible]);

  return null;
}

export default DeckGlVenueLayer;
