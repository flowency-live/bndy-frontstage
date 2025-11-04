"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { imagePreloader } from "@/lib/utils/imagePreloader";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  lazy?: boolean;
  fallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
  sizes?: string;
  quality?: number;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
  lazy = true,
  fallback,
  onLoad,
  onError,
  sizes,
  quality = 85,
  placeholder = "empty",
  blurDataURL
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy || priority);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading with enhanced performance
  useEffect(() => {
    if (!lazy || priority || isInView) return;

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
        rootMargin: "100px", // Start loading 100px before the image comes into view for better UX
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, priority, isInView]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
    
    // Mark image as loaded in preloader cache
    if (!imagePreloader.isLoaded(src)) {
      imagePreloader.preload(src, { priority }).catch(() => {
        // Silently handle preload errors
      });
    }
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  // Generate blur placeholder for better loading experience
  const generateBlurDataURL = (w: number, h: number) => {
    if (blurDataURL) return blurDataURL;
    
    // Create a simple gradient blur placeholder using data URL
    // This is more performant than canvas for small placeholders
    const svg = `
      <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f3f4f6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#e5e7eb;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)" />
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {/* Enhanced loading skeleton with shimmer effect */}
      {isLoading && isInView && (
        <div 
          className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse overflow-hidden"
          style={{ width, height }}
        >
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        </div>
      )}

      {/* Error state or fallback */}
      {hasError && fallback ? (
        <div className="flex items-center justify-center" style={{ width, height }}>
          {fallback}
        </div>
      ) : null}

      {/* Optimized image with enhanced loading states */}
      {isInView && !hasError && (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={`transition-all duration-500 ease-out ${
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
          // Add loading="lazy" for non-priority images
          loading={priority ? "eager" : "lazy"}
          // Add decoding="async" for better performance
          decoding="async"
        />
      )}

      {/* Lazy loading placeholder */}
      {!isInView && lazy && !priority && (
        <div 
          className="bg-gray-100 animate-pulse flex items-center justify-center"
          style={{ width, height }}
        >
          <div className="text-gray-400 text-sm">Loading...</div>
        </div>
      )}
    </div>
  );
}