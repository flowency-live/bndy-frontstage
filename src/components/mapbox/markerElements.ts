/**
 * markerElements - DOM element factory for the bndy neon marker system
 *
 * Visual source of truth: Projects/bndy/design-kit/marker-kit.html
 * Styles: src/styles/markers.css (imported in app/layout.tsx)
 *
 * Elements are used with `new mapboxgl.Marker({ element, anchor: "center" })`.
 * Light theme is automatic: MapboxContext toggles `.theme-light` on the map
 * container and the CSS handles the rest.
 */

export type ClusterKind = "gig" | "venue-live" | "venue-idle";

export interface GigMarkerOpts {
  type: "gig";
  /** Event date === today → sonar ping */
  isTonight?: boolean;
  label?: string;
  sub?: string;
}

export interface VenueMarkerOpts {
  type: "venue";
  /** PINK full-bloom when true, dim cyan when false (intentional flip vs old layer colors) */
  hasGigs: boolean;
  label?: string;
  sub?: string;
  /** Show the name pill permanently (zoom-gated by the layer) */
  labeled?: boolean;
}

export interface ClusterMarkerOpts {
  type: "cluster";
  count: number;
  kind: ClusterKind;
}

export interface UserMarkerOpts {
  type: "user";
}

export type MarkerOpts = GigMarkerOpts | VenueMarkerOpts | ClusterMarkerOpts | UserMarkerOpts;

/** Kit size tiers: sm 2–4 (32px) · md 5–9 (40px) · lg 10+ (48px) */
export function clusterTier(count: number): "sm" | "md" | "lg" {
  return count >= 10 ? "lg" : count >= 5 ? "md" : "sm";
}

function cx(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function escapeHtml(s: string = ""): string {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function labelHtml(label?: string, sub?: string): string {
  if (!label) return "";
  return `<span class="bndy-mk-label">${escapeHtml(label)}${
    sub ? `<span class="sub">${escapeHtml(sub)}</span>` : ""
  }</span>`;
}

/** Random delay so breathing dots shimmer instead of pulsing in sync */
function staggerBreathe(el: HTMLElement): void {
  el.style.animationDelay = `${(Math.random() * 2.8).toFixed(2)}s`;
}

/**
 * Stable identity string for an opts object — used by the diffing hook to
 * decide whether an existing marker's element needs rebuilding.
 */
export function markerOptsKey(opts: MarkerOpts): string {
  switch (opts.type) {
    case "gig":
      return `gig|${opts.isTonight ? 1 : 0}|${opts.label ?? ""}|${opts.sub ?? ""}`;
    case "venue":
      return `venue|${opts.hasGigs ? 1 : 0}|${opts.labeled ? 1 : 0}|${opts.label ?? ""}|${opts.sub ?? ""}`;
    case "cluster":
      return `cluster|${opts.kind}|${opts.count}`;
    case "user":
      return "user";
  }
}

/**
 * Returns the inner visual element (.bndy-mk) of a marker root.
 * Class toggles (is-selected etc.) belong on the visual, never the root —
 * Mapbox owns the root's transform.
 */
export function getMarkerVisual(root: HTMLElement): HTMLElement | null {
  return root.querySelector<HTMLElement>(".bndy-mk");
}

export function createMarkerElement(opts: MarkerOpts): HTMLDivElement {
  // ROOT: positioned by Mapbox via inline transform — must stay style-inert
  // (see .bndy-mk-anchor in markers.css). Visual effects go on the inner el.
  const root = document.createElement("div");
  root.className = "bndy-mk-anchor";
  const el = document.createElement("div");
  root.appendChild(el);

  switch (opts.type) {
    case "gig":
      el.className = cx(
        "bndy-mk bndy-mk--dot bndy-mk--gig",
        opts.isTonight && "bndy-mk--tonight",
      );
      staggerBreathe(el);
      el.innerHTML = labelHtml(opts.label, opts.sub);
      el.setAttribute("role", "button");
      el.setAttribute("aria-label", opts.label ? `Gig: ${opts.label}` : "Gig");
      break;

    case "venue":
      el.className = cx(
        "bndy-mk bndy-mk--dot",
        opts.hasGigs ? "bndy-mk--venue-live" : "bndy-mk--venue-idle",
        opts.labeled && "is-labeled",
      );
      if (opts.hasGigs) staggerBreathe(el);
      el.innerHTML = labelHtml(opts.label, opts.sub);
      el.setAttribute("role", "button");
      el.setAttribute("aria-label", opts.label ? `Venue: ${opts.label}` : "Venue");
      break;

    case "cluster":
      el.className = cx(
        "bndy-mk bndy-mk--cluster",
        `bndy-mk--${opts.kind}`,
        `bndy-mk--${clusterTier(opts.count)}`,
      );
      el.textContent = String(opts.count);
      el.setAttribute("role", "button");
      el.setAttribute(
        "aria-label",
        `${opts.count} ${opts.kind === "gig" ? "gigs" : "venues"} — zoom in`,
      );
      break;

    case "user":
      el.className = "bndy-mk bndy-mk--user";
      el.setAttribute("aria-label", "Your location");
      break;
  }

  return root;
}
