// src/components/wizard/steps/VenueMapStep.tsx
// Google Maps interface with Places Text Search for venue selection

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { EventWizardFormData, Venue } from '@/lib/types';
import { useGoogleMaps } from '@/components/providers/GoogleMapsProvider';
import { useDebounce } from 'use-debounce';

interface VenueMapStepProps {
  formData: EventWizardFormData;
  onUpdate: (data: Partial<EventWizardFormData>) => void;
  onNext: () => void;
}

interface SearchResult {
  name: string;
  address: string;
  placeId: string;
  location: { lat: number; lng: number };
}

export function VenueMapStep({ formData, onUpdate, onNext }: VenueMapStepProps) {
  const { isLoaded, loadGoogleMaps } = useGoogleMaps();
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(formData.venue);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300); // 300ms for faster response
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [existsInBndy, setExistsInBndy] = useState<boolean | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const bndyVenuesCacheRef = useRef<any[] | null>(null); // Cache BNDY venues

  // Load Google Maps on mount
  useEffect(() => {
    if (!isLoaded) {
      loadGoogleMaps();
    }
  }, [isLoaded, loadGoogleMaps]);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || map) return;

    const defaultCenter = { lat: 53.0, lng: -2.0 }; // UK center
    const newMap = new google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 6,
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
    });

    setMap(newMap);

    // Try to get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          newMap.setCenter(userLocation);
          newMap.setZoom(12);
        },
        () => {
          console.warn('Geolocation permission denied, using default location');
        }
      );
    }
  }, [isLoaded, map]);

  // Search venues using Google Places Text Search API
  const searchVenues = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    if (!isLoaded) {
      console.warn('[VenueMapStep] Google Maps not loaded yet');
      return;
    }

    setIsSearching(true);
    setShowResults(true);

    try {
      // Use the new Place.searchByText API (same as backstage)
      if (google.maps.places.Place && (google.maps.places.Place as any).searchByText) {
        const request: any = {
          textQuery: query,
          fields: ['displayName', 'formattedAddress', 'location', 'id'],
          maxResultCount: 20,
          // No location bias - search UK-wide for better results
        };

        const { places } = await (google.maps.places.Place as any).searchByText(request);

        if (!places || places.length === 0) {
          setSearchResults([]);
          setIsSearching(false);
          return;
        }

        // Convert to our SearchResult format
        const results: SearchResult[] = places.map((place: any) => ({
          name: place.displayName || '',
          address: place.formattedAddress || '',
          placeId: place.id || '',
          location: {
            lat: place.location?.lat() || 0,
            lng: place.location?.lng() || 0,
          },
        }));

        setSearchResults(results);
      } else {
        console.warn('[VenueMapStep] Place.searchByText API not available');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('[VenueMapStep] Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [isLoaded]);

  // Trigger search when debounced term changes
  useEffect(() => {
    if (debouncedSearchTerm) {
      searchVenues(debouncedSearchTerm);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [debouncedSearchTerm, searchVenues]);

  const handleSelectVenue = useCallback(async (result: SearchResult) => {
    const venue: Venue = {
      id: result.placeId,
      name: result.name,
      address: result.address,
      location: result.location,
      googlePlaceId: result.placeId,
      validated: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSelectedVenue(venue);
    onUpdate({
      venue,
      venueName: venue.name,
      venueLocation: venue.location,
    });

    // Check if venue exists in BNDY database (with caching)
    setIsCheckingDuplicate(true);
    setExistsInBndy(null);

    try {
      // Use cached venues if available, otherwise fetch
      let bndyVenues = bndyVenuesCacheRef.current;

      if (!bndyVenues) {
        const response = await fetch('https://api.bndy.co.uk/api/venues', {
          credentials: 'include',
        });

        if (response.ok) {
          bndyVenues = await response.json();
          bndyVenuesCacheRef.current = bndyVenues; // Cache for next time
          console.warn('[VenueMapStep] Loaded and cached', bndyVenues.length, 'BNDY venues');
        } else {
          console.warn('[VenueMapStep] Failed to fetch BNDY venues for duplicate check');
          setExistsInBndy(null);
          setIsCheckingDuplicate(false);
          return;
        }
      } else {
        console.warn('[VenueMapStep] Using cached BNDY venues');
      }

      // Normalize venue name for comparison
      const normalizeVenueName = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const normalizedGoogleName = normalizeVenueName(venue.name);

      // Check if any BNDY venue matches this Google Place
      const isDuplicate = bndyVenues.some((bndyVenue: any) => {
        // Match by Google Place ID if available
        if (bndyVenue.googlePlaceId && venue.googlePlaceId) {
          return bndyVenue.googlePlaceId === venue.googlePlaceId;
        }

        // Fallback: match by normalized name
        const normalizedBndyName = normalizeVenueName(bndyVenue.name);
        return normalizedBndyName === normalizedGoogleName;
      });

      setExistsInBndy(isDuplicate);
      console.warn('[VenueMapStep] Duplicate check:', {
        venueName: venue.name,
        isDuplicate,
        googlePlaceId: venue.googlePlaceId
      });
    } catch (error) {
      console.error('[VenueMapStep] Error checking for duplicates:', error);
      setExistsInBndy(null);
    } finally {
      setIsCheckingDuplicate(false);
    }

    // Center map on selected venue
    if (map) {
      map.setCenter(venue.location);
      map.setZoom(15);
    }

    // Clear search
    setSearchTerm('');
    setShowResults(false);
    setSearchResults([]);

    // Clear old markers
    markers.forEach(m => m.setMap(null));

    // Add a single marker for selected venue with custom cyan SVG icon
    const marker = new google.maps.Marker({
      position: venue.location,
      map,
      title: venue.name,
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="29" viewBox="0 0 24 36">
            <path d="M12,0 C5.3,0 0,5.3 0,12 C0,20 12,36 12,36 C12,36 24,20 24,12 C24,5.3 18.6,0 12,0 Z"
              fill="#06B6D4"
              stroke="#FFFFFF"
              stroke-width="1.5" />
            <circle cx="12" cy="12" r="3.5" fill="#FFFFFF" />
          </svg>
        `),
        scaledSize: new google.maps.Size(22, 29),
        anchor: new google.maps.Point(11, 29),
      },
    });

    setMarkers([marker]);
  }, [map, onUpdate, markers]);

  const handleClearSelection = () => {
    setSelectedVenue(null);
    onUpdate({
      venue: null,
      venueName: '',
      venueLocation: null,
    });
    markers.forEach(m => m.setMap(null));
    setMarkers([]);
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Search Box - at top with minimal padding */}
      <div className="relative z-20 px-2 pb-1 shrink-0">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search for a venue..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => {
            if (searchResults.length > 0) {
              setShowResults(true);
            }
          }}
          className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-orange-500 focus:outline-none shadow-md caret-gray-900 dark:caret-white"
        />

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute top-full left-2 right-2 mt-1 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto z-30">
            {searchResults.map((result, index) => (
              <button
                key={`${result.placeId}-${index}`}
                onClick={() => handleSelectVenue(result)}
                className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-b-0 transition-colors"
              >
                <div className="font-medium text-gray-900 dark:text-white">{result.name}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{result.address}</div>
              </button>
            ))}
          </div>
        )}

        {/* No Results Message */}
        {showResults && !isSearching && searchTerm.length >= 2 && searchResults.length === 0 && (
          <div className="absolute top-full left-2 right-2 mt-1 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 z-30">
            <p className="text-center text-gray-600 dark:text-gray-400">No venues found for "{searchTerm}"</p>
          </div>
        )}

        {/* Loading Indicator */}
        {isSearching && (
          <div className="absolute top-full left-2 right-2 mt-1 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 z-30">
            <p className="text-center text-gray-600 dark:text-gray-400">Searching...</p>
          </div>
        )}
      </div>

      {/* Map Container - fills remaining space */}
      <div ref={mapRef} className="flex-1 w-full" />

      {/* Selected Venue Card - positioned at bottom */}
      {selectedVenue && (
        <div className="absolute bottom-2 left-2 right-2 z-10 sm:bottom-4 sm:left-4 sm:right-4">
          <div className="bg-card shadow-lg rounded-lg p-4 border-2 border-orange-500">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg text-card-foreground">{selectedVenue.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedVenue.address}</p>
                {selectedVenue.city && (
                  <p className="text-sm text-muted-foreground">{selectedVenue.city}</p>
                )}
              </div>
              <button
                onClick={handleClearSelection}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            {/* DEBUG: Duplicate check indicator */}
            {isCheckingDuplicate && (
              <div className="mb-3 p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                <p className="text-gray-600 dark:text-gray-400">Checking BNDY database...</p>
              </div>
            )}

            {!isCheckingDuplicate && existsInBndy !== null && (
              <div className={`mb-3 p-2 rounded text-sm ${
                existsInBndy
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-600 text-white'
              }`}>
                <p className="font-semibold">
                  {existsInBndy ? '✓ EXISTS IN BNDY' : '✓ NEW VENUE (not in BNDY)'}
                </p>
                <p className="text-xs mt-1">
                  {existsInBndy
                    ? 'This venue is already in the BNDY database'
                    : 'This is a new venue that will be added to BNDY'
                  }
                </p>
              </div>
            )}

            <button
              onClick={onNext}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Continue with this venue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
