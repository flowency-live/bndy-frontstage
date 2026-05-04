'use client';

/**
 * White-label tenant context provider
 *
 * Provides tenant config to all white-label components.
 * Injects tenant theme as CSS variables with --wl-* prefix.
 */

import { createContext, useContext, useEffect, type ReactNode } from 'react';
import type { TenantConfig } from '@/lib/whitelabel/types';

interface WhitelabelContextValue {
  tenant: TenantConfig;
}

const WhitelabelContext = createContext<WhitelabelContextValue | null>(null);

interface WhitelabelProviderProps {
  tenant: TenantConfig;
  children: ReactNode;
}

export function WhitelabelProvider({ tenant, children }: WhitelabelProviderProps) {
  // Inject tenant theme as CSS variables
  useEffect(() => {
    const root = document.documentElement;

    // Set --wl-* prefixed CSS variables (isolated from main app)
    root.style.setProperty('--wl-primary', tenant.theme.primary);
    root.style.setProperty('--wl-secondary', tenant.theme.secondary);
    root.style.setProperty('--wl-background', tenant.theme.background);
    root.style.setProperty('--wl-foreground', tenant.theme.foreground);

    // Force dark mode class for dark-themed tenants
    const isDarkTheme =
      tenant.theme.background === '#000000' ||
      tenant.theme.background.toLowerCase().includes('000');

    if (isDarkTheme) {
      root.classList.add('dark');
    }

    // Cleanup on unmount
    return () => {
      root.style.removeProperty('--wl-primary');
      root.style.removeProperty('--wl-secondary');
      root.style.removeProperty('--wl-background');
      root.style.removeProperty('--wl-foreground');

      // Don't remove dark class on unmount - could affect other pages
    };
  }, [tenant]);

  return (
    <WhitelabelContext.Provider value={{ tenant }}>
      {children}
    </WhitelabelContext.Provider>
  );
}

/**
 * Hook to access tenant config in white-label components
 */
export function useWhitelabel() {
  const context = useContext(WhitelabelContext);

  if (!context) {
    throw new Error('useWhitelabel must be used within a WhitelabelProvider');
  }

  return context;
}
