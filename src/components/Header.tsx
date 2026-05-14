// src/components/Header.tsx
"use client";

import BndyLogo from "@/components/ui/bndylogo";
import { Sun, Moon } from "lucide-react";
import { useViewToggle } from "@/context/ViewToggleContext";

export default function Header() {
  const { isDarkMode, toggleTheme } = useViewToggle();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-[var(--background)]"
    >
      <div className="relative container mx-auto py-3">
        {/* Mobile-only theme toggle in corner */}
        <div className="absolute top-3 right-4 md:hidden">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
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