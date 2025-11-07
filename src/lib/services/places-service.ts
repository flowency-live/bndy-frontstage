// src/lib/services/places-service.ts
import { Venue } from "@/lib/types";

// Flag for checking if Google Maps is available
let googleMapsAvailable = false;

// Check if Google Maps API is loaded
export function isGoogleMapsAvailable(): boolean {
  return typeof window !== 'undefined' && 
         window.google !== undefined && 
         window.google.maps !== undefined &&
         window.google.maps.places !== undefined;
}

// Initialize Google Maps check
export function initGoogleMapsCheck() {
  googleMapsAvailable = isGoogleMapsAvailable();
  return googleMapsAvailable;
}

// Search venues using Google Places API with fallback
export async function searchVenueWithIncreasingRadius(
  venueName: string
): Promise<google.maps.places.PlaceResult[]> {
  // First check if Google Maps is available
  if (!googleMapsAvailable) {
    googleMapsAvailable = initGoogleMapsCheck();
  }

  // If Google Maps is not available, return empty array
  if (!googleMapsAvailable) {

    return [];
  }

  try {
    // Create a dummy div for the Places service
    const dummyDiv = document.createElement('div');
    const service = new google.maps.places.PlacesService(dummyDiv);
    
    const results = await new Promise<google.maps.places.PlaceResult[]>((resolve) => {
      service.textSearch({
        query: venueName,
        type: 'establishment'
      }, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          resolve(results);
        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([]);
        } else {

          resolve([]); // Return empty array instead of rejecting to prevent cascade failures
        }
      });
    });

    return results;
  } catch (error) {
    console.error('Error searching places:', error);
    return [];
  }
}

// Search for places with Google Places Autocomplete
export async function searchPlacesAutocomplete(
  query: string,
  options = { types: ['establishment'], country: 'gb' }
): Promise<google.maps.places.AutocompletePrediction[]> {
  // Check if Google Maps is available
  if (!googleMapsAvailable) {
    googleMapsAvailable = initGoogleMapsCheck();
  }

  // If Google Maps is not available, return empty array
  if (!googleMapsAvailable) {

    return [];
  }

  try {
    const autocompleteService = new google.maps.places.AutocompleteService();
    const predictions = await new Promise<google.maps.places.AutocompletePrediction[]>((resolve) => {
      autocompleteService.getPlacePredictions(
        {
          input: query,
          types: options.types,
          componentRestrictions: { country: options.country }
        },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            resolve(predictions);
          } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            resolve([]);
          } else {

            resolve([]); // Return empty array instead of rejecting
          }
        }
      );
    });

    return predictions;
  } catch (error) {
    console.error('Error with places autocomplete:', error);
    return [];
  }
}

// Search for cities/towns with Google Places Autocomplete
export async function searchCityAutocomplete(
  query: string
): Promise<google.maps.places.AutocompletePrediction[]> {
  // Check if Google Maps is available
  if (!googleMapsAvailable) {
    googleMapsAvailable = initGoogleMapsCheck();
  }

  // If Google Maps is not available, return empty array
  if (!googleMapsAvailable) {
    return [];
  }

  try {
    const autocompleteService = new google.maps.places.AutocompleteService();
    const predictions = await new Promise<google.maps.places.AutocompletePrediction[]>((resolve) => {
      autocompleteService.getPlacePredictions(
        {
          input: query,
          types: ['(cities)'],  // Only cities and towns
          componentRestrictions: { country: 'gb' }
        },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            resolve(predictions);
          } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            resolve([]);
          } else {
            resolve([]); // Return empty array instead of rejecting
          }
        }
      );
    });

    return predictions;
  } catch (error) {
    console.error('Error in city autocomplete:', error);
    return [];
  }
}

// Get place details (more fields) from a place_id
export async function getPlaceDetails(
  placeId: string,
  fields = ['name', 'formatted_address', 'geometry', 'place_id']
): Promise<google.maps.places.PlaceResult | null> {
  // Check if Google Maps is available
  if (!googleMapsAvailable) {
    googleMapsAvailable = initGoogleMapsCheck();
  }

  // If Google Maps is not available, return null
  if (!googleMapsAvailable) {

    return null;
  }

  try {
    // Create a dummy div for the Places Details service
    const dummyDiv = document.createElement('div');
    const placesService = new google.maps.places.PlacesService(dummyDiv);
    
    // Create a session token for billing optimization
    const sessionToken = new google.maps.places.AutocompleteSessionToken();
    
    const placeDetails = await new Promise<google.maps.places.PlaceResult | null>((resolve) => {
      placesService.getDetails(
        {
          placeId,
          fields,
          sessionToken
        }, 
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            resolve(place);
          } else {

            resolve(null);
          }
        }
      );
    });

    return placeDetails;
  } catch (error) {
    console.error('Error getting place details:', error);
    return null;
  }
}

// Convert a Google PlaceResult to our Venue type
export function placeResultToVenue(place: google.maps.places.PlaceResult): Venue {
  const now = new Date().toISOString();
  
  return {
    id: '', // Will be assigned when saved to database
    name: place.name || '',
    address: place.formatted_address || '',
    googlePlaceId: place.place_id || '',
    location: {
      lat: place.geometry?.location?.lat() || 0,
      lng: place.geometry?.location?.lng() || 0
    },
    socialMediaUrls: [],
    validated: false,
    createdAt: now,
    updatedAt: now
  };
}