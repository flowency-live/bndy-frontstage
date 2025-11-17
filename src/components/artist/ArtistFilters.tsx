'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';

interface ArtistFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  locationFilter: string;
  onLocationChange: (value: string) => void;
  artistTypeFilter: string;
  onArtistTypeChange: (value: string) => void;
  groupBy: 'alpha' | 'type' | 'location' | 'genre';
  onGroupByChange: (value: 'alpha' | 'type' | 'location' | 'genre') => void;
  genreFilter: string | string[];  // Support both single and multiple genres
  onGenreChange: (value: string | string[]) => void;
  acousticFilter: string;  // 'all' | 'acoustic' | 'non-acoustic'
  onAcousticChange: (value: string) => void;
  actTypeFilter: string;  // '' | 'originals' | 'covers' | 'tribute'
  onActTypeChange: (value: string) => void;
  availableLocations: string[];
  availableArtistTypes: string[];
  availableGenres: string[];
  onClearFilters: () => void;
}

export default function ArtistFilters({
  searchQuery,
  onSearchChange,
  locationFilter,
  onLocationChange,
  artistTypeFilter,
  onArtistTypeChange,
  groupBy,
  onGroupByChange,
  genreFilter,
  onGenreChange,
  acousticFilter,
  onAcousticChange,
  actTypeFilter,
  onActTypeChange,
  availableLocations,
  availableArtistTypes,
  availableGenres,
  onClearFilters,
}: ArtistFiltersProps) {
  const genreArray = Array.isArray(genreFilter) ? genreFilter : (genreFilter ? [genreFilter] : []);
  const hasActiveFilters = locationFilter || artistTypeFilter || genreArray.length > 0 || (acousticFilter && acousticFilter !== 'all') || actTypeFilter;
  const [genreDropdownOpen, setGenreDropdownOpen] = useState(false);
  const genreDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (genreDropdownRef.current && !genreDropdownRef.current.contains(event.target as Node)) {
        setGenreDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleGenre = (genre: string) => {
    const newGenres = genreArray.includes(genre)
      ? genreArray.filter(g => g !== genre)
      : [...genreArray, genre];
    onGenreChange(newGenres);
  };

  return (
    <div className="mb-4 space-y-3">
      {/* Filter Dropdowns Row */}
      <div className="flex flex-wrap gap-2">
        {/* Artist Type Filter */}
        <div className="flex-1 min-w-[140px] relative">
          <select
            value={artistTypeFilter}
            onChange={(e) => onArtistTypeChange(e.target.value)}
            className="w-full px-3 py-2 pr-8 text-sm border-2 border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer hover:border-primary/50 appearance-none"
          >
            <option value="">All Types</option>
            {availableArtistTypes.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>

        {/* Location Filter */}
        <div className="flex-1 min-w-[140px] relative">
          <select
            value={locationFilter}
            onChange={(e) => onLocationChange(e.target.value)}
            className="w-full px-3 py-2 pr-8 text-sm border-2 border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer hover:border-primary/50 appearance-none"
          >
            <option value="">All Locations</option>
            {availableLocations.map(location => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>

        {/* Genre Filter - Custom Dropdown with Checkboxes */}
        <div className="flex-1 min-w-[120px] relative" ref={genreDropdownRef}>
          <button
            type="button"
            onClick={() => setGenreDropdownOpen(!genreDropdownOpen)}
            className="w-full px-3 py-2 pr-8 text-sm border-2 border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer hover:border-primary/50 text-left flex items-center justify-between"
          >
            <span className="truncate">
              {genreArray.length === 0 ? 'All Genres' : `${genreArray.length} Genre${genreArray.length > 1 ? 's' : ''}`}
            </span>
            <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0 text-muted-foreground" />
          </button>
          {genreArray.length > 0 && (
            <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold pointer-events-none">
              {genreArray.length}
            </div>
          )}
          {genreDropdownOpen && (
            <div className="absolute z-50 mt-1 w-full bg-background border-2 border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
              <div className="p-2">
                {availableGenres.map(genre => (
                  <label
                    key={genre}
                    className="flex items-center px-2 py-1.5 hover:bg-muted rounded cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={genreArray.includes(genre)}
                      onChange={() => toggleGenre(genre)}
                      className="mr-2 rounded border-input text-primary focus:ring-primary"
                    />
                    <span className="text-foreground">{genre}</span>
                  </label>
                ))}
              </div>
              {genreArray.length > 0 && (
                <div className="border-t border-border p-2">
                  <button
                    type="button"
                    onClick={() => onGenreChange([])}
                    className="w-full px-2 py-1 text-xs text-primary hover:text-primary/80 font-medium"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Acoustic Filter */}
        <div className="flex-1 min-w-[120px] relative">
          <select
            value={acousticFilter || 'all'}
            onChange={(e) => onAcousticChange(e.target.value)}
            className="w-full px-3 py-2 pr-8 text-sm border-2 border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer hover:border-primary/50 appearance-none"
          >
            <option value="all">All Acts</option>
            <option value="acoustic">Acoustic Only</option>
            <option value="non-acoustic">Non-Acoustic</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>

        {/* Act Type Filter */}
        <div className="flex-1 min-w-[120px] relative">
          <select
            value={actTypeFilter}
            onChange={(e) => onActTypeChange(e.target.value)}
            className="w-full px-3 py-2 pr-8 text-sm border-2 border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer hover:border-primary/50 appearance-none"
          >
            <option value="">All Act Types</option>
            <option value="originals">Originals</option>
            <option value="covers">Covers</option>
            <option value="tribute">Tribute</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>

        {/* Group By */}
        <div className="flex-1 min-w-[140px] relative">
          <select
            value={groupBy}
            onChange={(e) => onGroupByChange(e.target.value as 'alpha' | 'type' | 'location' | 'genre')}
            className="w-full px-3 py-2 pr-8 text-sm border-2 border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer hover:border-primary/50 appearance-none"
          >
            <option value="alpha">Group: A-Z</option>
            <option value="type">Group: Type</option>
            <option value="location">Group: Location</option>
            <option value="genre">Group: Genre</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="px-3 py-2 text-sm border-2 border-border bg-background text-foreground hover:bg-muted hover:border-primary/50 rounded-lg whitespace-nowrap transition-all"
            title="Clear filters"
          >
            <X className="w-4 h-4 inline mr-1" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </div>

      {/* Search Row */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search artists by name..."
            className="w-full px-3 py-2 pl-10 pr-8 text-sm border-2 border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all hover:border-primary/50"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
