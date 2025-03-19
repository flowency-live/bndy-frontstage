// src/components/Map/VenueModeIndicator.tsx
import { Building, Info, X } from 'lucide-react';
import { useViewToggle } from '@/context/ViewToggleContext';
import { useState } from 'react';

export const VenueModeIndicator = () => {
  const { mapMode, setMapMode } = useViewToggle();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Only show in venue mode
  if (mapMode !== 'venues') return null;
  
  return (
    <div className="venue-mode-indicator">
      <button
        className="venue-indicator-button flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg shadow-lg"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <Building className="w-5 h-5" />
        <span className="font-medium">Venue Mode</span>
        <Info className="w-4 h-4" />
      </button>
      
      {isExpanded && (
        <div className="venue-info-panel mt-2 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg text-sm">
          <div className="flex justify-between items-center mb-2">
            <p className="font-semibold">You are in Venue Mode</p>
            <button 
              onClick={() => setIsExpanded(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Close explanation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="mb-3 text-gray-700 dark:text-gray-300">
          You&apos;re viewing music venues, not upcoming events. To see events, switch back using the orange calendar icon, top right
          </p>
          <button 
            onClick={() => setMapMode('events')}
            className="w-full bg-primary text-white py-2 px-3 rounded-md hover:bg-primary/90 transition-colors"
          >
            Switch to Events Mode
          </button>
        </div>
      )}
    </div>
  );
};