// src/components/filters/LocationSelector.tsx
import { useState, useRef, useEffect } from 'react';
import { useEvents } from '@/context/EventsContext';
import { MapPin, ChevronDown } from 'lucide-react';
import { CITY_LOCATIONS } from '@/lib/constants';

// Define the location type with name property
interface LocationWithName extends google.maps.LatLngLiteral {
  name: string;
}

export default function LocationSelector() {
  const { selectedLocation, setSelectedLocation, userLocation } = useEvents();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSelectLocation = (location: LocationWithName) => {
    setSelectedLocation(location);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Simplified locations list
  const availableLocations: LocationWithName[] = [
    ...(userLocation ? [{
      ...userLocation,
      name: (userLocation as LocationWithName).name || "Current Location"
    }] : []),
    CITY_LOCATIONS.STOKE_ON_TRENT,
    CITY_LOCATIONS.STOCKPORT
  ];

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
        <ChevronDown className="w-4 h-4 text-[var(--foreground)]" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-[var(--background)] border border-gray-300 dark:border-gray-700 rounded-md shadow-md z-50 min-w-[200px]">
          <ul className="py-1">
            {availableLocations.map((location, index) => (
              <li key={index}>
                <button
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    selectedLocation?.name === location.name 
                      ? 'text-[var(--primary)] font-medium' 
                      : 'text-[var(--foreground)]'
                  }`}
                  onClick={() => handleSelectLocation(location)}
                >
                  {location.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}