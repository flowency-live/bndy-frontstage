"use client";

import { Map, List, Users, Building, Sun, Moon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useViewToggle } from "@/context/ViewToggleContext";

export default function DesktopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { activeView, setActiveView, mapMode, setMapMode, isDarkMode, toggleTheme } = useViewToggle();

  const isHomePage = pathname === "/";
  const isArtistsPage = pathname === "/artists" || pathname.startsWith("/artists/");
  const isVenuesPage = pathname === "/venues" || pathname.startsWith("/venues/");

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

  const navItems = [
    {
      label: "Gig Map",
      icon: Map,
      onClick: handleMapView,
      isActive: isMapViewActive,
    },
    {
      label: "Gig List",
      icon: List,
      onClick: handleListView,
      isActive: isListViewActive,
    },
    {
      label: "Artists",
      icon: Users,
      onClick: handleArtistView,
      isActive: isArtistsPage,
    },
    {
      label: "Venues",
      icon: Building,
      onClick: handleVenueMap,
      isActive: isVenueMapActive || isVenuesPage,
    },
  ];

  return (
    <nav className="hidden md:block fixed top-[88px] left-0 right-0 z-40 bg-[var(--background)]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-2 py-3">
          {/* Main Navigation Buttons */}
          <div className="flex items-center gap-1 p-1 rounded-full bg-[var(--card)] border border-[var(--border)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={`
                    desktop-nav-btn
                    flex items-center gap-2 px-4 py-2 rounded-full
                    text-sm font-medium
                    transition-all duration-200 ease-out
                    ${
                      item.isActive
                        ? "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/25"
                        : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50"
                    }
                  `}
                  aria-label={item.label}
                  aria-current={item.isActive ? "page" : undefined}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Theme Toggle - Separate from main nav */}
          <button
            onClick={toggleTheme}
            className="
              ml-4 p-2.5 rounded-full
              bg-[var(--card)] border border-[var(--border)]
              text-[var(--muted-foreground)] hover:text-[var(--foreground)]
              transition-all duration-200
              hover:border-[var(--primary)]/50
            "
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
