// src/components/filters/LocationSelector.tsx
import { useState, useRef, useEffect } from 'react';
import { useEvents } from '@/context/EventsContext';
import { MapPin, Search, X } from 'lucide-react';
import { searchCityAutocomplete } from '@/lib/services/places-service';

// Define the location type with name property
interface LocationWithName extends google.maps.LatLngLiteral {
  name: string;
}

export default function LocationSelector() {
  const { selectedLocation, setSelectedLocation, userLocation } = useEvents();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
        setPredictions([]);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setPredictions([]);
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchCityAutocomplete(searchQuery);
        setPredictions(results);
      } catch (error) {
        console.error('Error searching cities:', error);
        setPredictions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSelectPrediction = async (prediction: google.maps.places.AutocompletePrediction) => {
    try {
      // Get place details to retrieve lat/lng
      const placesService = new google.maps.places.PlacesService(document.createElement('div'));

      placesService.getDetails(
        { placeId: prediction.place_id },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
            const location: LocationWithName = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              name: prediction.description
            };

            setSelectedLocation(location);
            setIsOpen(false);
            setSearchQuery('');
            setPredictions([]);
          }
        }
      );
    } catch (error) {
      console.error('Error getting place details:', error);
    }
  };

  const handleSelectCurrentLocation = () => {
    if (userLocation) {
      const location: LocationWithName = {
        ...userLocation,
        name: (userLocation as LocationWithName).name || "Current Location"
      };
      setSelectedLocation(location);
      setIsOpen(false);
      setSearchQuery('');
      setPredictions([]);
    }
  };

  const handleClearLocation = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLocation(null);
  };

  return (
    <div className="location-selector relative" ref={dropdownRef}>
      <button
        className="flex items-center space-x-1 px-3 py-2 bg-[var(--background)] border border-gray-400 dark:border-gray-700 rounded-md text-sm text-[var(--foreground)]"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <MapPin className="w-4 h-4 text-[var(--primary)]" />
        <span>{selectedLocation?.name || 'Select location'}</span>
        {selectedLocation && (
          <X
            className="w-4 h-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            onClick={handleClearLocation}
          />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-[var(--background)] border border-gray-300 dark:border-gray-700 rounded-md shadow-md z-50 min-w-[280px] max-w-[400px]">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search UK towns & cities..."
                className="w-full pl-8 pr-3 py-2 text-sm bg-[var(--background)] border border-gray-300 dark:border-gray-600 rounded-md text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                autoFocus
              />
            </div>
          </div>

          {/* Results */}
          <ul className="py-1 max-h-[300px] overflow-y-auto">
            {/* Current Location Option */}
            {userLocation && !searchQuery && (
              <li>
                <button
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${
                    selectedLocation?.name === "Current Location"
                      ? 'text-[var(--primary)] font-medium'
                      : 'text-[var(--foreground)]'
                  }`}
                  onClick={handleSelectCurrentLocation}
                >
                  <MapPin className="w-4 h-4 text-[var(--primary)]" />
                  Current Location
                </button>
              </li>
            )}

            {/* Search Results */}
            {searchQuery && (
              <>
                {isSearching && (
                  <li className="px-4 py-2 text-sm text-[var(--muted-foreground)]">
                    Searching...
                  </li>
                )}

                {!isSearching && predictions.length === 0 && (
                  <li className="px-4 py-2 text-sm text-[var(--muted-foreground)]">
                    No cities found
                  </li>
                )}

                {!isSearching && predictions.map((prediction) => (
                  <li key={prediction.place_id}>
                    <button
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-[var(--foreground)]"
                      onClick={() => handleSelectPrediction(prediction)}
                    >
                      {prediction.description}
                    </button>
                  </li>
                ))}
              </>
            )}

            {/* No search - show prompt */}
            {!searchQuery && !userLocation && (
              <li className="px-4 py-2 text-sm text-[var(--muted-foreground)]">
                Type to search for a city...
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
