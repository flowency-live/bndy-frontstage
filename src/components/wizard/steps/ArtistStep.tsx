// src/components/wizard/steps/ArtistStep.tsx
// Artist selection with location-weighted search

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import type { EventWizardFormData, Artist } from '@/lib/types';
import { useDebounce } from 'use-debounce';

interface ArtistStepProps {
  formData: EventWizardFormData;
  onUpdate: (data: Partial<EventWizardFormData>) => void;
  onNext: () => void;
}

interface SearchResult extends Artist {
  distance?: number; // Distance in km from venue
}

// Haversine formula to calculate distance between two coordinates in km
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function ArtistStep({ formData, onUpdate, onNext }: ArtistStepProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Search artists with location-based weighting
  const searchArtists = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);

    try {
      const response = await fetch(
        `https://api.bndy.co.uk/api/artists/search?name=${encodeURIComponent(query)}`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        console.error('[ArtistStep] Search failed:', response.status);
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      const data = await response.json();
      const artists = data.matches || [];

      if (artists.length === 0) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      // If venue is selected, calculate distances and sort by proximity
      if (formData.venue?.location) {
        const venueLocation = formData.venue.location;

        // Calculate distance for each artist
        const artistsWithDistance = artists.map((artist: Artist) => {
          // Try to parse location string if it exists
          // Backend returns location as a string like "Manchester" or "Stoke on Trent"
          // For now, we'll just mark artists with matching location text
          let distance: number | undefined;

          if (artist.location && formData.venue?.city) {
            // Simple text match for location weighting
            const artistLocation = artist.location.toLowerCase().trim();
            const venueCity = formData.venue.city.toLowerCase().trim();

            if (artistLocation.includes(venueCity) || venueCity.includes(artistLocation)) {
              distance = 0; // Same location - highest priority
            } else {
              distance = 999; // Different location - lower priority
            }
          } else {
            distance = 999; // No location data - lowest priority
          }

          return {
            ...artist,
            distance,
          } as SearchResult;
        });

        // Sort by distance (closest first)
        artistsWithDistance.sort((a: SearchResult, b: SearchResult) => {
          const distA = a.distance ?? 999;
          const distB = b.distance ?? 999;
          return distA - distB;
        });

        setSearchResults(artistsWithDistance);
      } else {
        // No venue selected - just return results as-is
        setSearchResults(artists);
      }
    } catch (error) {
      console.error('[ArtistStep] Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [formData.venue]);

  // Trigger search when debounced term changes
  useEffect(() => {
    if (debouncedSearchTerm) {
      searchArtists(debouncedSearchTerm);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [debouncedSearchTerm, searchArtists]);

  const handleSelectArtist = useCallback((artist: Artist) => {
    // Add artist to selection
    const updatedArtists = [...formData.artists, artist];
    onUpdate({
      artists: updatedArtists,
      isOpenMic: false,
    });

    // Clear search
    setSearchTerm('');
    setShowResults(false);
    setSearchResults([]);
  }, [formData.artists, onUpdate]);

  const handleRemoveArtist = useCallback((artistId: string) => {
    const updatedArtists = formData.artists.filter(a => a.id !== artistId);
    onUpdate({ artists: updatedArtists });
  }, [formData.artists, onUpdate]);

  const handleOpenMic = () => {
    onUpdate({ isOpenMic: true });
  };

  const handleContinue = () => {
    if (formData.artists.length > 0 || formData.isOpenMic) {
      onNext();
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col p-4">
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Select Artists
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {formData.isOpenMic
              ? 'Search for optional host artist(s) for this open mic night'
              : 'Search for artists or mark as open mic night'}
          </p>
        </div>

        {/* Search Box */}
        <div className="relative mb-6">
          <input
            ref={searchInputRef}
            type="text"
            placeholder={formData.isOpenMic ? "Search for host artist (optional)..." : "Search for an artist..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => {
              if (searchResults.length > 0) {
                setShowResults(true);
              }
            }}
            className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-orange-500 focus:outline-none shadow-md caret-gray-900 dark:caret-white"
          />

          {/* Search Results Tiles */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-96 overflow-y-auto z-30 p-3">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {searchResults.map((artist, index) => {
                  const isSelected = formData.artists.some(a => a.id === artist.id);
                  const isNearVenue = artist.distance === 0;

                  return (
                    <div key={`${artist.id}-${index}`} className="flex flex-col">
                      <button
                        onClick={() => handleSelectArtist(artist)}
                        disabled={isSelected}
                        className="group relative aspect-square rounded-md overflow-hidden bg-muted shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-1"
                      >
                        {/* Artist Image or Initials */}
                        {artist.profileImageUrl ? (
                          <Image
                            src={artist.profileImageUrl}
                            alt={`${artist.name} profile picture`}
                            fill
                            className="object-cover transition-opacity duration-300"
                            sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16.66vw"
                          />
                        ) : (
                          <div
                            className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg"
                            style={{ backgroundColor: artist.displayColour || '#3b82f6' }}
                          >
                            {artist.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}

                        {/* Near Venue Badge */}
                        {isNearVenue && (
                          <div className="absolute top-1 right-1 bg-cyan-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-md">
                            Near
                          </div>
                        )}

                        {/* Selected Checkmark */}
                        {isSelected && (
                          <div className="absolute top-1 left-1 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}

                        {/* Selection Border */}
                        {isSelected && (
                          <div className="absolute inset-0 border-3 border-green-500 rounded-md pointer-events-none"></div>
                        )}
                      </button>

                      {/* Artist Name */}
                      <div className="text-center text-xs font-medium text-gray-900 dark:text-white truncate px-1">
                        {artist.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* No Results Message */}
          {showResults && !isSearching && searchTerm.length >= 2 && searchResults.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 z-30">
              <p className="text-center text-gray-600 dark:text-gray-400">
                No artists found for &quot;{searchTerm}&quot;
              </p>
            </div>
          )}

          {/* Loading Indicator */}
          {isSearching && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 z-30">
              <p className="text-center text-gray-600 dark:text-gray-400">Searching...</p>
            </div>
          )}
        </div>

        {/* Open Mic Indicator */}
        {formData.isOpenMic && (
          <div className="mb-4 bg-blue-600 text-white p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Open Mic Night</div>
                <div className="text-sm opacity-90">
                  {formData.artists.length > 0 ? 'Hosted by selected artist(s)' : 'No host artist'}
                </div>
              </div>
              <button
                onClick={() => onUpdate({ isOpenMic: false })}
                className="hover:opacity-75"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Selected Artists */}
        {formData.artists.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {formData.isOpenMic ? 'Host Artist(s)' : `Selected Artists (${formData.artists.length})`}
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {formData.artists.map((artist) => (
                <div
                  key={artist.id}
                  className="group relative aspect-square rounded-md overflow-hidden bg-muted shadow-md border-2 border-cyan-500"
                >
                  {/* Artist Image or Initials */}
                  {artist.profileImageUrl ? (
                    <Image
                      src={artist.profileImageUrl}
                      alt={`${artist.name} profile picture`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16.66vw"
                    />
                  ) : (
                    <div
                      className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: artist.displayColour || '#3b82f6' }}
                    >
                      {artist.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}

                  {/* Info Overlay (Always Visible) */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-2">
                    <div className="text-white text-xs font-semibold truncate">
                      {artist.name}
                    </div>
                    {artist.location && (
                      <div className="text-white/80 text-[10px] truncate">
                        {artist.location}
                      </div>
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveArtist(artist.id)}
                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-md transition-colors z-10"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Open Mic Option */}
        {!formData.isOpenMic && (
          <div className="mb-6">
            <button
              onClick={handleOpenMic}
              className="w-full rounded-lg border-2 border-orange-500 px-6 py-3 text-orange-500 transition-colors hover:bg-orange-50 dark:hover:bg-orange-900/20"
            >
              This is an Open Mic Night
            </button>
          </div>
        )}
      </div>

      {/* Continue Button - Fixed at bottom */}
      {(formData.artists.length > 0 || formData.isOpenMic) && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleContinue}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
