// src/lib/utils/mapLinks.ts

export interface VenueData {
  googlePlaceId?: string;
  location?: {
    lat: number;
    lng: number;
  };
  address?: string;
  name?: string;
}

/**
 * Checks if the device is iOS.
 */
export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

/**
 * Returns a single directions URL based on venue data.
 * On iOS, returns an Apple Maps URL; on other devices, returns a Google Maps URL.
 */
export function getDirectionsUrl(venue: VenueData): string {
  if (!venue) return "";
  
  if (isIOS()) {
    // Apple Maps: Use location if available, else address.
    if (venue.location) {
      const { lat, lng } = venue.location;
      return `http://maps.apple.com/?daddr=${lat},${lng}`;
    } else if (venue.address) {
      return `http://maps.apple.com/?daddr=${encodeURIComponent(venue.address)}`;
    }
    return "http://maps.apple.com/";
  } else {
    // Google Maps: If googlePlaceId exists, use it with query_place_id.
    if (venue.googlePlaceId) {
      // Use the correct parameter for a Place ID lookup.
      return `https://www.google.com/maps/search/?api=1&query_place_id=${venue.googlePlaceId}`;
    } else if (venue.location) {
      const { lat, lng } = venue.location;
      return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    } else if (venue.address) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.address)}`;
    }
    return "";
  }
}
