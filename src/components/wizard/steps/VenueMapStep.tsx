// src/components/wizard/steps/VenueMapStep.tsx
// Google Maps interface with pin selection for venue search

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { EventWizardFormData, Venue } from '@/lib/types';
import { useGoogleMaps } from '@/components/providers/GoogleMapsProvider';

interface VenueMapStepProps {
  formData: EventWizardFormData;
  onUpdate: (data: Partial<EventWizardFormData>) => void;
  onNext: () => void;
}

export function VenueMapStep({ formData, onUpdate, onNext }: VenueMapStepProps) {
  const { isLoaded, loadGoogleMaps } = useGoogleMaps();
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(formData.venue);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

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
          console.log('Geolocation permission denied, using default location');
        }
      );
    }
  }, [isLoaded, map]);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (!isLoaded || !searchInputRef.current || autocompleteRef.current || !map) return;

    const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
      // Use 'establishment' to allow all venue types (clubs, pubs, restaurants, etc)
      // Type filtering was too restrictive - excluded Conservative Clubs, Working Men's Clubs, etc
      types: ['establishment'],
      fields: ['place_id', 'name', 'formatted_address', 'geometry', 'types'],
      componentRestrictions: { country: 'gb' }, // Restrict to UK
    });

    // Bias results to current map location but allow searching anywhere
    autocomplete.bindTo('bounds', map);

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();

      if (!place.geometry || !place.geometry.location) {
        console.log('No geometry for place');
        return;
      }

      // Log place types to help refine filtering
      console.log('[VenueMapStep] Selected place:', {
        name: place.name,
        types: place.types,
        placeId: place.place_id
      });

      const venue: Venue = {
        id: place.place_id || '',
        name: place.name || '',
        address: place.formatted_address || '',
        location: {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        },
        googlePlaceId: place.place_id,
        validated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      handleSelectVenue(venue);
    });

    autocompleteRef.current = autocomplete;
  }, [isLoaded, map]);

  const handleSelectVenue = useCallback((venue: Venue) => {
    setSelectedVenue(venue);
    onUpdate({
      venue,
      venueName: venue.name,
      venueLocation: venue.location,
    });

    // Center map on selected venue
    if (map) {
      map.setCenter(venue.location);
      map.setZoom(15);
    }

    // Clear search input
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }

    // Clear old markers
    markers.forEach(m => m.setMap(null));

    // Add a single marker for selected venue
    const marker = new google.maps.Marker({
      position: venue.location,
      map,
      title: venue.name,
      icon: {
        url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
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
          className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-orange-500 focus:outline-none shadow-md caret-gray-900 dark:caret-white"
        />
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
