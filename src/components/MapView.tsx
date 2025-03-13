// src/components/MapView.tsx - Updated to pass mapMode
"use client";

import { Wrapper, Status } from "@googlemaps/react-wrapper";
import Map from "./map/Map";
import EventFilter from "./filters/EventFilter";
import { MapViewEventsFilter } from "./filters/MapViewEventsFilter";
import { useState, useRef } from "react";
import { AddEventButton } from "./events/AddEventButton";
import { useViewToggle } from "@/context/ViewToggleContext";

const renderStatus = (status: Status): React.ReactElement => {
  switch (status) {
    case Status.LOADING:
      return <div className="flex items-center justify-center h-full">Loading map...</div>;
    case Status.FAILURE:
      return <div className="flex items-center justify-center h-full text-red-500">Error loading Google Maps</div>;
    default:
      return <></>;
  }
};

export default function MapView() {
  const { mapMode } = useViewToggle();
  const [filterType, setFilterType] = useState<'artist' | 'venue' | 'nomatch' | null>(null);
  const [filterId, setFilterId] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const handleFilterChange = (type: 'artist' | 'venue' | 'nomatch' | null, text: string | null) => {
    setFilterType(type);
    setFilterId(text);
  };

  const handleMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;
  };

  return (
    <div className="map-container relative">
      {/* Search filter above the map - only show in events mode */}
      {mapMode === 'events' && (
        <div className="absolute top-0 left-0 right-0 z-10 px-4 py-2">
          <EventFilter onFilterChange={handleFilterChange} showRadiusFilter={false} />
        </div>
      )}

      <Wrapper
        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
        render={renderStatus}
        libraries={["places"]}
      >
        <Map 
          filterType={filterType} 
          filterId={filterId} 
        />
      </Wrapper>

      {/* Quick filter button in the bottom left - only show in events mode */}
      {mapMode === 'events' && <MapViewEventsFilter />}
      
      {/* Add Event button in the bottom right - conditionally rendered based on permissions */}
      <AddEventButton map={mapRef.current} />
    </div>
  );
}