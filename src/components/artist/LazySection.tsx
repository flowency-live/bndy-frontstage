"use client";

import { useState, useRef, useEffect, ReactNode } from "react";

interface LazySectionProps {
  children: ReactNode;
  className?: string;
  threshold?: number;
  rootMargin?: string;
  fallback?: ReactNode;
  delay?: number;
  onError?: (error: Error) => void;
}

export default function LazySection({
  children,
  className = "",
  threshold = 0.1,
  rootMargin = "100px",
  fallback,
  delay = 0,
  onError
}: LazySectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [hasError, setHasError] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      // Check if IntersectionObserver is supported
      if (!window.IntersectionObserver) {
        // Fallback for older browsers - render immediately
        setShouldRender(true);
        setIsVisible(true);
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible(true);
              
              // Add delay if specified for staggered loading with requestAnimationFrame for better performance
              if (delay > 0) {
                setTimeout(() => {
                  requestAnimationFrame(() => setShouldRender(true));
                }, delay);
              } else {
                requestAnimationFrame(() => setShouldRender(true));
              }
              
              observer.disconnect();
            }
          });
        },
        {
          threshold,
          rootMargin
        }
      );

      if (sectionRef.current) {
        observer.observe(sectionRef.current);
      }

      return () => observer.disconnect();
    } catch (error) {
      console.error("LazySection error:", error);
      setHasError(true);
      if (onError && error instanceof Error) {
        onError(error);
      }
      // Fallback to immediate render on error
      setShouldRender(true);
      setIsVisible(true);
    }
  }, [threshold, rootMargin, delay, onError]);

  // Error state - still render children but without lazy loading
  if (hasError) {
    return (
      <div ref={sectionRef} className={className}>
        {children}
      </div>
    );
  }

  return (
    <div ref={sectionRef} className={className}>
      {shouldRender ? (
        <div 
          className={`transition-all duration-700 ease-out transform ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {children}
        </div>
      ) : (
        fallback || (
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-gradient-to-r from-[var(--foreground)]/5 via-[var(--foreground)]/10 to-[var(--foreground)]/5 rounded-lg"></div>
            <div className="h-24 bg-gradient-to-r from-[var(--foreground)]/5 via-[var(--foreground)]/10 to-[var(--foreground)]/5 rounded-lg"></div>
          </div>
        )
      )}
    </div>
  );
}