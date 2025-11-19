// src/components/wizard/steps/VenueMapStep.tsx
// Google Maps interface with pin selection for venue search

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { EventWizardFormData, Venue } from '@/lib/types';
import { useGoogleMaps } from '@/components/providers/GoogleMapsProvider';
import { searchVenues } from '@/lib/utils/venue-search';

interface VenueMapStepProps {
  formData: EventWizardFormData;
  onUpdate: (data: Partial<EventWizardFormData>) => void;
  onNext: () => void;
}

export function VenueMapStep({ formData, onUpdate, onNext }: VenueMapStepProps) {
  const { isLoaded, loadGoogleMaps } = useGoogleMaps();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(formData.venue);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  const mapRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

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

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const mapCenter = map?.getCenter();
        const center = mapCenter ? { lat: mapCenter.lat(), lng: mapCenter.lng() } : undefined;

        const searchResults = await searchVenues(query, center || { lat: 53.0, lng: -2.0 });
        // Combine BNDY venues with Google venues for display
        const allVenues = [...searchResults.bndyVenues];
        setResults(allVenues);

        // Clear old markers
        markers.forEach(m => m.setMap(null));

        // Add new markers
        const newMarkers = allVenues.map((venue: Venue, index: number) => {
          const marker = new google.maps.Marker({
            position: venue.location,
            map,
            title: venue.name,
            label: {
              text: String(index + 1),
              color: 'white',
            },
            animation: google.maps.Animation.DROP,
          });

          marker.addListener('click', () => {
            handleSelectVenue(venue);
          });

          return marker;
        });

        setMarkers(newMarkers);

        // Fit map to show all results
        if (allVenues.length > 0 && map) {
          const bounds = new google.maps.LatLngBounds();
          allVenues.forEach((v: Venue) => bounds.extend(v.location));
          map.fitBounds(bounds);
        }
      } catch (err) {
        console.error('Venue search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, map]);

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

    // Clear search results and markers
    setQuery('');
    setResults([]);
    markers.forEach(m => m.setMap(null));
    setMarkers([]);

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
    <div className="relative h-[calc(100vh-200px)]">
      {/* Map Container */}
      <div ref={mapRef} className="h-full w-full" />

      {/* Search Box Overlay */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="bg-card shadow-lg rounded-lg">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a venue..."
            className="w-full px-4 py-3 rounded-lg bg-background border-2 border-border text-foreground placeholder-muted-foreground focus:border-orange-500 focus:outline-none"
          />

          {isSearching && (
            <div className="px-4 py-2 text-sm text-muted-foreground">
              Searching...
            </div>
          )}
        </div>
      </div>

      {/* Selected Venue Card */}
      {selectedVenue && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
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
