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

  return (
    <div className="mb-4 space-y-3">
      {/* Filter Dropdowns Row */}
      <div className="flex flex-wrap gap-2">
        {/* Artist Type Filter */}
        <div className="flex-1 min-w-[140px] relative">
          <select
            value={artistTypeFilter}
            onChange={(e) => onArtistTypeChange(e.target.value)}
            className="w-full px-3 py-2 pr-8 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all cursor-pointer hover:border-orange-400 appearance-none"
            style={{backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25rem'}}
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
        <div className="flex-1 min-w-[140px] relative">
          <select
            value={locationFilter}
            onChange={(e) => onLocationChange(e.target.value)}
            className="w-full px-3 py-2 pr-8 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all cursor-pointer hover:border-orange-400 appearance-none"
            style={{backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25rem'}}
          >
            <option value="">All Locations</option>
            {availableLocations.map(location => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>
        </div>

        {/* Genre Filter - Multi-select */}
        <div className="flex-1 min-w-[120px] relative">
          <select
            multiple
            value={genreArray}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, option => option.value);
              onGenreChange(selected);
            }}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all cursor-pointer hover:border-orange-400"
            size={1}
            title={genreArray.length > 0 ? `Selected: ${genreArray.join(', ')}` : 'All Genres (hold Ctrl/Cmd to select multiple)'}
          >
            {availableGenres.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
          {genreArray.length > 0 && (
            <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {genreArray.length}
            </div>
          )}
        </div>

        {/* Acoustic Filter */}
        <div className="flex-1 min-w-[120px] relative">
          <select
            value={acousticFilter || 'all'}
            onChange={(e) => onAcousticChange(e.target.value)}
            className="w-full px-3 py-2 pr-8 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all cursor-pointer hover:border-orange-400 appearance-none"
            style={{backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25rem'}}
          >
            <option value="all">All Acts</option>
            <option value="acoustic">Acoustic Only</option>
            <option value="non-acoustic">Non-Acoustic</option>
          </select>
        </div>

        {/* Act Type Filter */}
        <div className="flex-1 min-w-[120px] relative">
          <select
            value={actTypeFilter}
            onChange={(e) => onActTypeChange(e.target.value)}
            className="w-full px-3 py-2 pr-8 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all cursor-pointer hover:border-orange-400 appearance-none"
            style={{backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25rem'}}
          >
            <option value="">All Act Types</option>
            <option value="originals">Originals</option>
            <option value="covers">Covers</option>
            <option value="tribute">Tribute</option>
          </select>
        </div>

        {/* Group By */}
        <div className="flex-1 min-w-[140px] relative">
          <select
            value={groupBy}
            onChange={(e) => onGroupByChange(e.target.value as 'alpha' | 'type' | 'location' | 'genre')}
            className="w-full px-3 py-2 pr-8 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all cursor-pointer hover:border-orange-400 appearance-none"
            style={{backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25rem'}}
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
