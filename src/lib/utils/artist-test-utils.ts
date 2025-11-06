// src/lib/utils/artist-test-utils.ts
// Test utilities to validate service layer functions and data structure
// Used for debugging and ensuring data accuracy

import { 
  getArtistById, 
  searchArtists, 
  getArtistEvents, 
  getAllArtists,
  validateArtistData,
  validateEventData,
  debugArtistData,
  debugEventData
} from "@/lib/services/artist-service-new";
import { Artist, Event } from "@/lib/types";

/**
 * Test utility to validate service layer functions
 * Runs comprehensive tests on artist data fetching
 */
export async function testArtistService(artistId: string): Promise<{
  success: boolean;
  artist: Artist | null;
  events: Event[];
  errors: string[];
}> {
  const errors: string[] = [];
  let artist: Artist | null = null;
  let events: Event[] = [];

  try {
    // Test 1: Fetch artist by ID
    try {
      artist = await getArtistById(artistId);
      if (artist) {
        // Validate artist data structure
        if (!validateArtistData(artist)) {
          errors.push('Artist data validation failed');
        } else {
        }

        // Debug artist data
        debugArtistData(artist);
      } else {
        errors.push('Artist not found');
      }
    } catch (error) {
      errors.push(`Failed to fetch artist: ${error}`);
      console.error(' Failed to fetch artist:', error);
    }

    // Test 2: Fetch artist events
    if (artist) {
      try {
        events = await getArtistEvents(artistId);
        // Validate each event
        events.forEach((event, index) => {
          if (!validateEventData(event)) {
            errors.push(`Event ${index} validation failed`);
          } else {
          }
          
          // Debug event data
          debugEventData(event);
        });
      } catch (error) {
        errors.push(`Failed to fetch artist events: ${error}`);
        console.error(' Failed to fetch artist events:', error);
      }
    }

    // Test 3: Validate artist_type field (no "Band" entity)
    if (artist) {
      if (artist.artist_type !== undefined) {
        const validTypes = ['band', 'solo', 'duo', 'group', 'collective'];
        if (validTypes.includes(artist.artist_type)) {
        } else {
          errors.push(`Invalid artist_type: ${artist.artist_type}`);
          console.error(` Invalid artist_type: ${artist.artist_type}`);
        }
      } else {
        console.log('⚠️ Artist type not specified (optional field)');
      }
    }
    return {
      success: errors.length === 0,
      artist,
      events,
      errors
    };
  } catch (error) {
    errors.push(`Test suite failed: ${error}`);
    return {
      success: false,
      artist: null,
      events: [],
      errors
    };
  }
}

/**
 * Test utility to validate search functionality
 */
export async function testArtistSearch(query: string, location?: string): Promise<{
  success: boolean;
  artists: Artist[];
  errors: string[];
}> {
  const errors: string[] = [];
  let artists: Artist[] = [];

  try {
    artists = await searchArtists(query, location);
    // Validate each artist in results
    artists.forEach((artist, index) => {
      if (!validateArtistData(artist)) {
        errors.push(`Search result ${index} validation failed`);
        console.error(` Search result ${index} validation failed:`, artist);
      } else {
      }
    });
    return {
      success: errors.length === 0,
      artists,
      errors
    };
  } catch (error) {
    errors.push(`Search test failed: ${error}`);
    return {
      success: false,
      artists: [],
      errors
    };
  }
}

/**
 * Test utility to validate browse functionality
 */
export async function testArtistBrowse(): Promise<{
  success: boolean;
  artists: Artist[];
  errors: string[];
}> {
  const errors: string[] = [];
  let artists: Artist[] = [];

  try {
    console.group('[TEST] Testing Artist Browse (Get All Artists)');

    artists = await getAllArtists();
    // Validate first 10 artists (to avoid overwhelming logs)
    const samplesToValidate = Math.min(10, artists.length);
    for (let i = 0; i < samplesToValidate; i++) {
      const artist = artists[i];
      if (!validateArtistData(artist)) {
        errors.push(`Browse result ${i} validation failed`);
        console.error(` Browse result ${i} validation failed:`, artist);
      } else {
      }
    }

    if (artists.length > samplesToValidate) {
      console.log(`ℹ️ Validated ${samplesToValidate} of ${artists.length} artists (sample)`);
    }
    return {
      success: errors.length === 0,
      artists,
      errors
    };
  } catch (error) {
    errors.push(`Browse test failed: ${error}`);
    return {
      success: false,
      artists: [],
      errors
    };
  }
}

/**
 * Comprehensive test suite for all artist service functions
 */
export async function runArtistServiceTests(testArtistId?: string): Promise<{
  success: boolean;
  results: {
    artistTest?: any;
    searchTest?: any;
    browseTest?: any;
  };
  errors: string[];
}> {
  const allErrors: string[] = [];
  const results: any = {};
  try {
    // Test 1: Artist browse
    const browseResult = await testArtistBrowse();
    results.browseTest = browseResult;
    if (!browseResult.success) {
      allErrors.push(...browseResult.errors);
    }

    // Test 2: Artist search
    const searchResult = await testArtistSearch('test', 'London');
    results.searchTest = searchResult;
    if (!searchResult.success) {
      allErrors.push(...searchResult.errors);
    }

    // Test 3: Individual artist (if ID provided)
    if (testArtistId) {
      const artistResult = await testArtistService(testArtistId);
      results.artistTest = artistResult;
      if (!artistResult.success) {
        allErrors.push(...artistResult.errors);
      }
    }

    const overallSuccess = allErrors.length === 0;
    if (allErrors.length > 0) {
      console.error(' Test Errors:', allErrors);
    }
    return {
      success: overallSuccess,
      results,
      errors: allErrors
    };
  } catch (error) {
    allErrors.push(`Test suite execution failed: ${error}`);
    return {
      success: false,
      results,
      errors: allErrors
    };
  }
}

/**
 * Quick validation utility for development
 * Can be called from browser console for debugging
 */
export function quickValidateArtist(artist: any): boolean {
  debugArtistData(artist);
  const isValid = validateArtistData(artist);
  return isValid;
}

/**
 * Quick validation utility for events
 */
export function quickValidateEvent(event: any): boolean {
  debugEventData(event);
  const isValid = validateEventData(event);
  return isValid;
}

// Export for browser console debugging
if (typeof window !== 'undefined') {
  (window as any).artistTestUtils = {
    testArtistService,
    testArtistSearch,
    testArtistBrowse,
    runArtistServiceTests,
    quickValidateArtist,
    quickValidateEvent
  };
}