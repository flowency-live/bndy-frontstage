// src/lib/services/artist-service.ts
// All data is in DynamoDB - API endpoints at api.bndy.co.uk
import { Artist, Event } from "@/lib/types";

/**
 * Get an artist by ID from DynamoDB API - Service Layer Function
 */
export async function getArtistById(artistId: string): Promise<Artist | null> {
  if (!artistId) return null;

  try {
    const response = await fetch(`/api/artists/${artistId}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch artist: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching artist:', error);
    throw error;
  }
}

/**
 * Get artist events from DynamoDB API - Service Layer Function
 */
export async function getArtistEvents(artistId: string): Promise<Event[]> {
  if (!artistId) return [];

  try {
    const response = await fetch(`/api/artists/${artistId}/events`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch artist events: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching artist events:', error);
    throw error;
  }
}

/**
 * Create a new artist - Calls DynamoDB API
 */
export async function createArtist(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  artist: any
): Promise<Artist> {
  try {
    const response = await fetch('https://api.bndy.co.uk/api/artists/community', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: artist.name,
        location: artist.location || '',
        facebookUrl: artist.facebookUrl || '',
        instagramUrl: artist.instagramUrl || '',
        websiteUrl: artist.websiteUrl || '',
        bio: artist.bio || artist.description || '',
        genres: artist.genres || [],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create artist');
    }

    const data = await response.json();

    // Build socialMediaUrls array from individual URLs
    const socialMediaUrls = [];
    if (artist.websiteUrl) socialMediaUrls.push({ platform: 'website', url: artist.websiteUrl });
    if (artist.facebookUrl) socialMediaUrls.push({ platform: 'facebook', url: artist.facebookUrl });
    if (artist.instagramUrl) socialMediaUrls.push({ platform: 'instagram', url: artist.instagramUrl });

    // Return artist in format expected by frontstage
    return {
      id: data.artist.id,
      name: data.artist.name,
      location: data.artist.location,
      description: artist.bio || artist.description || undefined,
      profileImageUrl: '',
      genres: [],
      socialMediaUrls: socialMediaUrls.length > 0 ? socialMediaUrls : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Artist;
  } catch (error) {
    console.error("Error creating artist:", error);
    throw error;
  }
}

/**
 * Get artist availability from DynamoDB API - Service Layer Function
 */
export async function getArtistAvailability(
  artistId: string,
  startDate?: string,
  endDate?: string
): Promise<Event[]> {
  if (!artistId) return [];

  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const queryString = params.toString();
    const url = `/api/artists/${artistId}/public-availability${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) return [];
      throw new Error(`Failed to fetch artist availability: ${response.status}`);
    }

    const data = await response.json();
    return data.availability || [];
  } catch (error) {
    console.error('Error fetching artist availability:', error);
    return [];
  }
}

/**
 * Search for artists - Calls DynamoDB fuzzy search API
 */
export async function searchArtists(searchTerm: string, location?: string): Promise<Artist[]> {
  if (!searchTerm || searchTerm.length < 2) return [];

  try {
    const params = new URLSearchParams({ name: searchTerm });
    if (location) params.append('location', location);

    const response = await fetch(
      `https://api.bndy.co.uk/api/artists/search?${params.toString()}`
    );

    if (!response.ok) {
      console.error('Error searching artists:', await response.text());
      return [];
    }

    const data = await response.json();

    // Transform matches to Artist format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data.matches || []).map((match: any) => ({
      id: match.id,
      name: match.name,
      location: match.location || '',
      profileImageUrl: match.profileImageUrl || '',
      isVerified: false,
      genres: [],
      socialMediaUrls: [],
      followerCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      matchScore: match.matchScore, // Include for "Did you mean?" UI
    })) as Artist[];
  } catch (error) {
    console.error('Error searching artists:', error);
    return [];
  }
}
