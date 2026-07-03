"use client";

/**
 * DeckGlVenueLayer - GPU-accelerated venue markers using Deck.gl
 *
 * PROTOTYPE: This replaces the HTML marker system with WebGL-rendered layers.
 * Performance: 60fps with 10k+ points vs ~5fps with HTML markers.
 *
 * Visual effects achieved through layer stacking:
 * - Glow: Multiple ScatterplotLayers with decreasing opacity
 * - Breathing: Animated radius via requestAnimationFrame
 * - Labels: TextLayer with outline halo
 *
 * Installation required:
 *   npm install @deck.gl/core @deck.gl/layers @deck.gl/mapbox
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
  // Live venues (pink/magenta)
  liveFill: [255, 46, 136, 255] as [number, number, number, number],
  liveGlowInner: [255, 46, 136, 120] as [number, number, number, number],
  liveGlowOuter: [255, 46, 136, 50] as [number, number, number, number],
  // Idle venues (cyan)
  idleFill: [6, 182, 212, 180] as [number, number, number, number],
  idleGlowInner: [6, 182, 212, 80] as [number, number, number, number],
  // Shared
  stroke: [255, 255, 255, 200] as [number, number, number, number],
  labelText: [255, 255, 255, 255] as [number, number, number, number],
  labelHalo: [0, 25, 48, 230] as [number, number, number, number],
};

// Processed venue data for rendering
interface VenueRenderData {
  id: string;
  name: string;
  position: [number, number];
  hasEvents: boolean;
  // Random offset for breathing animation desync
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
  const [breathePhase, setBreathePhase] = useState(0);

  // Transform venues into render data with stable animation offsets
  const venueData = useMemo((): VenueRenderData[] => {
    return venues
      .filter((v) => v.location?.lat && v.location?.lng)
      .map((v) => ({
        id: v.id,
        name: v.name,
        position: [v.location!.lng, v.location!.lat] as [number, number],
        hasEvents: venueIdsWithEvents.has(v.id),
        // Deterministic random offset based on venue ID
        animOffset: (v.id.charCodeAt(0) + v.id.charCodeAt(v.id.length - 1)) % 100 / 15,
      }));
  }, [venues, venueIdsWithEvents]);

  // Separate live and idle venues for efficient filtering
  const liveVenues = useMemo(
    () => venueData.filter((v) => v.hasEvents),
    [venueData]
  );
  const idleVenues = useMemo(
    () => venueData.filter((v) => !v.hasEvents),
    [venueData]
  );

  // Track zoom level for label visibility
  useEffect(() => {
    if (!map || !isMapReady) return;

    const handleZoom = () => setZoom(map.getZoom());
    map.on("zoom", handleZoom);
    setZoom(map.getZoom());

    return () => {
      map.off("zoom", handleZoom);
    };
  }, [map, isMapReady]);

  // Breathing animation loop for live venues
  useEffect(() => {
    if (!visible) return;

    let animationId: number;
    const animate = () => {
      setBreathePhase((p) => (p + 0.03) % (Math.PI * 2));
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, [visible]);

  // Handle venue click
  const handleClick = useCallback(
    (info: PickingInfo) => {
      if (!info.object) return;
      const venueData = info.object as VenueRenderData;
      const venue = venues.find((v) => v.id === venueData.id);
      if (venue) {
        onVenueClick(venue);
      }
    },
    [venues, onVenueClick]
  );

  // Build all layers
  const buildLayers = useCallback(() => {
    if (!visible) return [];

    const layers = [];
    const showLabels = zoom >= 12;
    const showAllLabels = zoom >= 13;

    // === LIVE VENUE LAYERS (pink with glow + breathing) ===

    // Layer 1: Outer glow for live venues
    layers.push(
      new ScatterplotLayer({
        id: "venue-live-glow-outer",
        data: liveVenues,
        getPosition: (d) => d.position,
        // Breathing: radius oscillates with sine wave
        getRadius: (d) => 22 + Math.sin(breathePhase + d.animOffset) * 4,
        radiusUnits: "pixels",
        getFillColor: COLORS.liveGlowOuter,
        antialiasing: true,
        pickable: false,
        updateTriggers: {
          getRadius: breathePhase,
        },
      })
    );

    // Layer 2: Inner glow for live venues
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
        updateTriggers: {
          getRadius: breathePhase,
        },
      })
    );

    // Layer 3: Core dot for live venues (pickable)
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

    // === IDLE VENUE LAYERS (cyan, smaller, subtle glow) ===

    // Layer 4: Subtle glow for idle venues (only at higher zoom)
    if (zoom >= 10) {
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

    // Layer 5: Core dot for idle venues (pickable)
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

    // === TEXT LABELS (only at high zoom) ===

    if (showLabels) {
      // Labels for live venues (always show at z12+)
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

      // Labels for idle venues (only at z13+)
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
  }, [
    visible,
    zoom,
    liveVenues,
    idleVenues,
    breathePhase,
    handleClick,
  ]);

  // Initialize and update MapboxOverlay
  useEffect(() => {
    if (!map || !isMapReady) return;

    // Create overlay if doesn't exist
    if (!overlayRef.current) {
      overlayRef.current = new MapboxOverlay({
        interleaved: true, // Render inside Mapbox's WebGL context
        layers: buildLayers(),
      });
      map.addControl(overlayRef.current);
    } else {
      // Update layers
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

  // Update layers when data or visibility changes
  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.setProps({
        layers: buildLayers(),
      });
    }
  }, [buildLayers]);

  return null; // No DOM output - all rendering via WebGL
}

export default DeckGlVenueLayer;
