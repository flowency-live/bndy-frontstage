// src/lib/services/artist-service-new.ts
// New service layer for artist data following serverless architecture
// All API calls use /api/* endpoints with credentials: 'include'
// No direct fetch in components - all data access through service layer

import { Artist, Event } from "@/lib/types";
import { 
  logApiRequest, 
  logApiResponse, 
  logApiError, 
  analyzeArtistData, 
  analyzeEventData,
  logPerformanceMetric 
} from "@/lib/utils/artist-debug-logger";

/**
 * Service layer function to get artist by ID
 * Uses /api/artists/[artistId] endpoint with credentials
 * Validates artist data structure includes artist_type field
 */
export async function getArtistById(artistId: string): Promise<Artist | null> {
  if (!artistId) {

    return null;
  }

  const startTime = Date.now();
  const endpoint = `/api/artists/${artistId}`;

  try {
    logApiRequest(endpoint, { artistId });
    
    const response = await fetch(endpoint, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    logApiResponse(endpoint, response.status);

    if (!response.ok) {
      if (response.status === 404) {
        logPerformanceMetric('getArtistById', Date.now() - startTime, { artistId, result: 'not_found' });
        return null;
      }
      throw new Error(`Failed to fetch artist: ${response.status} ${response.statusText}`);
    }

    const artist = await response.json() as Artist;

    // Comprehensive data analysis (non-blocking - log warnings only)
    const analysis = analyzeArtistData(artist);
    if (!analysis.isValid) {
      // Log validation issues but don't block - backend data is authoritative

    }

    logPerformanceMetric('getArtistById', Date.now() - startTime, { artistId, result: 'success' });
    return artist;
  } catch (error) {
    logApiError(endpoint, error);
    logPerformanceMetric('getArtistById', Date.now() - startTime, { artistId, result: 'error' });
    throw error;
  }
}

/**
 * Service layer function to search artists
 * Uses /api/artists/search endpoint with credentials
 */
export async function searchArtists(query: string, location?: string): Promise<Artist[]> {
  if (!query || query.trim().length < 2) {

    return [];
  }

  const startTime = Date.now();
  const params = new URLSearchParams({ q: query.trim() });
  if (location) {
    params.append('location', location);
  }
  const endpoint = `/api/artists/search?${params}`;

  try {
    logApiRequest(endpoint, { query, location });

    const response = await fetch(endpoint, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    logApiResponse(endpoint, response.status);

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status} ${response.statusText}`);
    }

    const artists = await response.json() as Artist[];
    
    // Validate each artist in the results
    const validArtists = artists.filter(artist => {
      const analysis = analyzeArtistData(artist);
      return analysis.isValid;
    });

    logPerformanceMetric('searchArtists', Date.now() - startTime, { 
      query, 
      location, 
      totalResults: artists.length, 
      validResults: validArtists.length 
    });

    return validArtists;
  } catch (error) {
    logApiError(endpoint, error);
    logPerformanceMetric('searchArtists', Date.now() - startTime, { query, location, result: 'error' });
    throw error;
  }
}

/**
 * Service layer function to get artist events
 * Uses /api/artists/[artistId]/events endpoint with credentials
 */
export async function getArtistEvents(artistId: string): Promise<Event[]> {
  if (!artistId) {

    return [];
  }

  const startTime = Date.now();
  const endpoint = `/api/artists/${artistId}/events`;

  try {
    logApiRequest(endpoint, { artistId });

    const response = await fetch(endpoint, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    logApiResponse(endpoint, response.status);

    if (!response.ok) {
      if (response.status === 404) {
        logPerformanceMetric('getArtistEvents', Date.now() - startTime, { artistId, result: 'no_events' });
        return [];
      }
      throw new Error(`Failed to fetch artist events: ${response.status} ${response.statusText}`);
    }

    const events = await response.json() as Event[];
    
    // Validate event data structure
    const validEvents = events.filter(event => {
      const analysis = analyzeEventData(event);
      return analysis.isValid;
    });

    logPerformanceMetric('getArtistEvents', Date.now() - startTime, { 
      artistId, 
      totalEvents: events.length, 
      validEvents: validEvents.length 
    });

    return validEvents;
  } catch (error) {
    logApiError(endpoint, error);
    logPerformanceMetric('getArtistEvents', Date.now() - startTime, { artistId, result: 'error' });
    throw error;
  }
}

/**
 * Service layer function to get all artists for browse page
 * Uses /api/artists endpoint with credentials
 */
export async function getAllArtists(): Promise<Artist[]> {
  try {

    const response = await fetch('/api/artists', {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch artists: ${response.status} ${response.statusText}`);
    }

    const artists = await response.json() as Artist[];
    
    // Validate each artist
    const validArtists = artists.filter(artist => {
      const isValid = validateArtistData(artist);
      if (!isValid) {

      }
      return isValid;
    });

    return validArtists;
  } catch (error) {
    console.error(' Error fetching all artists:', error);
    throw error;
  }
}

/**
 * Validate artist data structure
 * Ensures artist_type field exists (no "Band" entity)
 * Validates required fields and data types
 */
export function validateArtistData(artist: any): artist is Artist {
  if (!artist || typeof artist !== 'object') {
    console.error(' Artist validation failed: not an object');
    return false;
  }

  // Required fields
  if (!artist.id || typeof artist.id !== 'string') {
    console.error(' Artist validation failed: missing or invalid id');
    return false;
  }

  if (!artist.name || typeof artist.name !== 'string') {
    console.error(' Artist validation failed: missing or invalid name');
    return false;
  }

  // Validate artist_type field if present (null/undefined allowed for legacy artists)
  if (artist.artist_type !== undefined && artist.artist_type !== null) {
    const validTypes = ['band', 'solo', 'duo', 'group', 'collective'];
    if (!validTypes.includes(artist.artist_type)) {
      console.error(` Artist validation failed: invalid artist_type "${artist.artist_type}". Must be one of: ${validTypes.join(', ')}`);
      return false;
    }
  }

  // Validate optional fields if present
  if (artist.socialMediaUrls !== undefined) {
    if (!Array.isArray(artist.socialMediaUrls)) {
      console.error(' Artist validation failed: socialMediaUrls must be an array');
      return false;
    }
    
    for (const social of artist.socialMediaUrls) {
      if (!social.platform || !social.url) {
        console.error(' Artist validation failed: invalid social media URL structure');
        return false;
      }
    }
  }

  if (artist.genres !== undefined && !Array.isArray(artist.genres)) {
    console.error(' Artist validation failed: genres must be an array');
    return false;
  }

  return true;
}

/**
 * Validate event data structure
 * Ensures required fields are present and valid
 */
export function validateEventData(event: any): event is Event {
  if (!event || typeof event !== 'object') {
    console.error(' Event validation failed: not an object');
    return false;
  }

  // Required fields
  const requiredFields = ['id', 'name', 'date', 'startTime', 'venueId', 'venueName'];
  for (const field of requiredFields) {
    if (!event[field] || typeof event[field] !== 'string') {
      console.error(` Event validation failed: missing or invalid ${field}`);
      return false;
    }
  }

  // Validate artistIds array
  if (!Array.isArray(event.artistIds)) {
    console.error(' Event validation failed: artistIds must be an array');
    return false;
  }

  // Validate location object
  if (!event.location || typeof event.location.lat !== 'number' || typeof event.location.lng !== 'number') {
    console.error(' Event validation failed: invalid location object');
    return false;
  }

  return true;
}

/**
 * Debug utility to log current data issues
 * Helps understand data structure problems
 */
export function debugArtistData(artist: any): void {

  if (artist) {

    // Check for legacy fields that shouldn't exist
    const legacyFields = ['websiteUrl', 'facebookUrl', 'instagramUrl', 'spotifyUrl'];
    legacyFields.forEach(field => {
      if (artist[field]) {

      }
    });
    
    // Validate structure
    const isValid = validateArtistData(artist);

  }

}

/**
 * Debug utility to log event data issues
 */
export function debugEventData(event: any): void {

  if (event) {

    // Validate structure
    const isValid = validateEventData(event);

  }

}