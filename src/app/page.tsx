// app/page.tsx
"use client";

import dynamic from "next/dynamic";
import { useViewToggle } from "@/context/ViewToggleContext";
import ListView from "@/components/ListView";

// Dynamically import MapView with SSR disabled.
const MapViewNoSSR = dynamic(() => import("@/components/MapView"), { ssr: false });

export default function HomePage() {
  const { activeView } = useViewToggle();

  // Key forces remount when view changes (clears any lingering map state)
  return (
    <div key={`view-${activeView}`}>
      {activeView === "map" ? <MapViewNoSSR /> : <ListView />}
    </div>
  );
}
