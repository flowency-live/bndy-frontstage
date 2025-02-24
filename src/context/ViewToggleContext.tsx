// src/context/ViewToggleContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type View = "map" | "list";

interface ViewToggleContextType {
  activeView: View;
  setActiveView: React.Dispatch<React.SetStateAction<View>>;
}

const ViewToggleContext = createContext<ViewToggleContextType | undefined>(undefined);

export function ViewToggleProvider({ children }: { children: ReactNode }) {
  const [activeView, setActiveView] = useState<View>("map");
  return (
    <ViewToggleContext.Provider value={{ activeView, setActiveView }}>
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
