"use client";

import { Map, List, Users, Building } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useViewToggle } from "@/context/ViewToggleContext";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { activeView, setActiveView, mapMode, setMapMode } = useViewToggle();

  const isHomePage = pathname === "/";
  const isArtistsPage = pathname === "/artists";

  const handleMapView = () => {
    if (!isHomePage) {
      router.push("/");
    }
    setActiveView("map");
    setMapMode("events");
  };

  const handleListView = () => {
    if (!isHomePage) {
      router.push("/");
    }
    setActiveView("list");
    setMapMode("events");
  };

  const handleArtistView = () => {
    router.push("/artists");
  };

  const handleVenueMap = () => {
    if (!isHomePage) {
      router.push("/");
    }
    setActiveView("map");
    setMapMode("venues");
  };

  const isMapViewActive = isHomePage && activeView === "map" && mapMode === "events";
  const isListViewActive = isHomePage && activeView === "list" && mapMode === "events";
  const isVenueMapActive = isHomePage && activeView === "map" && mapMode === "venues";

  return (
    <nav className="mobile-bottom-nav fixed bottom-0 left-0 right-0 md:hidden z-40">
      <div className="grid grid-cols-4 h-16 bg-[var(--background)] border-t border-gray-200 dark:border-gray-800">
        {/* Map View */}
        <button
          onClick={handleMapView}
          className={`flex flex-col items-center justify-center gap-1 transition-colors ${
            isMapViewActive
              ? "text-[var(--primary)]"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
          aria-label="Map View"
        >
          <Map className="w-5 h-5" />
          <span className="text-[10px] font-medium">Map View</span>
        </button>

        {/* List View */}
        <button
          onClick={handleListView}
          className={`flex flex-col items-center justify-center gap-1 transition-colors ${
            isListViewActive
              ? "text-[var(--primary)]"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
          aria-label="List View"
        >
          <List className="w-5 h-5" />
          <span className="text-[10px] font-medium">List View</span>
        </button>

        {/* Artist View */}
        <button
          onClick={handleArtistView}
          className={`flex flex-col items-center justify-center gap-1 transition-colors ${
            isArtistsPage
              ? "text-[var(--primary)]"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
          aria-label="Artist View"
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-medium">Artist View</span>
        </button>

        {/* Venue Map */}
        <button
          onClick={handleVenueMap}
          className={`flex flex-col items-center justify-center gap-1 transition-colors ${
            isVenueMapActive
              ? "text-[var(--primary)]"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
          aria-label="Venue Map"
        >
          <Building className="w-5 h-5" />
          <span className="text-[10px] font-medium">Venue Map</span>
        </button>
      </div>
    </nav>
  );
}
