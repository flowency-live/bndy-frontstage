"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

interface LazyContentImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  fallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
  sizes?: string;
  quality?: number;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
  priority?: boolean;
}

export default function LazyContentImage({
  src,
  alt,
  width,
  height,
  className = "",
  fallback,
  onLoad,
  onError,
  sizes,
  quality = 75, // Lower quality for content images to improve performance
  placeholder = "blur",
  blurDataURL,
  priority = false
}: LazyContentImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLDivElement>(null);

  // Enhanced Intersection Observer for content below the fold
  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "150px", // Start loading 150px before coming into view for content images
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  // Generate optimized blur placeholder
  const generateBlurDataURL = (w: number, h: number) => {
    if (blurDataURL) return blurDataURL;
    
    const svg = `
      <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f8fafc;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#f1f5f9;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#e2e8f0;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)" />
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {/* Enhanced loading skeleton with content-specific styling */}
      {isLoading && isInView && (
        <div 
          className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse overflow-hidden"
          style={{ width, height }}
        >
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        </div>
      )}

      {/* Error state with enhanced fallback */}
      {hasError && fallback ? (
        <div className="flex items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200" style={{ width, height }}>
          {fallback}
        </div>
      ) : null}

      {/* Optimized image for content below fold */}
      {isInView && !hasError && (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={`transition-all duration-700 ease-out ${
            isLoading ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
          }`}
          priority={priority}
          quality={quality}
          sizes={sizes}
          placeholder={placeholder}
          blurDataURL={placeholder === "blur" ? generateBlurDataURL(width, height) : undefined}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            objectFit: 'cover',
            width: '100%',
            height: '100%'
          }}
          loading="lazy" // Always lazy for content images
          decoding="async"
        />
      )}

      {/* Lazy loading placeholder for content not yet in view */}
      {!isInView && !priority && (
        <div 
          className="bg-slate-100 animate-pulse flex items-center justify-center"
          style={{ width, height }}
        >
          <div className="text-slate-400 text-sm flex items-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </div>
        </div>
      )}
    </div>
  );
}