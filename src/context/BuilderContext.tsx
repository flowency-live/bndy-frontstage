"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { Builder } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.bndy.co.uk";
const STORAGE_KEY = "bndy-current-builder-id";

interface BuilderContextType {
  builders: Builder[];
  currentBuilder: Builder | null;
  loading: boolean;
  error: string | null;
  hasBuilders: boolean;
  setCurrentBuilderId: (id: string | null) => void;
  refresh: () => Promise<void>;
}

const BuilderContext = createContext<BuilderContextType | undefined>(undefined);

export function BuilderProvider({ children }: { children: ReactNode }) {
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [currentBuilderId, setCurrentBuilderIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch builders for authenticated user
  const fetchBuilders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/builders/me`, {
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to fetch builders");
        setBuilders([]);
        return;
      }

      const data = await response.json();
      setBuilders(data.builders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch builders");
      setBuilders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load builders on mount
  useEffect(() => {
    fetchBuilders();
  }, [fetchBuilders]);

  // Restore selected builder from localStorage after builders are loaded
  useEffect(() => {
    if (loading || builders.length === 0) return;

    const savedId = localStorage.getItem(STORAGE_KEY);
    if (savedId) {
      const found = builders.find((b) => b.id === savedId);
      if (found) {
        setCurrentBuilderIdState(savedId);
      }
      // If not found, leave currentBuilderId as null (don't auto-select)
    }
  }, [loading, builders]);

  // Update localStorage when currentBuilderId changes
  const setCurrentBuilderId = useCallback((id: string | null) => {
    setCurrentBuilderIdState(id);

    if (id === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, id);
    }
  }, []);

  // Compute current builder from ID
  const currentBuilder = currentBuilderId
    ? builders.find((b) => b.id === currentBuilderId) || null
    : null;

  return (
    <BuilderContext.Provider
      value={{
        builders,
        currentBuilder,
        loading,
        error,
        hasBuilders: builders.length > 0,
        setCurrentBuilderId,
        refresh: fetchBuilders,
      }}
    >
      {children}
    </BuilderContext.Provider>
  );
}

export function useBuilder() {
  const context = useContext(BuilderContext);
  if (!context) {
    throw new Error("useBuilder must be used within a BuilderProvider");
  }
  return context;
}
