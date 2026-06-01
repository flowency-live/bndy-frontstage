import mapboxgl from "mapbox-gl";

/**
 * Mapbox Marker Utilities
 *
 * Unlike Leaflet's DivIcon (HTML strings), Mapbox requires images.
 * We render SVGs to canvas and add them as map images.
 */

// Track which images have been added to avoid duplicates
const addedImages = new Set<string>();

/**
 * Renders an SVG string to a canvas ImageData
 */
function svgToImageData(
  svgString: string,
  width: number,
  height: number
): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    // Use device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const img = new Image();
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load SVG"));
    };

    img.src = url;
  });
}

/**
 * Venue marker SVG - small pink dot (14x14)
 */
function createVenueMarkerSVG(): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14">
      <defs>
        <filter id="venue-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="0" stdDeviation="1" flood-color="#FF1493" flood-opacity="0.4"/>
        </filter>
      </defs>
      <circle cx="7" cy="7" r="6" fill="none" stroke="#FFFFFF" stroke-width="1.5" filter="url(#venue-glow)"/>
      <circle cx="7" cy="7" r="4.5" fill="#FF1493" opacity="0.9"/>
      <circle cx="5.5" cy="5.5" r="1.2" fill="#FFFFFF" opacity="0.6"/>
    </svg>
  `;
}

/**
 * Event marker SVG - orange teardrop pin (22x29)
 */
function createEventMarkerSVG(count?: number): string {
  const showCount = count !== undefined && count > 1;
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="29" viewBox="0 0 24 36">
      <path d="M12,0 C5.3,0 0,5.3 0,12 C0,20 12,36 12,36 C12,36 24,20 24,12 C24,5.3 18.6,0 12,0 Z"
        fill="#F97316"
        stroke="#FFFFFF"
        stroke-width="1.5" />
      ${showCount ? `
        <text x="12" y="15" font-family="Arial, sans-serif" font-size="11" font-weight="bold"
          text-anchor="middle" dominant-baseline="middle" fill="#FFFFFF">${count}</text>
      ` : `
        <circle cx="12" cy="12" r="3.5" fill="#06B6D4" />
      `}
    </svg>
  `;
}

/**
 * Cluster marker SVG - pill shape with count
 */
function createClusterMarkerSVG(
  count: number,
  type: "venue" | "event"
): string {
  const isVenue = type === "venue";
  const baseColor = isVenue ? "#FF1493" : "#F97316";
  const width = count < 10 ? 24 : count < 100 ? 30 : 36;
  const height = 22;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="cluster-grad-${type}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${baseColor};stop-opacity:0.95" />
          <stop offset="100%" style="stop-color:${baseColor};stop-opacity:0.85" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="${(height - 2) / 2}"
        fill="url(#cluster-grad-${type})"
        stroke="#FFFFFF"
        stroke-width="1.5" />
      <text x="${width / 2}" y="${height / 2 + 1}"
        font-family="Arial, sans-serif"
        font-size="11"
        font-weight="600"
        text-anchor="middle"
        dominant-baseline="middle"
        fill="#FFFFFF">${count}</text>
    </svg>
  `;
}

/**
 * User location marker SVG - blue pulsing dot
 */
function createUserLocationSVG(): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="8" fill="#4285F4" opacity="0.2"/>
      <circle cx="10" cy="10" r="6" fill="#4285F4" stroke="#FFFFFF" stroke-width="2"/>
    </svg>
  `;
}

/**
 * Pill background SVG for venue labels (stretchable via icon-text-fit)
 * Dark fill with cyan border for "active" venues
 */
function createPillBackgroundSVG(): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="26" viewBox="0 0 40 26">
      <rect x="1.5" y="1.5" width="37" height="23" rx="11.5"
        fill="rgba(18, 22, 30, 0.95)"
        stroke="#06B6D4"
        stroke-width="2.5" />
    </svg>
  `;
}

/**
 * Add all marker images to a Mapbox map
 * Call this after map loads
 *
 * OPTIMIZED: Only generates images actually used by layers.
 * Cluster layers use circle paint, not images.
 */
export async function addMarkerImagesToMap(map: mapboxgl.Map): Promise<void> {
  const containerId = map?.getContainer()?.id || "default";
  if (!map || addedImages.has(containerId)) return;

  // Mark as added immediately to prevent concurrent calls
  addedImages.add(containerId);

  try {
    const dpr = window.devicePixelRatio || 1;

    // Generate all images in parallel for faster loading
    const [venueData, eventData, userLocData, pillData] = await Promise.all([
      svgToImageData(createVenueMarkerSVG(), 14, 14),
      svgToImageData(createEventMarkerSVG(), 22, 29),
      svgToImageData(createUserLocationSVG(), 20, 20),
      svgToImageData(createPillBackgroundSVG(), 40, 26),
    ]);

    // Add images to map (only if not already present)
    if (!map.hasImage("venue-marker")) {
      map.addImage("venue-marker", venueData, { pixelRatio: dpr });
    }
    if (!map.hasImage("event-marker")) {
      map.addImage("event-marker", eventData, { pixelRatio: dpr });
    }
    if (!map.hasImage("user-location")) {
      map.addImage("user-location", userLocData, { pixelRatio: dpr });
    }
    if (!map.hasImage("venue-pill-bg")) {
      // Stretchable pill - content area excludes stroke/corner padding
      map.addImage("venue-pill-bg", pillData, {
        pixelRatio: dpr,
        // 9-slice stretching: keep corners fixed, stretch middle
        stretchX: [[14, 26]],  // Stretchable horizontal zone (middle section)
        stretchY: [[6, 20]],   // Stretchable vertical zone
        content: [6, 4, 34, 22],  // Content area where text fits
      });
    }

    console.log("[MapboxMarkers] Marker images added (optimized)");
  } catch (error) {
    console.error("[MapboxMarkers] Failed to add marker images:", error);
    // Remove from set so it can be retried
    addedImages.delete(containerId);
  }
}

/**
 * Get the appropriate cluster image name for a count
 */
export function getClusterImageName(count: number, type: "venue" | "event"): string {
  // Find the closest pre-generated count
  const pregenerated = [2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 40, 50, 75, 100];
  let closest = pregenerated[0];
  for (const n of pregenerated) {
    if (n <= count) closest = n;
    else break;
  }
  return `${type}-cluster-${closest}`;
}

/**
 * Convert venues to GeoJSON for Mapbox source
 * @param venues Array of venue objects
 * @param venueIdsWithEvents Optional Set of venue IDs that have upcoming events
 */
export function venuesToGeoJSON(
  venues: Array<{ id: string; name: string; location: { lat: number; lng: number } }>,
  venueIdsWithEvents?: Set<string>
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: venues
      .filter((v) => v.location?.lat && v.location?.lng)
      .map((venue) => ({
        type: "Feature" as const,
        properties: {
          id: venue.id,
          name: venue.name,
          hasEvents: venueIdsWithEvents?.has(venue.id) ?? false,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [venue.location.lng, venue.location.lat],
        },
      })),
  };
}

/**
 * Convert events to GeoJSON for Mapbox source
 *
 * IMPORTANT: locationKey is stored in properties to enable reliable lookup.
 * Using coordinates directly is unreliable due to floating point precision.
 */
export function eventsToGeoJSON(events: Array<{ id: string; name: string; location: { lat: number; lng: number }; date: string; venueName: string }>): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: events
      .filter((e) => e.location?.lat && e.location?.lng)
      .map((event) => ({
        type: "Feature" as const,
        properties: {
          id: event.id,
          name: event.name,
          date: event.date,
          venueName: event.venueName,
          // Store the location key for reliable lookup (coordinates can lose precision)
          locationKey: `${event.location.lat},${event.location.lng}`,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [event.location.lng, event.location.lat],
        },
      })),
  };
}
