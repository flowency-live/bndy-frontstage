// src/components/MapView.tsx
"use client";

import { Wrapper, Status } from "@googlemaps/react-wrapper";
import Map from "./map/Map";
import EventFilter from "./filters/EventFilter";
import { MapViewEventsFilter } from "./filters/MapViewEventsFilter";
import { useState } from "react";

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
  // Update the state type to include 'nomatch'
  const [filterType, setFilterType] = useState<'artist' | 'venue' | 'nomatch' | null>(null);
  const [filterId, setFilterId] = useState<string | null>(null);

  const handleFilterChange = (type: 'artist' | 'venue' | 'nomatch' | null, text: string | null) => {
    console.log(`Setting filter: ${type} - "${text}"`);
    setFilterType(type);
    setFilterId(text);
  };

  return (
    <div className="map-container relative">
      {/* Search filter above the map */}
      <div className="absolute top-0 left-0 right-0 z-10 px-4 py-2">
        <EventFilter onFilterChange={handleFilterChange} showRadiusFilter={false} />
      </div>

      <Wrapper
        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
        render={renderStatus}
        libraries={["places"]}
      >
        <Map filterType={filterType} filterId={filterId} />
      </Wrapper>

      {/* Quick filter button in the bottom right */}
      <MapViewEventsFilter />
    </div>
  );
}