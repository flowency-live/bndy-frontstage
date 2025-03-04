// src/lib/services/venue-service.ts - Combined implementation
import { collection, doc, getDoc, getDocs, query, where, updateDoc, addDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/config/firebase";
import { COLLECTIONS } from "@/lib/constants";
import { searchVenueWithIncreasingRadius } from './places-service';
import { Venue } from "@/lib/types";

/**
 * Get a venue by ID
 */
export async function getVenueById(venueId: string): Promise<Venue | null> {
  if (!venueId) return null;
  
  try {
    const venueDoc = await getDoc(doc(db, COLLECTIONS.VENUES, venueId));
    
    if (!venueDoc.exists()) {
      return null;
    }
    
    return {
      id: venueDoc.id,
      ...venueDoc.data(),
    } as Venue;
  } catch (error) {
    console.error("Error fetching venue:", error);
    throw error;
  }
}

/**
 * Update a venue
 */
export async function updateVenue(venue: Venue): Promise<void> {
  if (!venue.id) throw new Error("Venue ID is required");
  
  const { id, ...venueData } = venue;
  
  try {
    await updateDoc(doc(db, COLLECTIONS.VENUES, id), {
      ...venueData,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error updating venue:", error);
    throw error;
  }
}

/**
 * Create a new venue
 */
export async function createVenue(venue: Omit<Venue, "id" | "createdAt" | "updatedAt">): Promise<Venue> {
  try {
    const now = new Date().toISOString();
    
    const newVenue = {
      ...venue,
      validated: false, // New venues need validation
      createdAt: now,
      updatedAt: now
    };
    
    const docRef = await addDoc(collection(db, COLLECTIONS.VENUES), newVenue);
    
    return {
      id: docRef.id,
      ...newVenue,
    } as Venue;
  } catch (error) {
    console.error("Error creating venue:", error);
    throw error;
  }
}

/**
 * Delete a venue
 */
export async function deleteVenue(venueId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.VENUES, venueId));
  } catch (error) {
    console.error("Error deleting venue:", error);
    throw error;
  }
}

/**
 * Get all venues
 */
export async function getAllVenues(): Promise<Venue[]> {
  try {
    const snapshot = await getDocs(collection(db, COLLECTIONS.VENUES));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Venue));
  } catch (error) {
    console.error("Error fetching venues:", error);
    throw error;
  }
}

/**
 * Search for venues in Firestore and Google Places
 */
// In venue-service.ts
export async function searchVenues(searchTerm: string): Promise<Venue[]> {
  if (!searchTerm || searchTerm.length < 3) return [];

  // 1. Firestore fuzzy search
  const existingVenues = await getFuzzyMatchedVenues(searchTerm);
  if (existingVenues.length > 0) {
    return existingVenues.map(v => ({ ...v, validated: true }));
  }

  // 2. If no Firestore match, do Google Places
  const placesResults = await searchVenueWithIncreasingRadius(searchTerm);

  // 3. Cross-check each Place against your bf_venues
  const allBfVenues = await getAllVenues(); // or you can store them in memory
  const filteredPlaces = placesResults.filter(place => {
    // a) Check googlePlaceId
    const placeIdMatch = place.place_id && allBfVenues.some(
      v => v.googlePlaceId === place.place_id
    );
    if (placeIdMatch) return false; // skip, already in Firestore

    // b) Or do a name+address fuzzy check
    const placeName = (place.name || "").trim().toLowerCase();
    const placeAddr = (place.formatted_address || "").trim().toLowerCase();

    return !allBfVenues.some(v => {
      const vName = (v.name || "").trim().toLowerCase();
      const vAddr = (v.address || "").trim().toLowerCase();
      // A simple check:
      return vName === placeName && vAddr === placeAddr;
    });
  });

  // 4. Convert filtered places into your Venue objects
  const now = new Date().toISOString();
  return filteredPlaces.map(place => ({
    name: place.name || '',
    address: place.formatted_address || '',
    location: place.geometry?.location?.toJSON() || { lat: 0, lng: 0 },
    googlePlaceId: place.place_id || '',
    validated: false,
    id: '',
    createdAt: now,
    updatedAt: now,
  }));
}

/**
 * Token-based matching:
 *   - Split the searchTerm by spaces => tokens
 *   - Combine name + address => single string
 *   - Return true if *every* token is found somewhere in that combined string.
 */
function matchAllTokens(venue: Venue, searchTerm: string): boolean {
  const tokens = searchTerm.toLowerCase().split(/\s+/).filter(Boolean);
  const combined = ((venue.name || "") + " " + (venue.address || "")).toLowerCase();

  // Check if every token is included in the combined string
  return tokens.every(token => combined.includes(token));
}

export async function getFuzzyMatchedVenues(searchTerm: string): Promise<Venue[]> {
  if (!searchTerm || searchTerm.length < 2) {
    return [];
  }

  try {
    const snapshot = await getDocs(collection(db, COLLECTIONS.VENUES));
    const allVenues = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Venue[];

    // Filter by nameVariants too, if desired:
    // For each token, check if it appears in nameVariants
    // But let's keep it simpler for now.

    return allVenues.filter(venue => matchAllTokens(venue, searchTerm));
  } catch (error) {
    console.error("Error in getFuzzyMatchedVenues:", error);
    return [];
  }
}



/**
 * Get venues by admin user ID
 */
export async function getVenuesByAdminUserId(userId: string): Promise<Venue[]> {
  try {
    // This is a basic implementation. In a more complex system, you'd have a specific
    // subcollection or field to track venue admins.
    const venuesRef = collection(db, COLLECTIONS.VENUES);
    const q = query(venuesRef, where('adminIds', 'array-contains', userId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Venue));
  } catch (error) {
    console.error("Error fetching venues by admin:", error);
    return [];
  }
}

/**
 * Check if user is admin of a venue
 */
export async function isUserVenueAdmin(userId: string, venueId: string): Promise<boolean> {
  try {
    const venueDoc = await getDoc(doc(db, COLLECTIONS.VENUES, venueId));
    
    if (!venueDoc.exists()) {
      return false;
    }
    
    const venue = venueDoc.data();
    return venue.adminIds?.includes(userId) || false;
  } catch (error) {
    console.error("Error checking venue admin status:", error);
    return false;
  }
}

/**
 * Add admin to venue
 */
export async function addVenueAdmin(venueId: string, userId: string): Promise<void> {
  try {
    const venueRef = doc(db, COLLECTIONS.VENUES, venueId);
    const venueDoc = await getDoc(venueRef);
    
    if (!venueDoc.exists()) {
      throw new Error("Venue not found");
    }
    
    const venue = venueDoc.data();
    const adminIds = venue.adminIds || [];
    
    if (adminIds.includes(userId)) {
      return; // User is already an admin
    }
    
    await updateDoc(venueRef, {
      adminIds: [...adminIds, userId],
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error adding venue admin:", error);
    throw error;
  }
}

/**
 * Remove admin from venue
 */
export async function removeVenueAdmin(venueId: string, userId: string): Promise<void> {
  try {
    const venueRef = doc(db, COLLECTIONS.VENUES, venueId);
    const venueDoc = await getDoc(venueRef);
    
    if (!venueDoc.exists()) {
      throw new Error("Venue not found");
    }
    
    const venue = venueDoc.data();
    const adminIds = venue.adminIds || [];
    
    if (!adminIds.includes(userId)) {
      return; // User is not an admin
    }
    
    await updateDoc(venueRef, {
      adminIds: adminIds.filter((id: string) => id !== userId),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error removing venue admin:", error);
    throw error;
  }
}

/**
 * Get venue by location
 */
export async function getVenueByLocation(lat: number, lng: number, precision: number = 0.0001): Promise<Venue | null> {
  try {
    const venuesRef = collection(db, COLLECTIONS.VENUES);
    const snapshot = await getDocs(venuesRef);
    
    // Find the first venue that has a location matching the coordinates within the precision
    const matchingVenue = snapshot.docs.find(doc => {
      const data = doc.data();
      if (!data.location || !data.location.lat || !data.location.lng) return false;
      
      return (
        Math.abs(data.location.lat - lat) < precision &&
        Math.abs(data.location.lng - lng) < precision
      );
    });
    
    if (!matchingVenue) return null;
    
    return {
      id: matchingVenue.id,
      ...matchingVenue.data(),
    } as Venue;
  } catch (error) {
    console.error("Error finding venue by location:", error);
    return null;
  }
}

/**
 * Extract postcode from address
 */
export function extractPostcodeFromAddress(address: string): string | null {
  // UK postcode regex pattern
  const postcodeRegex = /[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}/i;
  
  // Find the postcode in the address
  const match = address.match(postcodeRegex);
  
  return match ? match[0] : null;
}


// Add this function to your existing venue-service.ts file

/**
 * Search Google Places API directly for venues
 * This is used for creating new venues that don't exist in the database yet
 */
export async function searchGooglePlaces(query: string): Promise<Venue[]> {
  if (!query || query.length < 2 || !window.google || !window.google.maps) {
    return [];
  }

  try {
    // Create a new session token for each search
    const sessionToken = new google.maps.places.AutocompleteSessionToken();
    const autocompleteService = new google.maps.places.AutocompleteService();
    const placesService = new google.maps.places.PlacesService(document.createElement('div'));

    // Get predictions from Google Places
    const predictions = await new Promise<google.maps.places.AutocompletePrediction[]>((resolve, reject) => {
      autocompleteService.getPlacePredictions({
        input: query,
        types: ['establishment'],
        componentRestrictions: { country: 'gb' },
        sessionToken
      }, (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          resolve(predictions);
        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([]);
        } else {
          reject(status);
        }
      });
    });

    // Get details for each prediction
    const venues = await Promise.all(
      predictions.map(prediction => 
        new Promise<Venue | null>((resolve) => {
          placesService.getDetails({
            placeId: prediction.place_id,
            fields: ['name', 'formatted_address', 'geometry', 'place_id'],
            sessionToken
          }, (place, detailStatus) => {
            if (detailStatus === google.maps.places.PlacesServiceStatus.OK && place) {
              // Create a venue object from the place details
              const venue: Venue = {
                id: '', // Will be assigned when saved
                name: place.name || '',
                address: place.formatted_address || '',
                googlePlaceId: place.place_id || '',
                location: {
                  lat: place.geometry?.location?.lat() || 0,
                  lng: place.geometry?.location?.lng() || 0
                },
                socialMediaURLs: [],
                validated: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
              resolve(venue);
            } else {
              resolve(null);
            }
          });
        })
      )
    );

    // Filter out null results
    return venues.filter(venue => venue !== null) as Venue[];
  } catch (error) {
    console.error("Error searching Google Places:", error);
    return [];
  }
}

