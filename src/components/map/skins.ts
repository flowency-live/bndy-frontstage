// bndy Map v2 — skin registry
// Each skin is a self-contained visual language the user can pick.
// Colours follow the locked brand semantics:
//   gigs = orange · venue with upcoming gigs = PINK · idle venue = CYAN

import type { Skin, SkinId } from "./types";

// CARTO vector basemaps — no access token required.
export const BASEMAPS = {
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json",
  light: "https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json",
} as const;

const ORANGE = "#ff7a1a";
const ORANGE_HOT = "#ffe2c4";
const PINK = "#ff2e88";
const PINK_HOT = "#ffd0e4";
const CYAN = "#19d3f5";
const CYAN_HOT = "#cdf4ff";
const VIOLET = "#8b5bff";

export const SKINS: Record<SkinId, Skin> = {
  // GPU glow + density heat. Energetic, dense-friendly. (prototype "Pulse")
  pulse: {
    id: "pulse",
    label: "Pulse",
    description: "Neon glow with a density heatmap",
    markerStyle: "glow",
    heat: true,
    pitch: 0,
    colors: {
      gigGlow: ORANGE, gigCore: ORANGE_HOT,
      venLive: PINK, venIdle: CYAN,
      venLiveCore: PINK_HOT, venIdleCore: CYAN_HOT,
      clRing: ORANGE, clFill: "rgba(8,10,18,.85)",
    },
  },
  // 3D-tilted, crisp ring/halo markers, cooler mood. (prototype "Aurora")
  aurora: {
    id: "aurora",
    label: "Aurora",
    description: "3D-tilted with crisp halo rings",
    markerStyle: "ring",
    heat: false,
    pitch: 48,
    colors: {
      gigGlow: ORANGE, gigCore: "#fff0da",
      venLive: PINK, venIdle: CYAN,
      venLiveCore: PINK_HOT, venIdleCore: CYAN_HOT,
      clRing: VIOLET, clFill: "rgba(10,10,26,.7)",
    },
  },
  // The classic bndy neon-dot look: flat, bright solid dots, strong bloom, no heat.
  "neon-dot": {
    id: "neon-dot",
    label: "Neon Dot",
    description: "The classic bright neon dots",
    markerStyle: "dot",
    heat: false,
    pitch: 0,
    colors: {
      gigGlow: ORANGE, gigCore: ORANGE_HOT,
      venLive: PINK, venIdle: CYAN,
      venLiveCore: PINK_HOT, venIdleCore: CYAN_HOT,
      clRing: ORANGE, clFill: "rgba(10,14,24,.9)",
    },
  },
};

export const SKIN_ORDER: SkinId[] = ["pulse", "aurora", "neon-dot"];
export const DEFAULT_SKIN: SkinId = "pulse";

export function getSkin(id: SkinId | string | undefined): Skin {
  return SKINS[(id as SkinId)] ?? SKINS[DEFAULT_SKIN];
}
