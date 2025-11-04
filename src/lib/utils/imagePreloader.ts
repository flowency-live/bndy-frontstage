/**
 * Image preloader utility for optimizing image loading performance
 */

interface PreloadOptions {
  priority?: boolean;
  sizes?: string;
  quality?: number;
}

class ImagePreloader {
  private cache = new Map<string, Promise<void>>();
  private loadedImages = new Set<string>();

  /**
   * Preload an image with optional optimization parameters
   */
  preload(src: string, options: PreloadOptions = {}): Promise<void> {
    // Return cached promise if already loading/loaded
    if (this.cache.has(src)) {
      return this.cache.get(src)!;
    }

    // Return resolved promise if already loaded
    if (this.loadedImages.has(src)) {
      return Promise.resolve();
    }

    const loadPromise = new Promise<void>((resolve, reject) => {
      const img = new Image();
      
      // Set up image attributes for optimization
      if (options.sizes) {
        img.sizes = options.sizes;
      }
      
      // Use loading="eager" for priority images
      if (options.priority) {
        img.loading = 'eager';
      } else {
        img.loading = 'lazy';
      }
      
      img.decoding = 'async';
      
      img.onload = () => {
        this.loadedImages.add(src);
        this.cache.delete(src); // Clean up cache
        resolve();
      };
      
      img.onerror = () => {
        this.cache.delete(src); // Clean up cache on error
        reject(new Error(`Failed to load image: ${src}`));
      };
      
      img.src = src;
    });

    this.cache.set(src, loadPromise);
    return loadPromise;
  }

  /**
   * Preload multiple images with staggered loading to avoid overwhelming the browser
   */
  async preloadBatch(
    sources: string[], 
    options: PreloadOptions = {},
    batchSize: number = 3,
    delay: number = 100
  ): Promise<void> {
    const batches = [];
    
    // Split sources into batches
    for (let i = 0; i < sources.length; i += batchSize) {
      batches.push(sources.slice(i, i + batchSize));
    }

    // Process batches with delay
    for (const batch of batches) {
      await Promise.allSettled(
        batch.map(src => this.preload(src, options))
      );
      
      // Add delay between batches to prevent overwhelming the browser
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Check if an image is already loaded
   */
  isLoaded(src: string): boolean {
    return this.loadedImages.has(src);
  }

  /**
   * Clear the preloader cache and loaded images set
   */
  clear(): void {
    this.cache.clear();
    this.loadedImages.clear();
  }

  /**
   * Get cache statistics for debugging
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      loadedCount: this.loadedImages.size
    };
  }
}

// Export singleton instance
export const imagePreloader = new ImagePreloader();

/**
 * Hook for preloading images in React components
 */
export function useImagePreloader() {
  return {
    preload: imagePreloader.preload.bind(imagePreloader),
    preloadBatch: imagePreloader.preloadBatch.bind(imagePreloader),
    isLoaded: imagePreloader.isLoaded.bind(imagePreloader),
    clear: imagePreloader.clear.bind(imagePreloader),
    getStats: imagePreloader.getStats.bind(imagePreloader)
  };
}

/**
 * Utility function to generate optimized image URLs for Next.js
 */
export function getOptimizedImageUrl(
  src: string, 
  width: number, 
  quality: number = 75
): string {
  // For Next.js Image optimization
  const params = new URLSearchParams({
    url: src,
    w: width.toString(),
    q: quality.toString()
  });
  
  return `/_next/image?${params.toString()}`;
}

/**
 * Generate responsive image sizes string
 */
export function generateImageSizes(breakpoints: { [key: string]: number }): string {
  const sizes = Object.entries(breakpoints)
    .map(([media, size]) => `${media} ${size}px`)
    .join(', ');
  
  return sizes;
}

/**
 * Common responsive sizes for artist profile images
 */
export const RESPONSIVE_SIZES = {
  profile: generateImageSizes({
    '(max-width: 640px)': 80,
    '(max-width: 1024px)': 96,
    '(min-width: 1025px)': 128
  }),
  eventCard: generateImageSizes({
    '(max-width: 640px)': 60,
    '(max-width: 1024px)': 80,
    '(min-width: 1025px)': 100
  }),
  content: generateImageSizes({
    '(max-width: 640px)': 300,
    '(max-width: 1024px)': 400,
    '(min-width: 1025px)': 500
  })
};