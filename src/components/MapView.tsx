// src/components/MapView.tsx
"use client";

import { Wrapper, Status } from "@googlemaps/react-wrapper";
import Map from "./map/Map";

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
  return (
    <div className="map-container relative">
      <Wrapper
        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
        render={renderStatus}
        libraries={["places"]}
      >
        <Map />
      </Wrapper>
    </div>
  );
}