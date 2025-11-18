// src/lib/utils/venue-search.ts
// Venue search utilities for dual-source search (<200 LOC)

import type { Venue } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.bndy.co.uk';

interface GoogleVenue {
  placeId: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
}

interface SearchResult {
  bndyVenues: Venue[];
  googleVenues: GoogleVenue[];
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate name similarity using Levenshtein distance
 * Returns similarity percentage (0-100)
 */
export function calculateNameSimilarity(name1: string, name2: string): number {
  // Normalize: lowercase, trim, normalize punctuation
  const normalize = (str: string) =>
    str
      .toLowerCase()
      .trim()
      .replace(/&/g, 'and')
      .replace(/[^\w\s]/g, '');

  const s1 = normalize(name1);
  const s2 = normalize(name2);

  if (s1 === s2) return 100;

  const matrix: number[][] = [];

  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  const maxLength = Math.max(s1.length, s2.length);
  const distance = matrix[s2.length][s1.length];
  const similarity = ((maxLength - distance) / maxLength) * 100;

  return Math.round(similarity);
}

/**
 * Filter duplicate venues using three-tier detection
 * Tier 1: Google Place ID match
 * Tier 2: Coordinates within 50m
 * Tier 3: Name similarity >85%
 */
export function filterDuplicates(
  bndyVenues: Venue[],
  googleVenues: GoogleVenue[]
): SearchResult {
  const filteredGoogleVenues: GoogleVenue[] = [];

  for (const googleVenue of googleVenues) {
    let isDuplicate = false;

    for (const bndyVenue of bndyVenues) {
      // Tier 1: Google Place ID match
      if (bndyVenue.googlePlaceId && bndyVenue.googlePlaceId === googleVenue.placeId) {
        isDuplicate = true;
        break;
      }

      // Tier 2: Coordinates within 50m
      if (bndyVenue.location && googleVenue.location) {
        const distance = calculateDistance(bndyVenue.location, googleVenue.location);
        if (distance < 50) {
          isDuplicate = true;
          break;
        }
      }

      // Tier 3: Name similarity >85%
      const similarity = calculateNameSimilarity(bndyVenue.name, googleVenue.name);
      if (similarity > 85) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      filteredGoogleVenues.push(googleVenue);
    }
  }

  return {
    bndyVenues,
    googleVenues: filteredGoogleVenues,
  };
}

/**
 * Search venues from both BNDY database and Google Places
 * Returns filtered results with duplicates removed
 */
export async function searchVenues(
  query: string,
  mapCenter: { lat: number; lng: number }
): Promise<SearchResult> {
  // Search BNDY venues with nameVariants
  const response = await fetch(`${API_BASE_URL}/api/venues/search`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      includeNameVariants: true,
      types: ['bar', 'night_club', 'music_venue'],
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  // TODO: Integrate Google Places API when component is ready
  // For now, return only BNDY results
  return filterDuplicates(data.venues || [], []);
}
