// src/components/providers/GoogleMapsProvider.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import Script from 'next/script';
import { initGoogleMapsCheck } from '@/lib/services/places-service';

interface GoogleMapsContextType {
  isLoaded: boolean;
  isError: boolean;
  loadGoogleMaps: () => Promise<boolean>;
}

const GoogleMapsContext = createContext<GoogleMapsContextType | undefined>(undefined);

export function useGoogleMaps() {
  const context = useContext(GoogleMapsContext);
  if (!context) {
    throw new Error('useGoogleMaps must be used within a GoogleMapsProvider');
  }
  return context;
}

interface GoogleMapsProviderProps {
  children: ReactNode;
  autoLoad?: boolean; // Set to true to load Google Maps on mount
}

export function GoogleMapsProvider({ children, autoLoad = false }: GoogleMapsProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get API key - must be done in component to ensure it's available at runtime
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  useEffect(() => {
    if (!apiKey) {
      console.error('[GoogleMaps] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not defined');
    } else {
      console.log('[GoogleMaps] API key loaded:', apiKey.substring(0, 10) + '...');
    }
  }, [apiKey]);

  // Check if Google Maps is already available
  useEffect(() => {
    if (initGoogleMapsCheck()) {
      setIsLoaded(true);
    } else if (autoLoad) {
      // If autoLoad is true, we'll load the script automatically
      setIsLoading(true);
    }
  }, [autoLoad]);

  // Callback for when script loads successfully
  const handleScriptLoad = useCallback(() => {
    setScriptLoaded(true);
    setIsLoaded(true);
    setIsLoading(false);
    initGoogleMapsCheck(); // Update our global check
  }, []);

  // Callback for script load error
  const handleScriptError = useCallback(() => {
    console.error('Failed to load Google Maps script');
    setIsError(true);
    setIsLoading(false);
  }, []);

  // Function to manually load Google Maps when needed
  const loadGoogleMaps = useCallback(async (): Promise<boolean> => {
    // If already loaded, return true
    if (isLoaded) return true;
    
    // If already loading, wait for result
    if (isLoading) {
      return new Promise<boolean>((resolve) => {
        const checkInterval = setInterval(() => {
          if (isLoaded) {
            clearInterval(checkInterval);
            resolve(true);
          }
          if (isError) {
            clearInterval(checkInterval);
            resolve(false);
          }
        }, 100);
      });
    }

    // Set loading state
    setIsLoading(true);
    
    // If we're in a browser environment, we can use the Script component
    if (typeof window !== 'undefined') {
      return new Promise<boolean>((resolve) => {
        // Script component will handle the loading
        setScriptLoaded(true);
        
        // Set up a check for when Google Maps becomes available
        const checkInterval = setInterval(() => {
          if (initGoogleMapsCheck()) {
            clearInterval(checkInterval);
            setIsLoaded(true);
            setIsLoading(false);
            resolve(true);
          }
        }, 100);

        // Timeout after 10 seconds
        setTimeout(() => {
          if (!isLoaded) {
            clearInterval(checkInterval);
            setIsError(true);
            setIsLoading(false);
            resolve(false);
          }
        }, 10000);
      });
    }

    // For SSR, return false
    setIsLoading(false);
    return false;
  }, [isLoaded, isLoading, isError]);

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, isError, loadGoogleMaps }}>
      {children}
      
      {/* Load Google Maps script if we're loading or script is already requested */}
      {(isLoading || scriptLoaded) && !isLoaded && !isError && apiKey && (
        <Script
          id="google-maps-script"
          src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`}
          onLoad={handleScriptLoad}
          onError={handleScriptError}
          strategy="lazyOnload"
        />
      )}
    </GoogleMapsContext.Provider>
  );
}