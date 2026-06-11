'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Artist } from '@/lib/types';
import { getAllArtists } from '@/lib/services/artist-service-new';
import { fuzzyMatch } from '@/lib/utils/fuzzy-search';
import ArtistCard from '@/components/artist/ArtistCard';
import ArtistFilters from '@/components/artist/ArtistFilters';
import { useAllPublicEvents } from '@/hooks/useAllPublicEvents';

export default function ArtistBrowseClient() {
  const [allArtists, setAllArtists] = useState<Artist[]>([]);
  const [displayedArtists, setDisplayedArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [artistTypeFilter, setArtistTypeFilter] = useState<string>('');
  const [genreFilter, setGenreFilter] = useState<string[]>([]);
  const [acousticFilter, setAcousticFilter] = useState<string>('all');
  const [actTypeFilter, setActTypeFilter] = useState<string>('');
  const [groupBy, setGroupBy] = useState<'alpha' | 'type' | 'location' | 'genre'>('alpha');

  // Artists with upcoming gigs get the pink "gigging" dot (map language)
  const todayStr = useMemo(() => new Date().toLocaleDateString('en-CA'), []);
  const { data: futureEvents = [] } = useAllPublicEvents({ startDate: todayStr });
  const giggingArtistIds = useMemo(() => {
    const ids = new Set<string>();
    futureEvents.forEach((event) => {
      (event.artistIds || []).forEach((id) => ids.add(id));
    });
    return ids;
  }, [futureEvents]);

  // Load saved search state from sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = sessionStorage.getItem('artistBrowseState');
      if (savedState) {
        try {
          const {
            searchQuery: savedQuery,
            locationFilter: savedLocation,
            artistTypeFilter: savedType,
            genreFilter: savedGenre,
            acousticFilter: savedAcoustic,
            actTypeFilter: savedActType,
            groupBy: savedGroupBy
          } = JSON.parse(savedState);
          if (savedQuery && typeof savedQuery === 'string') setSearchQuery(savedQuery);
          if (savedLocation && typeof savedLocation === 'string') setLocationFilter(savedLocation);
          // Only restore filters if they're valid non-empty strings (not "null", "undefined", etc)
          if (savedType && typeof savedType === 'string' && savedType.trim() !== '' && savedType !== 'null' && savedType !== 'undefined') {
            setArtistTypeFilter(savedType);
          }
          if (savedGenre) {
            if (Array.isArray(savedGenre)) {
              setGenreFilter(savedGenre);
            } else if (typeof savedGenre === 'string' && savedGenre !== 'null' && savedGenre !== 'undefined' && savedGenre.trim() !== '') {
              setGenreFilter([savedGenre]);
            }
          }
          if (savedAcoustic && typeof savedAcoustic === 'string' && savedAcoustic !== 'null' && savedAcoustic !== 'undefined') {
            setAcousticFilter(savedAcoustic);
          }
          if (savedActType && typeof savedActType === 'string' && savedActType !== 'null' && savedActType !== 'undefined') {
            setActTypeFilter(savedActType);
          }
          if (savedGroupBy && ['alpha', 'type', 'location', 'genre'].includes(savedGroupBy)) {
            setGroupBy(savedGroupBy);
          }
        } catch (error) {
          console.error('Error loading saved search state:', error);
          // Clear corrupted state
          sessionStorage.removeItem('artistBrowseState');
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
        genreFilter,
        acousticFilter,
        actTypeFilter,
        groupBy,
      };
      sessionStorage.setItem('artistBrowseState', JSON.stringify(state));
    }
  }, [searchQuery, locationFilter, artistTypeFilter, genreFilter, acousticFilter, actTypeFilter, groupBy]);

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

  // Perform search when search query changes - uses local fuzzy matching for better UX
  const performSearch = useCallback(async (query: string, location?: string) => {
    // Use local fuzzy filtering for all searches (faster and supports prefix stripping)
    const filtered = allArtists.filter(artist => {
      // Name search with fuzzy matching (handles "The"/"A"/"An" prefixes and typos)
      const matchesSearch = !query || query.trim().length < 2 || fuzzyMatch(query, artist.name);
      const matchesLocation = !location ||
        (artist.location && artist.location.toLowerCase().includes(location.toLowerCase()));
      const matchesType = !artistTypeFilter ||
        artist.artist_type === artistTypeFilter;
      const matchesGenre = genreFilter.length === 0 ||
        (artist.genres && artist.genres.some(g => genreFilter.includes(g)));
      const matchesAcoustic = acousticFilter === 'all' ||
        (acousticFilter === 'acoustic' && artist.acoustic === true) ||
        (acousticFilter === 'non-acoustic' && !artist.acoustic);
      const matchesActType = !actTypeFilter ||
        (artist.actType && artist.actType.includes(actTypeFilter as any));
      return matchesSearch && matchesLocation && matchesType && matchesGenre && matchesAcoustic && matchesActType;
    });
    setDisplayedArtists(filtered);

    // No need for backend search - we have all artists loaded and fuzzy matching locally
    // This is faster and provides better UX with prefix stripping and typo tolerance
  }, [allArtists, artistTypeFilter, genreFilter, acousticFilter, actTypeFilter]);

  // Effect to trigger search when query or location changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery, locationFilter);
    }, 300); // Debounce search by 300ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery, locationFilter, performSearch]);

  // Effect to re-filter when filters change - performSearch handles all cases with fuzzy matching
  useEffect(() => {
    performSearch(searchQuery, locationFilter);
  }, [artistTypeFilter, genreFilter, acousticFilter, actTypeFilter, allArtists, searchQuery, locationFilter, performSearch]);

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

  // Get unique genres for filter dropdown
  const availableGenres = useMemo(() => {
    const genres = allArtists
      .flatMap(artist => artist.genres || [])
      .filter((genre, index, array) => array.indexOf(genre) === index)
      .sort();
    return genres;
  }, [allArtists]);

  // Group artists based on groupBy state
  const groupedArtists = useMemo(() => {
    const groups: { [key: string]: Artist[] } = {};

    displayedArtists.forEach(artist => {
      let groupKey = '';

      switch (groupBy) {
        case 'alpha':
          const firstChar = artist.name.charAt(0).toUpperCase();
          // Group all numbers under "0-9"
          groupKey = /[0-9]/.test(firstChar) ? '0-9' : firstChar;
          break;
        case 'type':
          groupKey = artist.artist_type ? artist.artist_type.charAt(0).toUpperCase() + artist.artist_type.slice(1) : 'Unknown';
          break;
        case 'location':
          groupKey = artist.location || 'Unknown';
          break;
        case 'genre':
          // Artists can have multiple genres, so add to first genre or Unknown
          groupKey = artist.genres && artist.genres.length > 0 ? artist.genres[0] : 'Unknown';
          break;
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(artist);
    });

    // Sort groups alphabetically by key
    const sortedGroups: { [key: string]: Artist[] } = {};
    Object.keys(groups).sort().forEach(key => {
      sortedGroups[key] = groups[key];
    });

    return sortedGroups;
  }, [displayedArtists, groupBy]);

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
      <div className="bndy-filterbar">
      <ArtistFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        locationFilter={locationFilter}
        onLocationChange={setLocationFilter}
        artistTypeFilter={artistTypeFilter}
        onArtistTypeChange={setArtistTypeFilter}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        genreFilter={genreFilter}
        onGenreChange={(value) => setGenreFilter(Array.isArray(value) ? value : (value ? [value] : []))}
        acousticFilter={acousticFilter}
        onAcousticChange={setAcousticFilter}
        actTypeFilter={actTypeFilter}
        onActTypeChange={setActTypeFilter}
        availableLocations={availableLocations}
        availableArtistTypes={availableArtistTypes}
        availableGenres={availableGenres}
        onClearFilters={() => {
          setSearchQuery('');
          setLocationFilter('');
          setArtistTypeFilter('');
          setGenreFilter([]);
          setAcousticFilter('all');
          setActTypeFilter('');
          // Clear saved state
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('artistBrowseState');
          }
        }}
      />
      </div>

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

      {/* A-Z jump rail (alpha grouping only) */}
      {groupBy === 'alpha' && displayedArtists.length > 0 && (
        <nav className="bndy-alpha-rail hidden md:flex" aria-label="Jump to letter">
          {Object.keys(groupedArtists).map((letter) => (
            <button
              key={letter}
              type="button"
              onClick={() =>
                document
                  .getElementById(`artist-group-${letter}`)
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            >
              {letter === '0-9' ? '#' : letter}
            </button>
          ))}
        </nav>
      )}

      {/* Artist Grid - Grouped */}
      {displayedArtists.length > 0 ? (
        <div className="space-y-10">
          {Object.entries(groupedArtists).map(([groupKey, artists]) => (
            <div key={groupKey} id={`artist-group-${groupKey}`} style={{ scrollMarginTop: '170px' }}>
              {/* Group Header */}
              <h2 className="bndy-letter-head">
                {groupKey}
              </h2>
              {/* Group Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 sm:gap-5 md:gap-6">
                {artists.map(artist => (
                  <ArtistCard
                    key={artist.id}
                    artist={artist}
                    hasUpcomingGigs={giggingArtistIds.has(artist.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {searchQuery || locationFilter || artistTypeFilter || genreFilter.length > 0 || (acousticFilter && acousticFilter !== 'all') || actTypeFilter
              ? 'No artists match your search criteria'
              : 'No artists found'
            }
          </div>
          {(searchQuery || locationFilter || artistTypeFilter || genreFilter.length > 0 || (acousticFilter && acousticFilter !== 'all') || actTypeFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setLocationFilter('');
                setArtistTypeFilter('');
                setGenreFilter([]);
                setAcousticFilter('all');
                setActTypeFilter('');
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