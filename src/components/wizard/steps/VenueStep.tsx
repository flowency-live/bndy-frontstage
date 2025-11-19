// src/components/wizard/steps/VenueStep.tsx
// Clean, idiot-proof venue search with background deduplication

'use client';

import { useState, useEffect, useRef } from 'react';
import type { EventWizardFormData, Venue } from '@/lib/types';
import { searchVenues } from '@/lib/utils/venue-search';

interface VenueStepProps {
  formData: EventWizardFormData;
  onUpdate: (data: Partial<EventWizardFormData>) => void;
  onNext: () => void;
}

export function VenueStep({ formData, onUpdate, onNext }: VenueStepProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Venue[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setError(null);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const searchResults = await searchVenues(query, formData.venueLocation || undefined);
        // Show unified results (BNDY venues already matched to Google Places)
        setResults(searchResults.venues);
        setShowResults(true);
        setError(null);
      } catch (err) {
        console.error('Venue search error:', err);
        setError('Search failed. Please try again.');
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, formData.venueLocation]);

  const handleSelectVenue = (venue: Venue) => {
    onUpdate({
      venue,
      venueName: venue.name,
      venueLocation: venue.location,
    });
    setQuery('');
    setShowResults(false);
    setResults([]);
  };

  const handleClearVenue = () => {
    onUpdate({
      venue: null,
      venueName: '',
      venueLocation: null,
    });
    setQuery('');
    setResults([]);
  };

  // If venue already selected, show confirmation view
  if (formData.venue) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Venue Selected</h2>
          </div>

          {/* Selected Venue Card */}
          <div className="rounded-lg border-2 border-orange-500 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-900">{formData.venue.name}</h3>
              <p className="mt-1 text-sm text-gray-600">{formData.venue.address}</p>
              {formData.venue.city && (
                <p className="text-sm text-gray-600">{formData.venue.city}</p>
              )}
            </div>

            <button
              onClick={handleClearVenue}
              className="w-full rounded-lg border-2 border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-orange-500 hover:text-orange-600"
            >
              Change Venue
            </button>
          </div>

          {/* Continue Button */}
          <button
            onClick={onNext}
            className="w-full rounded-lg bg-orange-500 px-6 py-4 font-semibold text-white transition-colors hover:bg-orange-600"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // Search view
  return (
    <div className="flex min-h-[60vh] flex-col items-center p-6 pt-12">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Find Your Venue</h2>
          <p className="mt-2 text-gray-600">Search for the venue hosting your event</p>
        </div>

        {/* Search Input */}
        <div className="relative" ref={dropdownRef}>
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a venue..."
              className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 pl-12 text-gray-900 placeholder-gray-400 transition-colors focus:border-orange-500 focus:outline-none"
              autoFocus
            />
            {/* Search Icon */}
            <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
              {isSearching ? (
                <svg className="h-5 w-5 animate-spin text-orange-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              )}
            </div>
          </div>

          {/* Results Dropdown */}
          {showResults && (
            <div className="absolute z-50 mt-2 max-h-96 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
              {results.length === 0 && !isSearching && (
                <div className="p-4 text-center text-sm text-gray-500">
                  No venues found. Try a different search.
                </div>
              )}

              {results.map((venue, index) => (
                <button
                  key={venue.id || `result-${index}`}
                  onClick={() => handleSelectVenue(venue)}
                  className="w-full border-b border-gray-100 p-4 text-left transition-colors hover:bg-orange-50 last:border-b-0"
                >
                  <div className="font-medium text-gray-900">{venue.name}</div>
                  <div className="mt-1 text-sm text-gray-600">{venue.address}</div>
                  {venue.city && <div className="text-sm text-gray-500">{venue.city}</div>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Helper Text */}
        <div className="text-center text-sm text-gray-500">
          {query.trim().length === 0 ? (
            <p>Start typing to search for venues</p>
          ) : query.trim().length < 2 ? (
            <p>Keep typing...</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
