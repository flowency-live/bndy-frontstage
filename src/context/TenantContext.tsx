"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Builder } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.bndy.co.uk";

interface TenantContextType {
  tenant: Builder | null;
  subdomain: string | null;
  loading: boolean;
  error: string | null;
  isWhiteLabel: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
  subdomain: string | null;
}

/**
 * Apply theme CSS variables to the document root
 */
function applyTheme(theme: Builder["theme"]) {
  const root = document.documentElement;

  root.style.setProperty("--primary", theme.primaryColor);
  root.style.setProperty("--secondary", theme.secondaryColor);
  root.style.setProperty("--background", theme.backgroundColor);
  root.style.setProperty("--foreground", theme.foregroundColor);

  // Apply dark/light mode class
  if (theme.defaultMode === "dark") {
    root.classList.add("dark");
    root.classList.remove("light");
  } else {
    root.classList.remove("dark");
    root.classList.add("light");
  }
}

export function TenantProvider({ children, subdomain }: TenantProviderProps) {
  const [tenant, setTenant] = useState<Builder | null>(null);
  const [loading, setLoading] = useState(subdomain !== null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // No subdomain means main site - no tenant to fetch
    if (!subdomain) {
      setLoading(false);
      return;
    }

    const fetchTenant = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/builders/by-subdomain/${subdomain}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          const data = await response.json();
          setError(data.error || "Failed to load tenant");
          setTenant(null);
          return;
        }

        const data = await response.json();
        const builder = data.builder as Builder;

        setTenant(builder);

        // Apply theme CSS variables
        if (builder.theme) {
          applyTheme(builder.theme);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tenant");
        setTenant(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();
  }, [subdomain]);

  const isWhiteLabel = tenant !== null;

  return (
    <TenantContext.Provider
      value={{
        tenant,
        subdomain,
        loading,
        error,
        isWhiteLabel,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}
