// src/components/filters/EventFilter.tsx
import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Search, X } from 'lucide-react';
import { useEvents } from '@/context/EventsContext';
import { useViewToggle } from '@/context/ViewToggleContext';

// Update the interface to include the search term and found status
interface EventFilterProps {
  onFilterChange?: (type: 'artist' | 'venue' | 'nomatch' | null, searchText: string | null, artistVenueFound?: boolean) => void;
  showRadiusFilter?: boolean;
}

// Define the ref interface
export interface EventFilterRef {
  clear: () => void;
}

const EventFilter = forwardRef<EventFilterRef, EventFilterProps>(({
  onFilterChange,
  showRadiusFilter = true
}, ref) => {
  const { radius, setRadius } = useEvents();
  const { mapMode } = useViewToggle();
  const [searchTerm, setSearchTerm] = useState('');
  const [tempRadius, setTempRadius] = useState(radius);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Minimum search length and debounce delay
  const MIN_SEARCH_LENGTH = 3;
  const DEBOUNCE_DELAY = 500; // 500ms delay

  // Complete clear function to reset all state
  const clearSearchState = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    if (onFilterChange) onFilterChange(null, null);

    // Cancel any pending debounce timers
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // Expose the clear method to parent components via ref
  useImperativeHandle(ref, () => ({
    clear: clearSearchState
  }));

  // Sync tempRadius with radius when radius changes from context
  useEffect(() => {
    setTempRadius(radius);
  }, [radius]);

  // Debounce search term updates
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Set a new timer to update the debounced search term
    timerRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, DEBOUNCE_DELAY);
    
    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [searchTerm]);

  // Search logic - simplified for viewport-based searching
  useEffect(() => {
    if (!debouncedSearchTerm || debouncedSearchTerm.length < MIN_SEARCH_LENGTH) {
      if (onFilterChange) onFilterChange(null, null);
      return;
    }

    const term = debouncedSearchTerm.toLowerCase();

    // In venue mode, only search venues
    if (mapMode === 'venues') {
      if (onFilterChange) onFilterChange('venue', term);
      return;
    }

    // In events mode, pass search term as 'artist' by default
    // The Map component will handle the actual filtering
    if (onFilterChange) onFilterChange('artist', term, true);
  }, [debouncedSearchTerm, onFilterChange, mapMode]);

  // Apply radius when slider interaction ends
  const applyRadius = () => {
    if (tempRadius !== radius) {
      setRadius(tempRadius);
    }
  };

  // Get placeholder text based on map mode
  const placeholderText = mapMode === 'venues' 
    ? "Search venues..."
    : "Search artist or venue...";

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
      {/* Search input - with original styling */}
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder={placeholderText}
          className="w-full p-2 pl-9 pr-8 border-2 border-gray-400 dark:border-gray-700 rounded-md bg-white/90 dark:bg-black/20 text-gray-800 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-400 placeholder:font-normal"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute left-2 top-2.5 w-5 h-5 text-gray-400" />

        {/* Clear button */}
        {searchTerm && (
          <button
            className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={clearSearchState}
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Radius filter - only show if showRadiusFilter is true and in events mode */}
      {showRadiusFilter && mapMode === 'events' && (
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
});

EventFilter.displayName = 'EventFilter';

export default EventFilter;