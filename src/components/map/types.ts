// bndy Map v2 — shared types
// Fresh MapLibre map module. Isolated behind src/components/map/index.ts.

export type SkinId = "pulse" | "aurora" | "neon-dot";
export type ThemeMode = "light" | "dark";
export type MapMode = "events" | "venues";

export interface SkinColors {
  gigGlow: string;
  gigCore: string;
  venLive: string;
  venIdle: string;
  venLiveCore: string;
  venIdleCore: string;
  clRing: string;
  clFill: string;
}

export interface Skin {
  id: SkinId;
  label: string;
  description: string;
  /** dot = flat bright dots (the classic neon-dot look) · glow = soft bloom + heat · ring = crisp halo rings */
  markerStyle: "dot" | "glow" | "ring";
  heat: boolean;
  pitch: number;
  colors: SkinColors;
}

/** The map emits domain-light events; BndyMap resolves ids back to real Event/Venue objects. */
export interface MapCallbacks {
  onGigClick: (venueId: string, lngLat: [number, number]) => void;
  onVenueClick: (venueId: string, lngLat: [number, number]) => void;
}
