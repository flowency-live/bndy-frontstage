// bndy Map v2 — imperative MapLibre controller.
// React never re-renders the map; it calls these methods. This is what kills the
// historical marker-thrash: one WebGL context, native clustering, GPU layers,
// and a single DOM marker only for the focused point.

import maplibregl from "maplibre-gl";
import type { FeatureCollection, Point } from "geojson";
import { BASEMAPS, DEFAULT_SKIN, getSkin } from "./skins";
import { buildGigLayers, buildVenueLayers, ALL_LAYER_IDS, GIG_LAYER_IDS, VEN_LAYER_IDS } from "./layers";
import type { MapCallbacks, MapMode, Skin, SkinId } from "./types";
import type { GigProps, VenueProps } from "./geojson";

const EMPTY: FeatureCollection<Point, never> = { type: "FeatureCollection", features: [] };
const UK_CENTER: [number, number] = [-2.1, 53.4];

interface ControllerOpts {
  container: HTMLElement;
  skin: SkinId;
  isDark: boolean;
  mode: MapMode;
  callbacks: MapCallbacks;
}

export class MapController {
  readonly map: maplibregl.Map;
  private skin: Skin;
  private isDark: boolean;
  private mode: MapMode;
  private cb: MapCallbacks;
  private ready = false;
  private pendingReadd = false;
  private hero: maplibregl.Marker | null = null;
  private raf = 0;
  private gigData: FeatureCollection<Point, GigProps> | FeatureCollection<Point, never> = EMPTY;
  private venData: FeatureCollection<Point, VenueProps> | FeatureCollection<Point, never> = EMPTY;

  constructor(opts: ControllerOpts) {
    this.skin = getSkin(opts.skin ?? DEFAULT_SKIN);
    this.isDark = opts.isDark;
    this.mode = opts.mode;
    this.cb = opts.callbacks;

    this.map = new maplibregl.Map({
      container: opts.container,
      style: this.isDark ? BASEMAPS.dark : BASEMAPS.light,
      center: UK_CENTER,
      zoom: 6.2,
      pitch: this.skin.pitch,
      minZoom: 4,
      maxZoom: 18,
      antialias: true,
      attributionControl: { compact: true },
    });

    this.map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    this.map.addControl(
      new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true, showUserHeading: true }),
      "bottom-right",
    );

    this.map.on("load", () => {
      this.ready = true;
      this.addSourcesAndLayers();
      this.applyMode();
      this.wireInteractions();
      this.startPulse();
      this.fitToActive();
    });

    // Re-add our sources/layers after a basemap (theme) swap wipes them.
    this.map.on("styledata", () => {
      if (this.pendingReadd && this.map.isStyleLoaded()) {
        this.pendingReadd = false;
        this.addSourcesAndLayers();
        this.applyMode();
      }
    });
  }

  // ---- data ----
  setData(gig: FeatureCollection<Point, GigProps>, ven: FeatureCollection<Point, VenueProps>, fit = false) {
    this.gigData = gig;
    this.venData = ven;
    if (!this.ready) return;
    (this.map.getSource("gigs") as maplibregl.GeoJSONSource | undefined)?.setData(gig as GeoJSON.GeoJSON);
    (this.map.getSource("vens") as maplibregl.GeoJSONSource | undefined)?.setData(ven as GeoJSON.GeoJSON);
    if (fit) this.fitToActive();
  }

  private addSourcesAndLayers() {
    // sources
    if (!this.map.getSource("gigs")) {
      this.map.addSource("gigs", { type: "geojson", data: this.gigData as GeoJSON.GeoJSON, cluster: true, clusterRadius: 46, clusterMaxZoom: 12, clusterProperties: { tonight: ["max", ["get", "tonight"]] } });
    }
    if (!this.map.getSource("vens")) {
      this.map.addSource("vens", { type: "geojson", data: this.venData as GeoJSON.GeoJSON, cluster: true, clusterRadius: 40, clusterMaxZoom: 11, clusterProperties: { live: ["max", ["get", "live"]] } });
    }
    // wipe any existing custom layers, then rebuild for the active skin
    ALL_LAYER_IDS.forEach((id) => { if (this.map.getLayer(id)) this.map.removeLayer(id); });
    const gigLayers = buildGigLayers(this.skin);
    const venLayers = buildVenueLayers(this.skin, this.mode === "venues");
    [...gigLayers, ...venLayers].forEach((spec) => {
      this.map.addLayer(spec as unknown as maplibregl.AddLayerObject);
    });
  }

  // ---- mode ----
  setMode(mode: MapMode) {
    this.mode = mode;
    if (!this.ready) return;
    this.applyMode();
    this.clearHero();
    this.fitToActive();
  }

  private applyMode() {
    const gigsOn = this.mode === "events";
    GIG_LAYER_IDS.forEach((id) => {
      if (!this.map.getLayer(id)) return;
      let vis = gigsOn ? "visible" : "none";
      if (id === "g-heat" && !this.skin.heat) vis = "none";
      this.map.setLayoutProperty(id, "visibility", vis);
    });
    VEN_LAYER_IDS.forEach((id) => {
      if (this.map.getLayer(id)) this.map.setLayoutProperty(id, "visibility", gigsOn ? "none" : "visible");
    });
  }

  // ---- skin ----
  setSkin(skin: SkinId) {
    this.skin = getSkin(skin);
    if (!this.ready) return;
    this.addSourcesAndLayers(); // rebuilds layers for the new skin
    this.applyMode();
    this.map.easeTo({ pitch: this.skin.pitch, duration: 600 });
  }

  // ---- theme ----
  setTheme(isDark: boolean) {
    if (isDark === this.isDark) return;
    this.isDark = isDark;
    if (!this.ready) { return; }
    this.pendingReadd = true; // styledata handler re-adds sources+layers
    this.map.setStyle(isDark ? BASEMAPS.dark : BASEMAPS.light);
    // DOM hero marker survives setStyle — no need to recreate it.
  }

  // ---- focus / hero ----
  focus(lngLat: [number, number], kind: "gig" | "live" | "idle") {
    this.setHero(lngLat, kind);
    this.map.easeTo({ center: lngLat, duration: 520, offset: [0, -130] });
  }
  focusZoom(lngLat: [number, number], kind: "gig" | "live" | "idle", zoom: number) {
    this.setHero(lngLat, kind);
    this.map.easeTo({ center: lngLat, zoom: Math.max(this.map.getZoom(), zoom), duration: 620, offset: [0, -120] });
  }
  private setHero(lngLat: [number, number], kind: string) {
    this.clearHero();
    const el = document.createElement("div");
    el.className = "bndy-hero " + kind;
    this.hero = new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat(lngLat).addTo(this.map);
  }
  clearHero() { if (this.hero) { this.hero.remove(); this.hero = null; } }

  // ---- fit ----
  private fitToActive() {
    const fc = this.mode === "events" ? this.gigData : this.venData;
    if (!fc.features.length) return;
    let minX = 180, minY = 90, maxX = -180, maxY = -90;
    for (const f of fc.features) {
      const [x, y] = (f.geometry as Point).coordinates;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
    this.map.fitBounds([[minX, minY], [maxX, maxY]], { padding: { top: 90, bottom: 120, left: 40, right: 40 }, duration: 700, maxZoom: 11 });
  }

  // ---- interactions ----
  private wireInteractions() {
    const expand = (src: "gigs" | "vens") => (e: maplibregl.MapLayerMouseEvent) => {
      const f = e.features?.[0];
      if (!f) return;
      const clusterId = (f.properties as { cluster_id?: number }).cluster_id;
      if (clusterId == null) return;
      const source = this.map.getSource(src) as maplibregl.GeoJSONSource;
      source.getClusterExpansionZoom(clusterId).then((z) => {
        this.map.easeTo({ center: (f.geometry as Point).coordinates as [number, number], zoom: Math.min(z + 0.2, 15), duration: 620 });
      }).catch(() => {});
    };
    ["g-cl-hit", "g-cl-core"].forEach((id) => this.map.on("click", id, expand("gigs")));
    ["v-cl-hit", "v-cl-core"].forEach((id) => this.map.on("click", id, expand("vens")));

    const gigClick = (e: maplibregl.MapLayerMouseEvent) => {
      const f = e.features?.[0];
      if (!f || (f.properties as { point_count?: number }).point_count) return;
      const p = f.properties as unknown as GigProps;
      this.cb.onGigClick(p.vid, (f.geometry as Point).coordinates as [number, number]);
    };
    ["g-hit", "g-core"].forEach((id) => this.map.on("click", id, gigClick));

    const venClick = (e: maplibregl.MapLayerMouseEvent) => {
      const f = e.features?.[0];
      if (!f || (f.properties as { point_count?: number }).point_count) return;
      const p = f.properties as unknown as VenueProps;
      this.cb.onVenueClick(p.id, (f.geometry as Point).coordinates as [number, number]);
    };
    ["v-hit", "v-core"].forEach((id) => this.map.on("click", id, venClick));

    ["g-cl-hit", "g-cl-core", "g-hit", "g-core", "v-cl-hit", "v-cl-core", "v-hit", "v-core"].forEach((id) => {
      this.map.on("mouseenter", id, () => { this.map.getCanvas().style.cursor = "pointer"; });
      this.map.on("mouseleave", id, () => { this.map.getCanvas().style.cursor = ""; });
    });
  }

  // ---- pulse (tonight gigs) ----
  private startPulse() {
    const frame = (t: number) => {
      if (this.map.getLayer("g-ping") && (this.map.getLayoutProperty("g-ping", "visibility") ?? "visible") !== "none") {
        const p = (t % 1600) / 1600;
        this.map.setPaintProperty("g-ping", "circle-radius", 10 + p * 22);
        this.map.setPaintProperty("g-ping", "circle-stroke-opacity", 0.85 * (1 - p));
      }
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  }

  destroy() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.clearHero();
    this.map.remove();
  }
}
