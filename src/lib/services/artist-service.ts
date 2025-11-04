// src/lib/services/artist-service.ts
// ⚠️ NEVER USE FIREBASE AGAIN - ALL DATA IS IN DYNAMODB
// This file contains LEGACY admin tool functions only - DO NOT USE for new features
// createArtist() and searchArtists() already migrated to DynamoDB (api.bndy.co.uk/api/artists)
// All other functions are deprecated admin tools - DO NOT FIX, DO NOT EXTEND
import { collection, doc, getDoc, getDocs, query, where, updateDoc, addDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/config/firebase";
import { COLLECTIONS } from "@/lib/constants";
import { Artist, ArtistMember, Event } from "@/lib/types";

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
 * Update an artist
 */
export async function updateArtist(artist: Artist): Promise<void> {
  if (!artist.id) throw new Error("Artist ID is required");
  if (!db) throw new Error("Firestore not configured");

  const { id, ...artistData } = artist;

  try {
    await updateDoc(doc(db, COLLECTIONS.ARTISTS, id), {
      ...artistData,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error updating artist:", error);
    throw error;
  }
}

/**
 * Create a new artist - Now calls DynamoDB API instead of Firebase
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
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create artist');
    }

    const data = await response.json();

    // Build socialMediaURLs array from individual URLs
    const socialMediaURLs = [];
    if (artist.websiteUrl) socialMediaURLs.push({ platform: 'website', url: artist.websiteUrl });
    if (artist.facebookUrl) socialMediaURLs.push({ platform: 'facebook', url: artist.facebookUrl });
    if (artist.instagramUrl) socialMediaURLs.push({ platform: 'instagram', url: artist.instagramUrl });

    // Return artist in format expected by frontstage
    return {
      id: data.artist.id,
      name: data.artist.name,
      location: data.artist.location,
      description: artist.bio || artist.description || undefined,
      profileImageUrl: '',
      genres: [],
      socialMediaURLs: socialMediaURLs.length > 0 ? socialMediaURLs : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Artist;
  } catch (error) {
    console.error("Error creating artist:", error);
    throw error;
  }
}

/**
 * Delete an artist
 */
export async function deleteArtist(artistId: string): Promise<void> {
  if (!db) throw new Error("Firestore not configured");

  try {
    await deleteDoc(doc(db, COLLECTIONS.ARTISTS, artistId));
  } catch (error) {
    console.error("Error deleting artist:", error);
    throw error;
  }
}

/**
 * Get all artists
 */
export async function getAllArtists(): Promise<Artist[]> {
  if (!db) return [];

  try {
    const snapshot = await getDocs(collection(db, COLLECTIONS.ARTISTS));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Artist));
  } catch (error) {
    console.error("Error fetching artists:", error);
    throw error;
  }
}

/**
 * Search for artists - Now calls DynamoDB fuzzy search API
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

/**
 * Get artist members
 */
export async function getArtistMembers(artistId: string): Promise<ArtistMember[]> {
  if (!db) return [];

  try {
    const membersRef = collection(db, COLLECTIONS.ARTISTS, artistId, 'members');
    const snapshot = await getDocs(membersRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ArtistMember[];
  } catch (error) {
    console.error("Error fetching artist members:", error);
    return [];
  }
}

/**
 * Add a member to an artist
 */
export async function addArtistMember(
  artistId: string,
  userId: string,
  memberData: Omit<ArtistMember, "id" | "userId" | "joinedAt">
): Promise<ArtistMember> {
  if (!db) throw new Error("Firestore not configured");

  try {
    const membersRef = collection(db, COLLECTIONS.ARTISTS, artistId, 'members');
    
    // Check if member already exists
    const existingMemberQuery = query(membersRef, where('userId', '==', userId));
    const existingMemberSnapshot = await getDocs(existingMemberQuery);
    
    if (!existingMemberSnapshot.empty) {
      throw new Error("User is already a member of this artist");
    }
    
    const now = new Date().toISOString();
    const newMember = {
      userId,
      ...memberData,
      joinedAt: now
    };
    
    const docRef = await addDoc(membersRef, newMember);
    
    return {
      id: docRef.id,
      ...newMember,
    } as ArtistMember;
  } catch (error) {
    console.error("Error adding artist member:", error);
    throw error;
  }
}

/**
 * Update a member in an artist
 */
export async function updateArtistMember(
  artistId: string,
  memberId: string,
  memberData: Partial<Omit<ArtistMember, "id" | "userId" | "joinedAt">>
): Promise<void> {
  if (!db) throw new Error("Firestore not configured");

  try {
    const memberRef = doc(db, COLLECTIONS.ARTISTS, artistId, 'members', memberId);
    await updateDoc(memberRef, memberData);
  } catch (error) {
    console.error("Error updating artist member:", error);
    throw error;
  }
}

/**
 * Remove a member from an artist
 */
export async function removeArtistMember(artistId: string, memberId: string): Promise<void> {
  if (!db) throw new Error("Firestore not configured");

  try {
    await deleteDoc(doc(db, COLLECTIONS.ARTISTS, artistId, 'members', memberId));
  } catch (error) {
    console.error("Error removing artist member:", error);
    throw error;
  }
}

/**
 * Check if user is admin of an artist
 */
export async function isUserArtistAdmin(userId: string, artistId: string): Promise<boolean> {
  if (!db) return false;

  try {
    const membersRef = collection(db, COLLECTIONS.ARTISTS, artistId, 'members');
    const q = query(membersRef, where('userId', '==', userId), where('isAdmin', '==', true));
    const snapshot = await getDocs(q);
    
    return !snapshot.empty;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

/**
 * Check if user is a member of an artist
 */
export async function isUserArtistMember(userId: string, artistId: string): Promise<boolean> {
  if (!db) return false;

  try {
    const membersRef = collection(db, COLLECTIONS.ARTISTS, artistId, 'members');
    const q = query(membersRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    return !snapshot.empty;
  } catch (error) {
    console.error("Error checking member status:", error);
    return false;
  }
}

/**
 * Get an artist by user ID - if the user is an admin of any artist
 */
export async function getArtistByAdminUserId(userId: string): Promise<Artist | null> {
  if (!db) return null;

  try {
    // First, get all artists
    const artistsSnapshot = await getDocs(collection(db, COLLECTIONS.ARTISTS));
    const artists = artistsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Artist));
    
    // For each artist, check if the user is an admin in the members subcollection
    for (const artist of artists) {
      const isAdmin = await isUserArtistAdmin(userId, artist.id);
      if (isAdmin) {
        return artist;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error finding artist by user ID:", error);
    return null;
  }
}