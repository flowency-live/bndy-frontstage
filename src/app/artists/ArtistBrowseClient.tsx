'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Artist } from '@/lib/types';
import { getAllArtists, searchArtists } from '@/lib/services/artist-service-new';
import ArtistCard from '@/components/artist/ArtistCard';
import SearchAndFilters from '@/components/artist/SearchAndFilters';

export default function ArtistBrowseClient() {
  const [allArtists, setAllArtists] = useState<Artist[]>([]);
  const [displayedArtists, setDisplayedArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [artistTypeFilter, setArtistTypeFilter] = useState<string>('');

  // Load saved search state from sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = sessionStorage.getItem('artistBrowseState');
      if (savedState) {
        try {
          const { searchQuery: savedQuery, locationFilter: savedLocation, artistTypeFilter: savedType } = JSON.parse(savedState);
          if (savedQuery) setSearchQuery(savedQuery);
          if (savedLocation) setLocationFilter(savedLocation);
          if (savedType) setArtistTypeFilter(savedType);
        } catch (error) {
          console.error('Error loading saved search state:', error);
        }
      }
    }
  }, []);

  // Save search state to sessionStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const state = {
        searchQuery,
        locationFilter,
        artistTypeFilter,
      };
      sessionStorage.setItem('artistBrowseState', JSON.stringify(state));
    }
  }, [searchQuery, locationFilter, artistTypeFilter]);

  // Load all artists on component mount
  useEffect(() => {
    const loadArtists = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedArtists = await getAllArtists();
        setAllArtists(fetchedArtists);
        setDisplayedArtists(fetchedArtists);
      } catch (err) {
        console.error('Error loading artists:', err);
        setError('Failed to load artists. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadArtists();
  }, []);

  // Perform search when search query changes
  const performSearch = useCallback(async (query: string, location?: string) => {
    if (!query || query.trim().length < 2) {
      // If no search query, show all artists with local filtering
      const filtered = allArtists.filter(artist => {
        const matchesLocation = !location || 
          (artist.location && artist.location.toLowerCase().includes(location.toLowerCase()));
        const matchesType = !artistTypeFilter || 
          artist.artist_type === artistTypeFilter;
        return matchesLocation && matchesType;
      });
      setDisplayedArtists(filtered);
      return;
    }

    try {
      setSearching(true);
      setError(null);
      const searchResults = await searchArtists(query, location);
      
      // Apply additional local filtering for artist type
      const filtered = searchResults.filter(artist => {
        const matchesType = !artistTypeFilter || 
          artist.artist_type === artistTypeFilter;
        return matchesType;
      });
      
      setDisplayedArtists(filtered);
    } catch (err) {
      console.error('Error searching artists:', err);
      setError('Failed to search artists. Please try again.');
      // Fallback to local filtering
      const filtered = allArtists.filter(artist => {
        const matchesSearch = artist.name.toLowerCase().includes(query.toLowerCase());
        const matchesLocation = !location || 
          (artist.location && artist.location.toLowerCase().includes(location.toLowerCase()));
        const matchesType = !artistTypeFilter || 
          artist.artist_type === artistTypeFilter;
        return matchesSearch && matchesLocation && matchesType;
      });
      setDisplayedArtists(filtered);
    } finally {
      setSearching(false);
    }
  }, [allArtists, artistTypeFilter]);

  // Effect to trigger search when query or location changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery, locationFilter);
    }, 300); // Debounce search by 300ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery, locationFilter, performSearch]);

  // Effect to re-filter when artist type changes
  useEffect(() => {
    if (searchQuery && searchQuery.trim().length >= 2) {
      performSearch(searchQuery, locationFilter);
    } else {
      // Local filtering when no search query
      const filtered = allArtists.filter(artist => {
        const matchesLocation = !locationFilter || 
          (artist.location && artist.location.toLowerCase().includes(locationFilter.toLowerCase()));
        const matchesType = !artistTypeFilter || 
          artist.artist_type === artistTypeFilter;
        return matchesLocation && matchesType;
      });
      setDisplayedArtists(filtered);
    }
  }, [artistTypeFilter, allArtists, searchQuery, locationFilter, performSearch]);

  // Get unique locations for filter dropdown
  const availableLocations = useMemo(() => {
    const locations = allArtists
      .map(artist => artist.location)
      .filter((location): location is string => Boolean(location))
      .filter((location, index, array) => array.indexOf(location) === index)
      .sort();
    return locations;
  }, [allArtists]);

  // Get unique artist types for filter dropdown
  const availableArtistTypes = useMemo(() => {
    const types = allArtists
      .map(artist => artist.artist_type)
      .filter((type): type is NonNullable<Artist['artist_type']> => Boolean(type))
      .filter((type, index, array) => array.indexOf(type) === index)
      .sort();
    return types;
  }, [allArtists]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted-foreground">Loading artists...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-destructive mb-4">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <SearchAndFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        locationFilter={locationFilter}
        onLocationChange={setLocationFilter}
        artistTypeFilter={artistTypeFilter}
        onArtistTypeChange={setArtistTypeFilter}
        availableLocations={availableLocations}
        availableArtistTypes={availableArtistTypes}
        onClearFilters={() => {
          setSearchQuery('');
          setLocationFilter('');
          setArtistTypeFilter('');
          // Clear saved state
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('artistBrowseState');
          }
        }}
      />

      {/* Results count */}
      <div className="text-sm text-muted-foreground flex items-center">
        {searching && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
        )}
        {displayedArtists.length === allArtists.length 
          ? `Showing all ${allArtists.length} artists`
          : `Showing ${displayedArtists.length} of ${allArtists.length} artists`
        }
        {searching && <span className="ml-2 text-primary">Searching...</span>}
      </div>

      {/* Artist Grid */}
      {displayedArtists.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {displayedArtists.map(artist => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {searchQuery || locationFilter || artistTypeFilter 
              ? 'No artists match your search criteria'
              : 'No artists found'
            }
          </div>
          {(searchQuery || locationFilter || artistTypeFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setLocationFilter('');
                setArtistTypeFilter('');
                // Clear saved state
                if (typeof window !== 'undefined') {
                  sessionStorage.removeItem('artistBrowseState');
                }
              }}
              className="text-primary hover:text-primary/80 underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}