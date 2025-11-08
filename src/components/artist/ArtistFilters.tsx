'use client';

import { Search, X } from 'lucide-react';

interface ArtistFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  locationFilter: string;
  onLocationChange: (value: string) => void;
  artistTypeFilter: string;
  onArtistTypeChange: (value: string) => void;
  groupBy: 'alpha' | 'type' | 'location' | 'genre';
  onGroupByChange: (value: 'alpha' | 'type' | 'location' | 'genre') => void;
  genreFilter: string;
  onGenreChange: (value: string) => void;
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
  const hasActiveFilters = locationFilter || artistTypeFilter || genreFilter || (acousticFilter && acousticFilter !== 'all') || actTypeFilter;

  return (
    <div className="mb-4 space-y-3">
      {/* Filter Dropdowns Row */}
      <div className="flex flex-wrap gap-2">
        {/* Artist Type Filter */}
        <div className="flex-1 min-w-[140px]">
          <select
            value={artistTypeFilter}
            onChange={(e) => onArtistTypeChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border-2 border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer hover:border-primary/50"
          >
            <option value="">All Types</option>
            {availableArtistTypes.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Location Filter */}
        <div className="flex-1 min-w-[140px]">
          <select
            value={locationFilter}
            onChange={(e) => onLocationChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border-2 border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer hover:border-primary/50"
          >
            <option value="">All Locations</option>
            {availableLocations.map(location => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>
        </div>

        {/* Genre Filter */}
        <div className="flex-1 min-w-[120px]">
          <select
            value={genreFilter}
            onChange={(e) => onGenreChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border-2 border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer hover:border-primary/50"
          >
            <option value="">All Genres</option>
            {availableGenres.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
        </div>

        {/* Acoustic Filter */}
        <div className="flex-1 min-w-[120px]">
          <select
            value={acousticFilter || 'all'}
            onChange={(e) => onAcousticChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border-2 border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer hover:border-primary/50"
          >
            <option value="all">All Acts</option>
            <option value="acoustic">Acoustic Only</option>
            <option value="non-acoustic">Non-Acoustic</option>
          </select>
        </div>

        {/* Act Type Filter */}
        <div className="flex-1 min-w-[120px]">
          <select
            value={actTypeFilter}
            onChange={(e) => onActTypeChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border-2 border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer hover:border-primary/50"
          >
            <option value="">All Act Types</option>
            <option value="originals">Originals</option>
            <option value="covers">Covers</option>
            <option value="tribute">Tribute</option>
          </select>
        </div>

        {/* Group By */}
        <div className="flex-1 min-w-[140px]">
          <select
            value={groupBy}
            onChange={(e) => onGroupByChange(e.target.value as 'alpha' | 'type' | 'location' | 'genre')}
            className="w-full px-3 py-2 text-sm border-2 border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer hover:border-primary/50"
          >
            <option value="alpha">Group: A-Z</option>
            <option value="type">Group: Type</option>
            <option value="location">Group: Location</option>
            <option value="genre">Group: Genre</option>
          </select>
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
