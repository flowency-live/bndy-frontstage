// src/lib/services/artist-cache-service.ts
// Client-side artist cache with smart invalidation

import type { Artist } from '@/lib/types';

const CACHE_KEY = 'bndy_artist_cache';
const CACHE_TIMESTAMP_KEY = 'bndy_artist_cache_timestamp';
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

interface CachedArtists {
  artists: Artist[];
  timestamp: number;
}

/**
 * Get all artists from cache or fetch from API
 * Uses 5-minute cache with localStorage for cross-tab sync
 */
export async function getCachedArtists(): Promise<Artist[]> {
  // Check if cache is valid
  const cachedData = getFromCache();
  if (cachedData) {
    console.log('[ArtistCache] Using cached artists:', cachedData.artists.length);
    return cachedData.artists;
  }

  // Cache miss or expired - fetch from API
  console.log('[ArtistCache] Cache miss, fetching from API...');
  const artists = await fetchAllArtistsFromAPI();

  // Store in cache
  setCache(artists);

  return artists;
}

/**
 * Add a newly created artist to the cache immediately
 * Call this after creating an artist to avoid cache miss
 */
export function addArtistToCache(artist: Artist): void {
  const cachedData = getFromCache();

  if (cachedData) {
    // Add to existing cache
    const updatedArtists = [artist, ...cachedData.artists];
    setCache(updatedArtists);
    console.log('[ArtistCache] Added new artist to cache:', artist.name);
  } else {
    // No cache exists - just cache this one artist for now
    setCache([artist]);
  }
}

/**
 * Remove an artist from the cache
 * Call this after deleting an artist
 */
export function removeArtistFromCache(artistId: string): void {
  const cachedData = getFromCache();

  if (cachedData) {
    const updatedArtists = cachedData.artists.filter(a => a.id !== artistId);
    setCache(updatedArtists);
    console.log('[ArtistCache] Removed artist from cache:', artistId);
  }
}

/**
 * Update an artist in the cache
 * Call this after updating an artist
 */
export function updateArtistInCache(artist: Artist): void {
  const cachedData = getFromCache();

  if (cachedData) {
    const updatedArtists = cachedData.artists.map(a =>
      a.id === artist.id ? artist : a
    );
    setCache(updatedArtists);
    console.log('[ArtistCache] Updated artist in cache:', artist.name);
  }
}

/**
 * Force clear the cache
 * Call this when you need fresh data immediately
 */
export function clearArtistCache(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    console.log('[ArtistCache] Cache cleared');
  }
}

/**
 * Search cached artists by name with fuzzy matching
 */
export function searchCachedArtists(
  artists: Artist[],
  searchTerm: string,
  venueCity?: string
): Artist[] {
  if (!searchTerm || searchTerm.length < 2) {
    return [];
  }

  const query = searchTerm.toLowerCase().trim();

  // Calculate match scores
  const matches = artists
    .map(artist => {
      const name = artist.name.toLowerCase();
      const location = artist.location?.toLowerCase() || '';

      // Exact match = highest score
      if (name === query) return { artist, score: 100 };

      // Starts with = high score
      if (name.startsWith(query)) return { artist, score: 80 };

      // Contains = medium score
      if (name.includes(query)) return { artist, score: 60 };

      // Fuzzy match (each word starts with query)
      const words = name.split(' ');
      if (words.some(w => w.startsWith(query))) return { artist, score: 40 };

      return null;
    })
    .filter((match): match is { artist: Artist; score: number } => match !== null);

  // Apply location boost if venue city is provided
  if (venueCity) {
    const venueCityLower = venueCity.toLowerCase().trim();
    matches.forEach(match => {
      const artistLocation = match.artist.location?.toLowerCase() || '';
      if (artistLocation.includes(venueCityLower) || venueCityLower.includes(artistLocation)) {
        match.score += 20; // Boost local artists
      }
    });
  }

  // Sort by score and return top 10
  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(m => m.artist);
}

// ============================================================================
// Internal helper functions
// ============================================================================

function getFromCache(): CachedArtists | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

    if (!cached || !timestamp) return null;

    const age = Date.now() - parseInt(timestamp);

    // Cache expired
    if (age > CACHE_DURATION_MS) {
      console.log('[ArtistCache] Cache expired (age:', Math.round(age / 1000), 'seconds)');
      clearArtistCache();
      return null;
    }

    return {
      artists: JSON.parse(cached),
      timestamp: parseInt(timestamp)
    };
  } catch (error) {
    console.error('[ArtistCache] Error reading cache:', error);
    clearArtistCache();
    return null;
  }
}

function setCache(artists: Artist[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(artists));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('[ArtistCache] Error setting cache:', error);
  }
}

async function fetchAllArtistsFromAPI(): Promise<Artist[]> {
  const response = await fetch('https://api.bndy.co.uk/api/artists', {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch artists: ${response.status}`);
  }

  const data = await response.json();
  return data.artists || [];
}
