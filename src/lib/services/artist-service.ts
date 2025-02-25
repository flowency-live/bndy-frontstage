// src/lib/services/artist-service.ts - Updated for current use

import { collection, getDocs, getDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/config/firebase';
import { COLLECTIONS } from '@/lib/constants';
import type { Artist } from '@/lib/types';

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

// =========================================
// FUTURE IMPLEMENTATION - NOT CURRENTLY USED
// =========================================

// TODO: These functions will be implemented in future iterations

export type NewArtist = Omit<Artist, 'id' | 'createdAt' | 'updatedAt'>;


export async function createArtist(artist: NewArtist): Promise<Artist> {
  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, COLLECTIONS.ARTISTS), {
    ...artist,
    nameVariants: [artist.name],
    createdAt: now,
    updatedAt: now
  });

  return {
    id: docRef.id,
    ...artist,
    nameVariants: [artist.name],
    createdAt: now,
    updatedAt: now
  };
}

export async function getArtistById(artistId: string): Promise<Artist | null> {
  if (!artistId) return null;
  try {
    const artistSnap = await getDoc(doc(db, 'bf_artists', artistId));
    if (artistSnap.exists()) {
      const artistData = artistSnap.data() as Artist;
      return { ...artistData, id: artistSnap.id }; // Ensure id is only added once
    }
  } catch (error) {
    console.error('Error fetching artist:', error);
  }
  return null;
}