// app/page.tsx
"use client";

import dynamic from "next/dynamic";
import { useViewToggle } from "@/context/ViewToggleContext";
import { EventsProvider } from "@/context/EventsContext";
import ListView from "@/components/ListView";

// Dynamically import MapView with SSR disabled.
const MapViewNoSSR = dynamic(() => import("@/components/MapView"), { ssr: false });

export default function HomePage() {
  const { activeView } = useViewToggle();

  return (
    <EventsProvider>
      {/* 
        The key here forces a full remount when activeView changes.
        This should clear any lingering Leaflet map container.
      */}
      <div key={`view-${activeView}`}>
        {activeView === "map" ? <MapViewNoSSR /> : <ListView />}
      </div>
    </EventsProvider>
  );
}
