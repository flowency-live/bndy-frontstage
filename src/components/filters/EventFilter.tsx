// src\components\filters\EventFilter.tsx
import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useEvents } from '@/context/EventsContext';

interface EventFilterProps {
  onFilterChange?: (type: 'artist' | 'venue' | null, id: string | null) => void;
  showRadiusFilter?: boolean; // New prop
}

export default function EventFilter({
  onFilterChange,
  showRadiusFilter = true // Default to true
}: EventFilterProps) {
  const { radius, setRadius } = useEvents();
  const [searchTerm, setSearchTerm] = useState('');
  const [tempRadius, setTempRadius] = useState(radius);
  const [searchResults, setSearchResults] = useState<{
    type: 'artist' | 'venue' | null;
    id: string | null;
    name: string | null;
  }>({
    type: null,
    id: null,
    name: null
  });

  // Get all events for search
  const { allEvents } = useEvents();

  // Search logic
  useEffect(() => {
    if (!searchTerm || searchTerm.length < 2) {
      setSearchResults({ type: null, id: null, name: null });
      if (onFilterChange) onFilterChange(null, null);
      return;
    }

    const term = searchTerm.toLowerCase();

    // First check for venue matches
    const venueMatch = allEvents.find(event =>
      event.venueName?.toLowerCase().includes(term)
    );

    // Then check for artist matches
    const artistMatch = !venueMatch && allEvents.find(event =>
      event.name?.toLowerCase().includes(term)
    );

    if (venueMatch) {
      setSearchResults({
        type: 'venue',
        id: venueMatch.venueId,
        name: venueMatch.venueName
      });
      if (onFilterChange) onFilterChange('venue', venueMatch.venueId);
    } else if (artistMatch) {
      setSearchResults({
        type: 'artist',
        id: artistMatch.id,
        name: artistMatch.name
      });
      if (onFilterChange) onFilterChange('artist', artistMatch.id);
    } else {
      setSearchResults({ type: null, id: null, name: null });
      if (onFilterChange) onFilterChange(null, null);
    }
  }, [searchTerm, allEvents, onFilterChange]);

  // Apply radius when slider interaction ends
  const applyRadius = () => {
    if (tempRadius !== radius) {
      setRadius(tempRadius);
    }
  };


  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
      {/* Search input */}
      <div className="relative flex-grow max-w-md">
        <input
          type="text"
          placeholder="Search artist or venue..."
          className="w-full p-2 pl-9 pr-8 border rounded-md bg-white/90 dark:bg-black/60 backdrop-blur-sm text-[var(--foreground)]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute left-2 top-2.5 w-5 h-5 text-gray-400" />

        {/* Clear button */}
        {searchTerm && (
          <button
            className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={() => setSearchTerm('')}
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Search result indicator */}
        {searchResults.type && searchResults.name && (
          <div className={`absolute right-8 top-2.5 px-2 py-0.5 rounded text-xs text-white ${searchResults.type === 'artist' ? 'bg-[var(--primary)]' : 'bg-[var(--secondary)]'
            }`}>
            {searchResults.type === 'artist' ? 'Artist' : 'Venue'}
          </div>
        )}
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