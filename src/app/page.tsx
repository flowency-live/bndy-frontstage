// app/page.tsx
"use client";

import { useViewToggle } from "@/context/ViewToggleContext";
import MapView from "@/components/MapView";
import ListView from "@/components/ListView";

export default function HomePage() {
  const { activeView } = useViewToggle();

  return (
    <div>
      {activeView === "map" ? <MapView /> : <ListView />}
    </div>
  );
}
