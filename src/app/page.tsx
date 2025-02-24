// app/page.tsx
"use client";

import { useState } from "react";
import Header from "@/components/Header";
import MapView from "@/components/MapView";
import ListView from "@/components/ListView";

export default function HomePage() {
  const [activeView, setActiveView] = useState<"map" | "list">("map");

  return (
    <div>
      <Header activeView={activeView} setActiveView={setActiveView} />
      <main className="pt-24">
        {activeView === "map" ? <MapView /> : <ListView />}
      </main>
    </div>
  );
}
