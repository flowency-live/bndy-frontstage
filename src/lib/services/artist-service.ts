// src/lib/services/artist-service.ts - Combined implementation
import { collection, doc, getDoc, getDocs, query, where, updateDoc, addDoc, deleteDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/config/firebase";
import { COLLECTIONS } from "@/lib/constants";
import { Artist, ArtistMember } from "@/lib/types";

/**
 * Get an artist by ID
 */
export async function getArtistById(artistId: string): Promise<Artist | null> {
  if (!artistId) return null;
  
  try {
    const artistDoc = await getDoc(doc(db, COLLECTIONS.ARTISTS, artistId));
    
    if (!artistDoc.exists()) {
      return null;
    }
    
    return {
      id: artistDoc.id,
      ...artistDoc.data(),
    } as Artist;
  } catch (error) {
    console.error("Error fetching artist:", error);
    throw error;
  }
}

/**
 * Update an artist
 */
export async function updateArtist(artist: Artist): Promise<void> {
  if (!artist.id) throw new Error("Artist ID is required");
  
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
 * Create a new artist
 */
export async function createArtist(artist: Omit<Artist, "id" | "createdAt" | "updatedAt">): Promise<Artist> {
  try {
    const now = new Date().toISOString();
    
    const newArtist = {
      ...artist,
      nameVariants: [artist.name],
      createdAt: now,
      updatedAt: now
    };
    
    const docRef = await addDoc(collection(db, COLLECTIONS.ARTISTS), newArtist);
    
    return {
      id: docRef.id,
      ...newArtist,
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
 * Search for artists in Firestore
 */
export async function searchArtists(searchTerm: string): Promise<Artist[]> {
  if (!searchTerm || searchTerm.length < 2) return [];

  try {
    const artistsRef = collection(db, COLLECTIONS.ARTISTS);
    const snapshot = await getDocs(artistsRef);
    
    const existingArtists = snapshot.docs
      .filter(doc => {
        const data = doc.data();
        const name = data.name as string;
        return name.toLowerCase().includes(searchTerm.toLowerCase());
      })
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Artist[];

    return existingArtists;
  } catch (error) {
    console.error('Error searching artists:', error);
    return [];
  }
}

/**
 * Get artist members
 */
export async function getArtistMembers(artistId: string): Promise<ArtistMember[]> {
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