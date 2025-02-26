// src\components\filters\EventFilter.tsx
import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useEvents } from '@/context/EventsContext';

// Update the interface to include the 'nomatch' type
interface EventFilterProps {
  onFilterChange?: (type: 'artist' | 'venue' | 'nomatch' | null, searchText: string | null) => void;
  showRadiusFilter?: boolean;
}

export default function EventFilter({
  onFilterChange,
  showRadiusFilter = true
}: EventFilterProps) {
  const { radius, setRadius, allEvents } = useEvents();
  const [searchTerm, setSearchTerm] = useState('');
  const [tempRadius, setTempRadius] = useState(radius);

  // Sync tempRadius with radius when radius changes from context
  useEffect(() => {
    setTempRadius(radius);
  }, [radius]);

  // Search logic - simplified to pass search text directly
  useEffect(() => {
    if (!searchTerm || searchTerm.length < 2) {
      if (onFilterChange) onFilterChange(null, null);
      return;
    }

    const term = searchTerm.toLowerCase();
    console.log(`Searching for: ${term}`);

    // Find matching artists
    const artistMatches = allEvents.filter(event =>
      event.name.toLowerCase().includes(term)
    );

    // Find matching venues
    const venueMatches = allEvents.filter(event =>
      event.venueName.toLowerCase().includes(term)
    );

    console.log(`Found ${artistMatches.length} artist matches and ${venueMatches.length} venue matches`);

    // Prioritize artist matches over venue matches
    if (artistMatches.length > 0) {
      // Pass the search term instead of the ID
      if (onFilterChange) onFilterChange('artist', term);
    } else if (venueMatches.length > 0) {
      // Pass the search term instead of the ID
      if (onFilterChange) onFilterChange('venue', term);
    } else {
      // If no matches, set filter type to "nomatch" to indicate empty results should be shown
      if (onFilterChange) onFilterChange('nomatch', term);
    }
  }, [searchTerm, onFilterChange, allEvents]);

  // Apply radius when slider interaction ends
  const applyRadius = () => {
    if (tempRadius !== radius) {
      setRadius(tempRadius);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
      {/* Search input - with original styling */}
      <div className="relative flex-grow max-w-md">
        <input
          type="text"
          placeholder="Search artist or venue..."
          className="w-full p-2 pl-9 pr-8 border-2 border-gray-400 dark:border-gray-700 rounded-md bg-white/90 dark:bg-black/20 backdrop-blur-sm text-gray-800 dark:text-gray-200"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute left-2 top-2.5 w-5 h-5 text-gray-400" />

        {/* Clear button */}
        {searchTerm && (
          <button
            className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={() => {
              setSearchTerm('');
              if (onFilterChange) onFilterChange(null, null);
            }}
          >
            <X className="w-4 h-4" />
          </button>
        )}
        
        {/* Removed the search result indicator/label */}
      </div>

      {/* Radius filter - only show if showRadiusFilter is true */}
      {showRadiusFilter && (
        <div className="flex items-center space-x-2">
          <span className="text-sm whitespace-nowrap">Radius: {tempRadius} miles</span>
          <input
            type="range"
            min="5"
            max="50"
            step="5"
            value={tempRadius}
            onChange={(e) => setTempRadius(parseInt(e.target.value))}
            onMouseUp={applyRadius}
            onTouchEnd={applyRadius}
            className="w-32"
          />
        </div>
      )}
    </div>
  );
}