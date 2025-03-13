// src/context/ViewToggleContext.tsx - Modified
"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type View = "map" | "list";
type MapMode = "events" | "venues";

interface ViewToggleContextType {
  activeView: View;
  setActiveView: React.Dispatch<React.SetStateAction<View>>;
  mapMode: MapMode;
  setMapMode: React.Dispatch<React.SetStateAction<MapMode>>;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ViewToggleContext = createContext<ViewToggleContextType | undefined>(undefined);

export function ViewToggleProvider({ children }: { children: ReactNode }) {
  // View state - Default to map
  const [activeView, setActiveView] = useState<View>("map");
  // Map mode state - Default to events
  const [mapMode, setMapMode] = useState<MapMode>("events");
  // Theme state - Default to dark theme
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Load saved preferences from localStorage on client-side mount
  useEffect(() => {
    // Load view preference
    const savedView = localStorage.getItem("bndy-view-preference");
    if (savedView === "map" || savedView === "list") {
      setActiveView(savedView);
    }

    // Load map mode preference
    const savedMapMode = localStorage.getItem("bndy-map-mode-preference");
    if (savedMapMode === "events" || savedMapMode === "venues") {
      setMapMode(savedMapMode);
    }

    // Load theme preference
    const savedTheme = localStorage.getItem("bndy-theme-preference");
    // If no preference is saved, we default to dark (from the initial state)
    // Otherwise we use their saved preference
    const shouldUseDarkMode = savedTheme === null ? true : savedTheme === "dark";
    setIsDarkMode(shouldUseDarkMode);

    // Apply the theme to the document
    document.documentElement.classList.toggle("dark", shouldUseDarkMode);
  }, []);

  // Function to toggle theme and save preference
  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newValue = !prev;
      // Save to localStorage
      localStorage.setItem("bndy-theme-preference", newValue ? "dark" : "light");
      // Apply theme change
      document.documentElement.classList.toggle("dark", newValue);
      return newValue;
    });
  };

  // Save view preference when it changes
  useEffect(() => {
    localStorage.setItem("bndy-view-preference", activeView);
  }, [activeView]);

  // Save map mode preference when it changes
  useEffect(() => {
    localStorage.setItem("bndy-map-mode-preference", mapMode);
  }, [mapMode]);

  return (
    <ViewToggleContext.Provider
      value={{
        activeView,
        setActiveView,
        mapMode,
        setMapMode,
        isDarkMode,
        toggleTheme
      }}
    >
      {children}
    </ViewToggleContext.Provider>
  );
}

export function useViewToggle() {
  const context = useContext(ViewToggleContext);
  if (!context) {
    throw new Error("useViewToggle must be used within a ViewToggleProvider");
  }
  return context;
}