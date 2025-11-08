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

      // Clear all caches
      if ('caches' in window) {
        caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => {
            caches.delete(cacheName);
            console.log('Cache deleted:', cacheName);
          });
        });
      }
    }
  }, []);

  return null;
}