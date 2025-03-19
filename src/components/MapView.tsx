// src/components/MapView.tsx
"use client";

import Map from "./map/Map";
import EventFilter from "./filters/EventFilter";
import { MapViewEventsFilter } from "./filters/MapViewEventsFilter";
import { useState, useRef, useEffect } from "react";
import { AddEventButton } from "./events/AddEventButton";
import { useViewToggle } from "@/context/ViewToggleContext";
import { VenueModeIndicator } from "./map/VenueModeIndicator";

export default function MapView() {
  const { mapMode } = useViewToggle();
  const [filterType, setFilterType] = useState<'artist' | 'venue' | 'nomatch' | null>(null);
  const [filterId, setFilterId] = useState<string | null>(null);
  const [entityExists, setEntityExists] = useState<boolean>(false);
  
  // Reference to the EventFilter component
  const eventFilterRef = useRef<{ clear: () => void } | null>(null);

  const handleFilterChange = (
    type: 'artist' | 'venue' | 'nomatch' | null, 
    text: string | null,
    artistVenueFound: boolean = false
  ) => {
    setFilterType(type);
    setFilterId(text);
    setEntityExists(artistVenueFound);
  };
  
  const handleClearSearch = () => {
    // Clear the filter state
    setFilterType(null);
    setFilterId(null);
    setEntityExists(false);
    
    // Call the clear method on the EventFilter component
    if (eventFilterRef.current && eventFilterRef.current.clear) {
      eventFilterRef.current.clear();
    }
  };

  // Clear search when map mode changes
  useEffect(() => {
    handleClearSearch();
  }, [mapMode]);

  return (
    <div className="map-container relative h-[calc(100vh-116px)]">
      <Map 
        filterType={filterType} 
        filterId={filterId}
        entityExists={entityExists}
        onClearSearch={handleClearSearch}
      />

      {/* Search filter above the map */}
      <div className="absolute top-2 left-0 right-0 z-20 px-4 py-2 bg-opacity-80 backdrop-blur-sm dark:bg-opacity-80">
        <EventFilter 
          ref={eventFilterRef}
          onFilterChange={handleFilterChange} 
          showRadiusFilter={false} 
        />
      </div>

      {/* Venue Mode Indicator - appears in top-center when in venue mode */}
      <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-30">
        <VenueModeIndicator />
      </div>

      {/* Quick filter button in the bottom left - only show in events mode */}
      {mapMode === 'events' && (
        <div className="absolute bottom-10 left-4 z-50" style={{ pointerEvents: 'auto' }}>
          <MapViewEventsFilter />
        </div>
      )}
      
      {/* Add Event button */}
      <div className="z-50" style={{ pointerEvents: 'auto' }}>
        <AddEventButton />
      </div>
    </div>
  );
}