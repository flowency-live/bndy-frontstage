// src/lib/services/venue-service.ts - Updated for current use

import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/config/firebase';
import { COLLECTIONS } from '@/lib/constants';
import { searchVenueWithIncreasingRadius } from './places-service';
import type { Venue } from '@/lib/types';

/**
 * Search for venues in Firestore and Google Places
 */
export async function searchVenues(searchTerm: string): Promise<Venue[]> {
  if (!searchTerm || searchTerm.length < 3) return [];
  
  try {
    // First search in Firestore
    const venuesRef = collection(db, COLLECTIONS.VENUES);
    const snapshot = await getDocs(venuesRef);
    
    const existingVenues = snapshot.docs
      .filter(doc => {
        const data = doc.data();
        const nameMatch = data.name.toLowerCase().includes(searchTerm.toLowerCase());
        const variantMatch = data.nameVariants?.some(
          (variant: string) => variant.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return nameMatch || variantMatch;
      })
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        validated: true
      })) as Venue[];

    if (existingVenues.length > 0) {
      return existingVenues;
    }

    // If no Firestore matches, try Google Places API
    const placesResults = await searchVenueWithIncreasingRadius(searchTerm);
    const now = new Date().toISOString();
    
    return placesResults.map(place => ({
      name: place.name || '',
      address: place.formatted_address || '',
      location: place.geometry?.location?.toJSON() || { lat: 0, lng: 0 },
      googlePlaceId: place.place_id,
      validated: false,
      id: '',  // Will be assigned when saved
      createdAt: now,
      updatedAt: now
    })) as Venue[];

  } catch (error) {
    console.error('Error searching venues:', error);
    return [];
  }
}

// =========================================
// FUTURE IMPLEMENTATION - NOT CURRENTLY USED
// =========================================

// TODO: These functions will be implemented in future iterations


// export async function createVenue(venue: NewVenue): Promise<Venue> {
//   const now = new Date().toISOString();
//   const venueData = {
//     ...venue,
//     validated: false,
//     createdAt: now,
//     updatedAt: now
//   };
  
//   const docRef = await addDoc(collection(db, COLLECTIONS.VENUES), venueData);
//   return { ...venueData, id: docRef.id } as Venue;
// }

// export async function getVenueById(venueId: string): Promise<Venue | null> {
//   if (!venueId) return null;
//   try {
//     const venueSnap = await getDoc(doc(db, 'bf_venues', venueId));
//     if (venueSnap.exists()) {
//       const venueData = venueSnap.data() as Venue;
//       return { ...venueData, id: venueSnap.id }; // Ensure id is only added once
//     }
//   } catch (error) {
//     console.error('Error fetching venue:', error);
//   }
//   return null;
// }