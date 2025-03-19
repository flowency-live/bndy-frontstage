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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

/**
 * Returns a single directions URL based on venue data.
 * On iOS, returns an Apple Maps URL; on other devices, returns a Google Maps URL.
 */
export function getDirectionsUrl(venue: VenueData): string {
  if (!venue) return "";
  
  if (isIOS()) {
    // Apple Maps: include the venue name for display.
    if (venue.location) {
      const { lat, lng } = venue.location;
      return `http://maps.apple.com/?q=${encodeURIComponent(venue.name || '')}&daddr=${lat},${lng}`;
    } else if (venue.address) {
      return `http://maps.apple.com/?q=${encodeURIComponent(venue.name || '')}&daddr=${encodeURIComponent(venue.address || '')}`;
    }
    return "http://maps.apple.com/";
  } else {
    // For Android (Google Maps): use the venue name similar to EventRow.
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.name || '')}`;
  }
}


