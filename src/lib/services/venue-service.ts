// src/lib/services/venue-service.ts - DynamoDB implementation
import { Venue } from "@/lib/types";
import { isGoogleMapsAvailable, searchVenueWithIncreasingRadius, searchPlacesAutocomplete, getPlaceDetails, placeResultToVenue } from './places-service';

const API_BASE_URL = 'https://api.bndy.co.uk';

/**
 * Get a venue by ID from DynamoDB
 */
export async function getVenueById(venueId: string): Promise<Venue | null> {
  if (!venueId) return null;

  try {
    // Fetch all venues and find the one with matching ID
    // (Backend doesn't have GET /api/venues/:id endpoint yet)
    const response = await fetch(`${API_BASE_URL}/api/venues`);

    if (!response.ok) {
      console.error('Error fetching venues:', await response.text());
      return null;
    }

    const venues = await response.json() as Venue[];
    return venues.find(v => v.id === venueId) || null;
  } catch (error) {
    console.error("Error fetching venue:", error);
    return null;
  }
}

/**
 * Update a venue (Backend endpoint not implemented yet)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function updateVenue(_venue: Venue): Promise<void> {
  // TODO: Implement PUT /api/venues/:id on backend
  throw new Error("Update venue not implemented - backend endpoint needed: PUT /api/venues/:id");
}

/**
 * Create a new venue
 */
export async function createVenue(venue: Omit<Venue, "id" | "createdAt" | "updatedAt">): Promise<Venue> {
  try {
    const response = await fetch('https://api.bndy.co.uk/api/venues', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: venue.name,
        address: venue.address,
        latitude: venue.location?.lat || 0,
        longitude: venue.location?.lng || 0,
        location: venue.location,
        googlePlaceId: venue.googlePlaceId,
        validated: venue.validated || false,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create venue');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating venue:', error);
    throw error;
  }
}

/**
 * Delete a venue (Backend endpoint not implemented yet)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function deleteVenue(_venueId: string): Promise<void> {
  // TODO: Implement DELETE /api/venues/:id on backend
  throw new Error("Delete venue not implemented - backend endpoint needed: DELETE /api/venues/:id");
}

/**
 * Get all venues from DynamoDB
 */
export async function getAllVenues(): Promise<Venue[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/venues`);

    if (!response.ok) {
      console.error('Error fetching all venues:', await response.text());
      return [];
    }

    return await response.json() as Venue[];
  } catch (error) {
    console.error("Error fetching venues:", error);
    return [];
  }
}

/**
 * Get all venues for map display from DynamoDB
 */
export async function getAllVenuesForMap(): Promise<Venue[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/venues`);
    if (!response.ok) {
      throw new Error(`API responded with ${response.status}: ${response.statusText}`);
    }
    const venues = await response.json();
    return venues as Venue[];
  } catch (error) {
    console.error("Error fetching venues for map from DynamoDB API:", error);
    return [];
  }
}

/**
 * Search for venues in DynamoDB and Google Places
 */
export async function searchVenues(searchTerm: string): Promise<Venue[]> {
  if (!searchTerm || searchTerm.length < 3) return [];

  // 1. DynamoDB fuzzy search (this fetches ALL venues and filters client-side)
  const existingVenues = await getFuzzyMatchedVenues(searchTerm);
  if (existingVenues.length > 0) {
    return existingVenues.map(v => ({ ...v, validated: true }));
  }

  // 2. If no DynamoDB match, try Google Places (if available)
  if (isGoogleMapsAvailable()) {
    try {
      const placesResults = await searchVenueWithIncreasingRadius(searchTerm);

      // 3. For de-duplication, fetch ALL venues from DynamoDB
      // (We can't reuse existingVenues because getFuzzyMatchedVenues already filtered them)
      const response = await fetch(`${API_BASE_URL}/api/venues`);
      if (!response.ok) {
        console.error('Error fetching all venues for de-duplication:', await response.text());
        // If we can't de-duplicate, just return Google results
        const now = new Date().toISOString();
        return placesResults.map(place => ({
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

      const allBfVenues = await response.json() as Venue[];

      // 4. Filter out Google Places that already exist in DynamoDB
      const filteredPlaces = placesResults.filter(place => {
        // a) Check googlePlaceId
        const placeIdMatch = place.place_id && allBfVenues.some(
          v => v.googlePlaceId === place.place_id
        );
        if (placeIdMatch) return false; // skip, already in DynamoDB

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

      // 5. Convert filtered places into your Venue objects
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
    } catch (error) {
      console.error("Error searching Google Places:", error);
      return []; // Return empty array to fail gracefully
    }
  } else {
    return [];
  }
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
    // Use DynamoDB API for venue search
    const response = await fetch(`${API_BASE_URL}/api/venues`);

    if (!response.ok) {
      console.error('Error fetching venues:', await response.text());
      return [];
    }

    const allVenues = await response.json() as Venue[];

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
 * Get venues by admin user ID (Not implemented - requires backend support)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getVenuesByAdminUserId(_userId: string): Promise<Venue[]> {
  // TODO: Implement backend endpoint for venue admin management
  throw new Error("Get venues by admin not implemented - backend endpoint needed");
}

/**
 * Check if user is admin of a venue (Not implemented - requires backend support)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function isUserVenueAdmin(_userId: string, _venueId: string): Promise<boolean> {
  // TODO: Implement backend endpoint for venue admin management
  return false;
}

/**
 * Add admin to venue (Backend endpoint not implemented yet)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function addVenueAdmin(_venueId: string, _userId: string): Promise<void> {
  // TODO: Implement PUT /api/venues/:id on backend
  throw new Error("Add venue admin not implemented - backend endpoint needed: PUT /api/venues/:id");
}

/**
 * Remove admin from venue (Backend endpoint not implemented yet)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function removeVenueAdmin(_venueId: string, _userId: string): Promise<void> {
  // TODO: Implement PUT /api/venues/:id on backend
  throw new Error("Remove venue admin not implemented - backend endpoint needed: PUT /api/venues/:id");
}

/**
 * Get venue by location (client-side search from all venues)
 */
export async function getVenueByLocation(lat: number, lng: number, precision: number = 0.0001): Promise<Venue | null> {
  try {
    const allVenues = await getAllVenues();

    // Find the first venue that has a location matching the coordinates within the precision
    const matchingVenue = allVenues.find(venue => {
      if (!venue.location || !venue.location.lat || !venue.location.lng) return false;

      return (
        Math.abs(venue.location.lat - lat) < precision &&
        Math.abs(venue.location.lng - lng) < precision
      );
    });

    return matchingVenue || null;
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


/**
 * Search Google Places API directly for venues
 * This is used for creating new venues that don't exist in the database yet
 */
export async function searchGooglePlaces(query: string): Promise<Venue[]> {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    // First check if Google Maps is available
    if (!isGoogleMapsAvailable()) {
      return [];
    }

    // Get predictions from Google Places Autocomplete
    const predictions = await searchPlacesAutocomplete(query);
    
    // Get details for each prediction
    const venuePromises = predictions.map(async prediction => {
      const place = await getPlaceDetails(prediction.place_id);
      if (place) {
        return placeResultToVenue(place);
      }
      return null;
    });

    // Wait for all venue details and filter out nulls
    const venues = (await Promise.all(venuePromises)).filter(venue => venue !== null) as Venue[];
    
    return venues;
  } catch (error) {
    console.error("Error searching Google Places:", error);
    return [];
  }
}
