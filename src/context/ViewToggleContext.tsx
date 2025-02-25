// src/context/ViewToggleContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type View = "map" | "list";

interface ViewToggleContextType {
  activeView: View;
  setActiveView: React.Dispatch<React.SetStateAction<View>>;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ViewToggleContext = createContext<ViewToggleContextType | undefined>(undefined);

export function ViewToggleProvider({ children }: { children: ReactNode }) {
  // View state
  const [activeView, setActiveView] = useState<View>("map");
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true); // Default to dark theme
  
  // Load saved preferences from localStorage on client-side mount
  useEffect(() => {
    // Load view preference
    const savedView = localStorage.getItem("bndy-view-preference");
    if (savedView === "map" || savedView === "list") {
      setActiveView(savedView);
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
  
  return (
    <ViewToggleContext.Provider 
      value={{ 
        activeView, 
        setActiveView, 
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