// src/components/Header.tsx
"use client";

import { useState, useEffect } from "react";
import BndyLogo from "@/components/ui/bndylogo";
import { Sun, Moon, Map as MapIcon, List as ListIcon } from "lucide-react";

interface HeaderProps {
  activeView: "map" | "list";
  setActiveView: React.Dispatch<React.SetStateAction<"map" | "list">>;
}

export default function Header({ activeView, setActiveView }: HeaderProps) {
  const [isDark, setIsDark] = useState(false);

  // Toggle dark mode by adding/removing the "dark" class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark]);

  // Toggling between map and list view.
  const handleViewToggle = () => {
    setActiveView((prev) => (prev === "map" ? "list" : "map"));
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--background)] shadow p-4">
      <div className="relative container mx-auto">
        {/* Toggles in the top-right corner */}
        <div className="absolute top-0 right-0 mt-2 mr-2 flex items-center space-x-4">
          {/* Theme Toggle Button */}
          <button
            onClick={() => setIsDark((prev) => !prev)}
            className="flex items-center focus:outline-none"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-[var(--foreground)]" />
            ) : (
              <Moon className="w-5 h-5 text-[var(--foreground)]" />
            )}
          </button>

          {/* Map/List Toggle Icon Button */}
          <button
            onClick={handleViewToggle}
            className="flex items-center focus:outline-none"
          >
            {activeView === "map" ? (
              <ListIcon className="w-5 h-5 text-[var(--foreground)]" />
            ) : (
              <MapIcon className="w-5 h-5 text-[var(--foreground)]" />
            )}
          </button>
        </div>

        {/* Centered logo and tagline */}
        <div className="text-center">
          <div className="flex justify-center">
            <BndyLogo />
          </div>
          <p className="mt-4 text-lg">
            Keeping{" "}
            <span className="font-extrabold text-[var(--primary)]">LIVE</span>{" "}
            music{" "}
            <span className="font-extrabold text-[var(--secondary)]">
              ALIVE
            </span>
          </p>
        </div>
      </div>
    </header>
  );
}
