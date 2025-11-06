/**
 * Mobile-specific optimization utilities
 * Helps reduce bundle size and improve mobile performance
 */
import React from 'react';

// Lazy load heavy components only when needed - simplified version
export const createLazyComponent = <T extends React.ComponentType>(
  importFn: () => Promise<{ default: T }>
) => {
  return React.lazy(importFn);
};

// Detect mobile device capabilities
export const getMobileCapabilities = () => {
  if (typeof window === 'undefined') return {};
  
  return {
    hasTouch: 'ontouchstart' in window,
    hasHover: window.matchMedia('(hover: hover)').matches,
    hasPointerFine: window.matchMedia('(pointer: fine)').matches,
    hasReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    hasHighContrast: window.matchMedia('(prefers-contrast: high)').matches,
    isDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
    isLandscape: window.matchMedia('(orientation: landscape)').matches,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio || 1,
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
    isAndroid: /Android/.test(navigator.userAgent),
    isMobile: /Mobi|Android/i.test(navigator.userAgent),
    supportsWebP: (() => {
      const canvas = document.createElement('canvas');
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    })(),
    supportsAvif: (() => {
      const canvas = document.createElement('canvas');
      return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
    })(),
    connectionType: (navigator as { connection?: { effectiveType?: string } }).connection?.effectiveType || 'unknown',
    isSlowConnection: (navigator as { connection?: { effectiveType?: string } }).connection?.effectiveType === 'slow-2g' || 
                     (navigator as { connection?: { effectiveType?: string } }).connection?.effectiveType === '2g'
  };
};

// Optimize images for mobile
export const getOptimizedImageProps = (
  src: string,
  alt: string,
  options: {
    priority?: boolean;
    sizes?: string;
    quality?: number;
    placeholder?: 'blur' | 'empty';
    blurDataURL?: string;
  } = {}
) => {
  const capabilities = getMobileCapabilities();
  
  return {
    src,
    alt,
    quality: capabilities.isSlowConnection ? 70 : (options.quality || 85),
    priority: options.priority || false,
    sizes: options.sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
    placeholder: options.placeholder || 'blur',
    blurDataURL: options.blurDataURL || 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==',
    loading: options.priority ? 'eager' : 'lazy',
    decoding: 'async',
    style: {
      maxWidth: '100%',
      height: 'auto',
    }
  };
};

// Debounce function for performance
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  immediate?: boolean
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
};

// Throttle function for scroll events
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Intersection Observer for lazy loading
export const createIntersectionObserver = (
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit = {}
) => {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }
  
  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  });
};

// Preload critical resources
export const preloadCriticalResources = (resources: string[]) => {
  if (typeof window === 'undefined') return;
  
  resources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource;
    
    // Determine resource type
    if (resource.match(/\.(woff2?|ttf|eot)$/)) {
      link.as = 'font';
      link.crossOrigin = 'anonymous';
    } else if (resource.match(/\.(jpg|jpeg|png|webp|avif|svg)$/)) {
      link.as = 'image';
    } else if (resource.match(/\.(css)$/)) {
      link.as = 'style';
    } else if (resource.match(/\.(js)$/)) {
      link.as = 'script';
    }
    
    document.head.appendChild(link);
  });
};

// Memory management for mobile
export const cleanupResources = () => {
  if (typeof window === 'undefined') return;
  
  // Clean up any unused event listeners
  // Force garbage collection if available (development only)
  if (process.env.NODE_ENV === 'development') {
    const windowWithGc = window as { gc?: () => void };
    if (windowWithGc.gc) {
      windowWithGc.gc();
    }
  }
};

// Performance monitoring
export const measurePerformance = (name: string, fn: () => void) => {
  if (typeof window === 'undefined' || !window.performance) {
    fn();
    return;
  }
  
  const start = performance.now();
  fn();
  const end = performance.now();
};

