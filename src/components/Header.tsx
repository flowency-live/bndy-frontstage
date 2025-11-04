// src/components/Header.tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import BndyLogo from "@/components/ui/bndylogo";
import { Sun, Moon, Map as MapIcon, List as ListIcon, Building, Calendar, Users } from "lucide-react";
import { useViewToggle } from "@/context/ViewToggleContext";

export default function Header() {
  const pathname = usePathname();
  const { activeView, setActiveView, mapMode, setMapMode, isDarkMode, toggleTheme } = useViewToggle();

  // Only show the map/list toggle if we are on the home page ("/")
  const showViewToggle = pathname === "/";
  
  // Only show the map mode toggle when in map view and on home page
  const showMapModeToggle = showViewToggle && activeView === "map";
  
  // Check if we're on artists pages for active state
  const isArtistsPage = pathname.startsWith("/artists");

  const handleViewToggle = () => {
    setActiveView((prev) => (prev === "map" ? "list" : "map"));
  };
  
  const handleMapModeToggle = () => {
    setMapMode((prev) => (prev === "events" ? "venues" : "events"));
  };

  return (
    <header 
      className="fixed top-3 left-0 right-0 z-50"
      style={{ 
        backgroundColor: 'var(--background)',
        boxShadow: 'none',
        borderBottom: 'none'
      }}
    >
      <div className="relative container mx-auto">
        {/* Navigation and toggles in top-right corner */}
        <div className="absolute top-0 right-0 mt-2 mr-2 flex items-center space-x-4">
          {/* Artists Navigation Link */}
          <Link
            href="/artists"
            className={`flex items-center focus:outline-none transition-colors ${
              isArtistsPage 
                ? "text-[var(--primary)] font-medium" 
                : "text-[var(--foreground)] hover:text-[var(--primary)]"
            }`}
            aria-label="Browse Artists"
          >
            <Users className="w-5 h-5 mr-1" />
            <span className="text-sm">Artists</span>
          </Link>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center focus:outline-none"
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-[var(--foreground)]" />
            ) : (
              <Moon className="w-5 h-5 text-[var(--foreground)]" />
            )}
          </button>
          
          {/* Map Mode Toggle (only visible in map view) */}
          {showMapModeToggle && (
            <button 
              onClick={handleMapModeToggle} 
              className="flex items-center focus:outline-none"
              aria-label={mapMode === "events" ? "Switch to venues view" : "Switch to events view"}
            >
              {mapMode === "events" ? (
                <Building className="w-5 h-5 text-[var(--foreground)]" />
              ) : (
                <Calendar className="w-5 h-5 calendar-icon-pulse" />
              )}
            </button>
          )}
          
          {/* Map/List Toggle */}
          {showViewToggle && (
            <button 
              onClick={handleViewToggle} 
              className="flex items-center focus:outline-none"
              aria-label={activeView === "map" ? "Switch to list view" : "Switch to map view"}
            >
              {activeView === "map" ? (
                <ListIcon className="w-5 h-5 text-[var(--foreground)]" />
              ) : (
                <MapIcon className="w-5 h-5 text-[var(--foreground)]" />
              )}
            </button>
          )}
        </div>
        
        {/* Centered logo and tagline */}
        <div className="text-center">
          <div className="flex justify-center">
            <BndyLogo />
          </div>
          <p className="mt-1 text-lg">
            Keeping{" "}
            <span className="font-extrabold text-[var(--secondary)]">LIVE</span>{" "}
            music{" "}
            <span className="font-extrabold text-[var(--primary)]">ALIVE</span>
          </p>
        </div>
      </div>
    </header>
  );
}