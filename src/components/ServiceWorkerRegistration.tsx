"use client";

import { useEffect } from "react";
import { registerServiceWorker, isMobile } from "@/lib/utils/serviceWorker";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // Only register service worker on mobile devices for better performance
    if (isMobile() && process.env.NODE_ENV === 'production') {
      registerServiceWorker();
    }
  }, []);

  return null;
}