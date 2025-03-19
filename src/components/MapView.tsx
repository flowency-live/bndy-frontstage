// src/components/MapView.tsx
"use client";

import Map from "./map/Map";
import EventFilter from "./filters/EventFilter";
import { MapViewEventsFilter } from "./filters/MapViewEventsFilter";
import { useState } from "react";
import { AddEventButton } from "./events/AddEventButton";
import { useViewToggle } from "@/context/ViewToggleContext";

export default function MapView() {
  const { mapMode } = useViewToggle();
  const [filterType, setFilterType] = useState<'artist' | 'venue' | 'nomatch' | null>(null);
  const [filterId, setFilterId] = useState<string | null>(null);

  const handleFilterChange = (type: 'artist' | 'venue' | 'nomatch' | null, text: string | null) => {
    setFilterType(type);
    setFilterId(text);
  };

  return (
    <div className="map-container relative h-[calc(100vh-116px)]">
      <Map 
        filterType={filterType} 
        filterId={filterId} 
      />

      {/* Search filter above the map */}
      <div className="absolute top-2 left-0 right-0 z-20 px-4 py-2 bg-opacity-80 backdrop-blur-sm dark:bg-opacity-80">
        <EventFilter onFilterChange={handleFilterChange} showRadiusFilter={false} />
      </div>

      {/* Quick filter button in the bottom left - only show in events mode */}
      {mapMode === 'events' && (
        <div className="z-20 absolute" style={{ pointerEvents: 'auto' }}>
          <MapViewEventsFilter />
        </div>
      )}
      
      {/* Add Event button in the bottom right - conditionally rendered based on permissions */}
      <div className="z-20 absolute bottom-4 right-4" style={{ pointerEvents: 'auto' }}>
        <AddEventButton />
      </div>
    </div>
  );
}