"use client";

import { useEffect } from "react";

/**
 * Service Worker Cleanup Component
 * Unregisters any existing service workers to ensure fresh data is always fetched.
 * The previous SW was causing stale data issues by caching API responses.
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // Unregister any existing service workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister();
          console.log('Service Worker unregistered');
        });
      });

      // NOTE: cache-nuking removed 2026-07-02 - it deleted ALL CacheStorage
      // on every page load for every user, defeating any browser caching.
    }
  }, []);

  return null;
}