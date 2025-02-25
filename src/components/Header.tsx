// src/components/Header.tsx
"use client";

import { usePathname } from "next/navigation";
import BndyLogo from "@/components/ui/bndylogo";
import { Sun, Moon, Map as MapIcon, List as ListIcon } from "lucide-react";
import { useViewToggle } from "@/context/ViewToggleContext";

export default function Header() {
  const pathname = usePathname();
  const { activeView, setActiveView, isDarkMode, toggleTheme } = useViewToggle();

  // Only show the map/list toggle if we are on the home page ("/")
  const showViewToggle = pathname === "/";

  const handleViewToggle = () => {
    setActiveView((prev) => (prev === "map" ? "list" : "map"));
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
        {/* Toggles in top-right corner */}
        <div className="absolute top-0 right-0 mt-2 mr-2 flex items-center space-x-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center focus:outline-none"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-[var(--foreground)]" />
            ) : (
              <Moon className="w-5 h-5 text-[var(--foreground)]" />
            )}
          </button>
          {/* Conditionally render the Map/List toggle */}
          {showViewToggle && (
            <button onClick={handleViewToggle} className="flex items-center focus:outline-none">
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