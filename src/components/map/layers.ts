// bndy Map v2 — layer specs (GPU circle/heat/cluster). Validated against
// @maplibre/maplibre-gl-style-spec (0 errors). Parametrised by skin.
//
// Typed loosely on purpose: MapLibre's expression unions are stricter than the
// runtime spec, so we keep plain objects and cast to AddLayerObject at the call site.

import type { Skin } from "./types";

export type LayerSpec = Record<string, unknown>;

const GIG_SRC = "gigs";
const VEN_SRC = "vens";

const isCl = ["has", "point_count"];
const notCl = ["!", ["has", "point_count"]];

export const GIG_LAYER_IDS = [
  "g-heat", "g-cl-hit", "g-cl-bloom", "g-cl-core", "g-cl-count",
  "g-hit", "g-ping", "g-bloom", "g-core", "g-lbl",
];
export const VEN_LAYER_IDS = [
  "v-cl-hit", "v-cl-bloom", "v-cl-core", "v-cl-count",
  "v-hit", "v-bloom", "v-core", "v-lbl",
];
export const ALL_LAYER_IDS = [...GIG_LAYER_IDS, ...VEN_LAYER_IDS];

export function buildGigLayers(skin: Skin): LayerSpec[] {
  const c = skin.colors;
  const layers: LayerSpec[] = [];

  // density heat (low zoom) — only for skins that opt in
  layers.push({
    id: "g-heat", type: "heatmap", source: GIG_SRC, maxzoom: 9.5,
    layout: { visibility: skin.heat ? "visible" : "none" },
    paint: {
      "heatmap-weight": 1,
      "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 4, 0.7, 9, 1.6],
      "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 4, 14, 9, 34],
      "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 7, 0.75, 9.5, 0],
      "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"],
        0, "rgba(0,0,0,0)", 0.2, "rgba(255,122,26,.25)", 0.45, "rgba(255,122,26,.55)",
        0.7, "rgba(255,60,140,.7)", 1, "rgba(255,226,196,.95)"],
    },
  });

  // clusters
  layers.push({ id: "g-cl-hit", type: "circle", source: GIG_SRC, filter: isCl, paint: { "circle-radius": 26, "circle-opacity": 0 } });
  layers.push({
    id: "g-cl-bloom", type: "circle", source: GIG_SRC, filter: isCl,
    paint: {
      "circle-color": c.clRing, "circle-blur": 1.0, "circle-opacity": 0.42,
      "circle-radius": ["interpolate", ["linear"], ["get", "point_count"], 2, 20, 20, 30, 120, 46],
    },
  });
  layers.push({
    id: "g-cl-core", type: "circle", source: GIG_SRC, filter: isCl,
    paint: {
      "circle-color": c.clFill, "circle-stroke-width": 2,
      "circle-stroke-color": ["case", ["==", ["get", "tonight"], 1], "#ffffff", c.clRing],
      "circle-radius": ["interpolate", ["linear"], ["get", "point_count"], 2, 15, 20, 22, 120, 34],
    },
  });
  layers.push({
    id: "g-cl-count", type: "symbol", source: GIG_SRC, filter: isCl,
    layout: {
      "text-field": ["get", "point_count_abbreviated"], "text-font": ["Open Sans Bold"],
      "text-size": ["interpolate", ["linear"], ["get", "point_count"], 2, 12, 120, 17], "text-allow-overlap": true,
    },
    paint: { "text-color": "#fff", "text-halo-color": c.clRing, "text-halo-width": 0.6 },
  });

  // singles
  layers.push({ id: "g-hit", type: "circle", source: GIG_SRC, filter: notCl, paint: { "circle-radius": 18, "circle-opacity": 0 } });
  layers.push({
    id: "g-ping", type: "circle", source: GIG_SRC, filter: ["all", notCl, ["==", ["get", "tonight"], 1]],
    paint: {
      "circle-color": "rgba(0,0,0,0)", "circle-stroke-color": c.gigGlow, "circle-stroke-width": 2,
      "circle-radius": 10, "circle-stroke-opacity": 0.85, "circle-pitch-alignment": "map",
    },
  });
  layers.push({
    id: "g-bloom", type: "circle", source: GIG_SRC, filter: notCl,
    paint: {
      "circle-color": c.gigGlow, "circle-blur": 1.0,
      "circle-opacity": ["interpolate", ["linear"], ["zoom"], 8, skin.markerStyle === "dot" ? 0.45 : 0.35, 13, 0.6],
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 7, 13, 15, 16, 20],
    },
  });
  if (skin.markerStyle === "ring") {
    layers.push({
      id: "g-core", type: "circle", source: GIG_SRC, filter: notCl,
      paint: {
        "circle-color": "rgba(10,8,14,.55)", "circle-stroke-color": c.gigCore, "circle-stroke-width": 2.4,
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 4.5, 13, 7.5, 16, 10], "circle-pitch-alignment": "map",
      },
    });
  } else {
    layers.push({
      id: "g-core", type: "circle", source: GIG_SRC, filter: notCl,
      paint: {
        "circle-color": c.gigCore, "circle-stroke-color": c.gigGlow, "circle-stroke-width": skin.markerStyle === "dot" ? 2 : 1.6,
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, skin.markerStyle === "dot" ? 4.2 : 3.6, 13, 6, 16, 8],
      },
    });
  }
  layers.push({
    id: "g-lbl", type: "symbol", source: GIG_SRC, filter: notCl, minzoom: 11.5,
    layout: {
      "text-field": ["get", "venue"], "text-font": ["Open Sans Semibold"], "text-size": 11.5,
      "text-offset": [0, 1.25], "text-anchor": "top", "text-max-width": 11, "text-optional": true, "text-allow-overlap": false,
    },
    paint: { "text-color": "#f3f6fc", "text-halo-color": "rgba(5,6,11,.95)", "text-halo-width": 1.4 },
  });

  return layers;
}

export function buildVenueLayers(skin: Skin, visible: boolean): LayerSpec[] {
  const c = skin.colors;
  const vis = visible ? "visible" : "none";
  const liveColor = ["case", ["==", ["get", "live"], 1], c.venLive, c.venIdle];
  const liveCore = ["case", ["==", ["get", "live"], 1], c.venLiveCore, c.venIdleCore];
  const layers: LayerSpec[] = [];

  layers.push({ id: "v-cl-hit", type: "circle", source: VEN_SRC, filter: isCl, layout: { visibility: vis }, paint: { "circle-radius": 24, "circle-opacity": 0 } });
  layers.push({
    id: "v-cl-bloom", type: "circle", source: VEN_SRC, filter: isCl, layout: { visibility: vis },
    paint: { "circle-color": liveColor, "circle-blur": 1.0, "circle-opacity": 0.34, "circle-radius": ["interpolate", ["linear"], ["get", "point_count"], 2, 18, 50, 30, 300, 44] },
  });
  layers.push({
    id: "v-cl-core", type: "circle", source: VEN_SRC, filter: isCl, layout: { visibility: vis },
    paint: { "circle-color": c.clFill, "circle-stroke-width": 2, "circle-stroke-color": liveColor, "circle-radius": ["interpolate", ["linear"], ["get", "point_count"], 2, 14, 50, 22, 300, 32] },
  });
  layers.push({
    id: "v-cl-count", type: "symbol", source: VEN_SRC, filter: isCl,
    layout: { visibility: vis, "text-field": ["get", "point_count_abbreviated"], "text-font": ["Open Sans Bold"], "text-size": ["interpolate", ["linear"], ["get", "point_count"], 2, 11, 300, 16], "text-allow-overlap": true },
    paint: { "text-color": "#fff", "text-halo-color": liveColor, "text-halo-width": 0.5 },
  });

  layers.push({ id: "v-hit", type: "circle", source: VEN_SRC, filter: notCl, layout: { visibility: vis }, paint: { "circle-radius": 16, "circle-opacity": 0 } });
  layers.push({
    id: "v-bloom", type: "circle", source: VEN_SRC, filter: notCl, layout: { visibility: vis },
    paint: {
      "circle-color": liveColor, "circle-blur": 1.0,
      "circle-opacity": ["case", ["==", ["get", "live"], 1], 0.6, 0.32],
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, ["case", ["==", ["get", "live"], 1], 7, 5], 13, ["case", ["==", ["get", "live"], 1], 15, 10]],
    },
  });
  if (skin.markerStyle === "ring") {
    layers.push({
      id: "v-core", type: "circle", source: VEN_SRC, filter: notCl, layout: { visibility: vis },
      paint: {
        "circle-color": "rgba(10,8,14,.5)", "circle-stroke-color": liveCore,
        "circle-stroke-width": ["case", ["==", ["get", "live"], 1], 2.6, 1.8],
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, ["case", ["==", ["get", "live"], 1], 5.5, 4], 13, 9], "circle-pitch-alignment": "map",
      },
    });
  } else {
    layers.push({
      id: "v-core", type: "circle", source: VEN_SRC, filter: notCl, layout: { visibility: vis },
      paint: {
        "circle-color": liveCore, "circle-stroke-color": liveColor, "circle-stroke-width": 1.4,
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, ["case", ["==", ["get", "live"], 1], 4.5, 3], 13, ["case", ["==", ["get", "live"], 1], 7, 5.5]],
      },
    });
  }
  layers.push({
    id: "v-lbl", type: "symbol", source: VEN_SRC, filter: notCl, minzoom: 12.5,
    layout: { visibility: vis, "text-field": ["get", "name"], "text-font": ["Open Sans Semibold"], "text-size": 11, "text-offset": [0, 1.2], "text-anchor": "top", "text-max-width": 12, "text-optional": true },
    paint: { "text-color": "#e8ecf5", "text-halo-color": "rgba(5,6,11,.95)", "text-halo-width": 1.3 },
  });

  return layers;
}
