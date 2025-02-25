// app/page.tsx
"use client";

import { useViewToggle } from "@/context/ViewToggleContext";
import { EventsProvider } from "@/context/EventsContext";
import MapView from "@/components/MapView";
import ListView from "@/components/ListView";

export default function HomePage() {
  const { activeView } = useViewToggle();

  return (
    <EventsProvider>
      <div>
        {activeView === "map" ? <MapView /> : <ListView />}
      </div>
    </EventsProvider>
  );
}