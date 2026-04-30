// src/lib/utils/artist-display.ts

/**
 * Format an array of artist names for display.
 * - 0 artists: "" (empty string)
 * - 1 artist: "Artist Name"
 * - 2 artists: "Artist1 & Artist2"
 * - 3+ artists: "Artist1 + N more"
 */
export function formatArtistDisplayFromNames(artistNames: string[] | undefined | null): string {
  if (!artistNames || artistNames.length === 0) {
    return "";
  }

  if (artistNames.length === 1) {
    return artistNames[0];
  }

  if (artistNames.length === 2) {
    return `${artistNames[0]} & ${artistNames[1]}`;
  }

  return `${artistNames[0]} + ${artistNames.length - 1} more`;
}

/**
 * Format artist display from an event object.
 * Prefers artistNames array, falls back to artistName string, then "Live Music".
 */
export function formatArtistDisplay(event: {
  artistNames?: string[];
  artistName?: string;
}): string {
  // If we have an artistNames array with content, use it
  if (event.artistNames && event.artistNames.length > 0) {
    return formatArtistDisplayFromNames(event.artistNames);
  }

  // Fall back to single artistName
  if (event.artistName) {
    return event.artistName;
  }

  // Default fallback
  return "Live Music";
}
