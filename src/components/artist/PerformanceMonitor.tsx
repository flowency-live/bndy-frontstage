"use client";

import { useEffect } from "react";

interface PerformanceMonitorProps {
  enabled?: boolean;
}

export default function PerformanceMonitor({ enabled = process.env.NODE_ENV === 'development' }: PerformanceMonitorProps) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Monitor Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          console.log('Navigation Timing:', {
            domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
            loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
            firstPaint: navEntry.responseEnd - navEntry.requestStart,
          });
        }

        if (entry.entryType === 'paint') {
          console.log(`${entry.name}: ${entry.startTime}ms`);
        }

        if (entry.entryType === 'largest-contentful-paint') {
          console.log(`LCP: ${entry.startTime}ms`);
        }

        if (entry.entryType === 'first-input') {
          const fidEntry = entry as PerformanceEventTiming;
          console.log(`FID: ${fidEntry.processingStart - fidEntry.startTime}ms`);
        }

        if (entry.entryType === 'layout-shift') {
          const clsEntry = entry as any;
          if (!clsEntry.hadRecentInput) {
            console.log(`CLS: ${clsEntry.value}`);
          }
        }
      });
    });

    // Observe different performance metrics
    try {
      observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
    } catch (e) {
      // Fallback for browsers that don't support all entry types
      observer.observe({ entryTypes: ['navigation', 'paint'] });
    }

    // Monitor memory usage (if available)
    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        console.log('Memory Usage:', {
          used: `${Math.round(memory.usedJSHeapSize / 1048576)}MB`,
          total: `${Math.round(memory.totalJSHeapSize / 1048576)}MB`,
          limit: `${Math.round(memory.jsHeapSizeLimit / 1048576)}MB`,
        });
      }
    };

    // Check memory every 30 seconds in development
    const memoryInterval = setInterval(checkMemory, 30000);

    // Monitor long tasks
    const longTaskObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        console.warn(`Long task detected: ${entry.duration}ms`);
      });
    });

    try {
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // Long task API not supported
    }

    return () => {
      observer.disconnect();
      longTaskObserver.disconnect();
      clearInterval(memoryInterval);
    };
  }, [enabled]);

  return null;
}