"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { createMarkerElement, markerOptsKey, MarkerOpts } from "./markerElements";

/**
 * useDiffedMarkers - renders neon HTML markers from a clustered GeoJSON source.
 *
 * Keeps Mapbox's native clustering (the source does the math); this hook turns
 * `querySourceFeatures` results into diffed `mapboxgl.Marker`s:
 *   - unchanged markers are kept (preserves CSS animation phase — IMPORTANT,
 *     never clear-and-recreate)
 *   - stale markers are removed
 *   - markers whose visual opts changed are rebuilt in place
 *
 * Updates are scheduled on map move/zoom/sourcedata, coalesced via rAF.
 */

export interface DiffedMarkerSpec {
  /** Stable key, e.g. `c:${cluster_id}` or `v:${venueId}` */
  key: string;
  lngLat: [number, number];
  opts: MarkerOpts;
  onClick?: () => void;
}

interface MarkerEntry {
  marker: mapboxgl.Marker;
  el: HTMLDivElement;
  optsKey: string;
  /** Latest spec — click listener reads through this ref-like field */
  spec: DiffedMarkerSpec;
}

interface UseDiffedMarkersArgs {
  map: mapboxgl.Map | null;
  isMapReady: boolean;
  sourceId: string;
  /** Hide/remove all markers when false (mode toggle) */
  enabled: boolean;
  /**
   * Convert source features (clusters + singles, MAY contain duplicates across
   * tiles) into marker specs. Return one spec per desired marker; the hook
   * dedupes by key (first wins). Must be referentially stable (useCallback) or
   * read state through refs.
   */
  buildSpecs: (features: GeoJSON.Feature[]) => DiffedMarkerSpec[];
}

export function useDiffedMarkers({ map, isMapReady, sourceId, enabled, buildSpecs }: UseDiffedMarkersArgs): void {
  const entriesRef = useRef<Map<string, MarkerEntry>>(new Map());
  const selectedKeyRef = useRef<string | null>(null);
  const buildSpecsRef = useRef(buildSpecs);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    buildSpecsRef.current = buildSpecs;
  }, [buildSpecs]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    if (!map || !isMapReady) return;

    let rafId = 0;
    let disposed = false;

    const removeAll = () => {
      entriesRef.current.forEach((entry) => entry.marker.remove());
      entriesRef.current.clear();
    };

    const update = () => {
      rafId = 0;
      if (disposed) return;

      if (!enabledRef.current) {
        removeAll();
        return;
      }

      // Source may be missing briefly after a style change
      let features: GeoJSON.Feature[] = [];
      try {
        if (!map.getSource(sourceId)) {
          console.log(`[useDiffedMarkers:${sourceId}] No source found`);
          return;
        }
        features = map.querySourceFeatures(sourceId) as unknown as GeoJSON.Feature[];
        console.log(`[useDiffedMarkers:${sourceId}] querySourceFeatures returned ${features.length} features`);
      } catch (e) {
        console.log(`[useDiffedMarkers:${sourceId}] Error querying:`, e);
        return; // style mid-load
      }

      const specs = buildSpecsRef.current(features);
      console.log(`[useDiffedMarkers:${sourceId}] buildSpecs returned ${specs.length} specs`);
      const wanted = new Map<string, DiffedMarkerSpec>();
      for (const spec of specs) {
        if (!wanted.has(spec.key)) wanted.set(spec.key, spec); // dedupe tiles
      }

      const entries = entriesRef.current;

      // Remove stale
      entries.forEach((entry, key) => {
        if (!wanted.has(key)) {
          entry.marker.remove();
          entries.delete(key);
          if (selectedKeyRef.current === key) selectedKeyRef.current = null;
        }
      });

      // Add new / update existing
      wanted.forEach((spec, key) => {
        const existing = entries.get(key);
        const newOptsKey = markerOptsKey(spec.opts);

        if (existing) {
          existing.spec = spec;
          existing.marker.setLngLat(spec.lngLat);
          if (existing.optsKey !== newOptsKey) {
            // Visual changed (e.g. count, hasGigs flip) — rebuild element content
            const fresh = createMarkerElement(spec.opts);
            existing.el.className = fresh.className;
            existing.el.innerHTML = fresh.innerHTML;
            existing.el.style.animationDelay = fresh.style.animationDelay;
            if (selectedKeyRef.current === key) existing.el.classList.add("is-selected");
            existing.optsKey = newOptsKey;
          }
          return;
        }

        const el = createMarkerElement(spec.opts);
        const entry: MarkerEntry = {
          el,
          optsKey: newOptsKey,
          spec,
          marker: new mapboxgl.Marker({ element: el, anchor: "center" })
            .setLngLat(spec.lngLat)
            .addTo(map),
        };

        el.addEventListener("click", (ev) => {
          ev.stopPropagation();
          // Selection: clusters zoom away, so only singles keep a ring
          if (entry.spec.opts.type !== "cluster") {
            const prev = selectedKeyRef.current;
            if (prev && prev !== key) {
              entriesRef.current.get(prev)?.el.classList.remove("is-selected");
            }
            selectedKeyRef.current = key;
            el.classList.add("is-selected");
          }
          entry.spec.onClick?.();
        });

        entries.set(key, entry);
      });
    };

    const schedule = () => {
      if (!rafId) rafId = requestAnimationFrame(update);
    };

    const onSourceData = (e: mapboxgl.MapSourceDataEvent) => {
      if (e.sourceId === sourceId) schedule();
    };

    const onMapClick = () => {
      // Background click clears selection (marker clicks stopPropagation)
      const prev = selectedKeyRef.current;
      if (prev) {
        entriesRef.current.get(prev)?.el.classList.remove("is-selected");
        selectedKeyRef.current = null;
      }
    };

    map.on("move", schedule);
    map.on("moveend", schedule);
    map.on("sourcedata", onSourceData);
    map.on("click", onMapClick);

    schedule(); // initial paint

    return () => {
      disposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      map.off("move", schedule);
      map.off("moveend", schedule);
      map.off("sourcedata", onSourceData);
      map.off("click", onMapClick);
      removeAll();
    };
  }, [map, isMapReady, sourceId]);

  // React to `enabled` flips immediately (effect above reads via ref)
  useEffect(() => {
    if (!map || !isMapReady) return;
    if (!enabled) {
      entriesRef.current.forEach((entry) => entry.marker.remove());
      entriesRef.current.clear();
      selectedKeyRef.current = null;
    } else {
      // Force a refresh pass on next frame
      try {
        map.fire("moveend");
      } catch {
        /* map tearing down */
      }
    }
  }, [map, isMapReady, enabled]);
}
