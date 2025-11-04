"use client";

import { useState, useEffect, ReactNode } from "react";
import ProgressiveLoader from "./ProgressiveLoader";
import ArtistNotFound from "./ArtistNotFound";
import EnhancedErrorBoundary from "./EnhancedErrorBoundary";

interface LoadingStateManagerProps {
  isLoading: boolean;
  error?: string | null;
  data?: any;
  children: ReactNode;
  loadingStage?: 'initial' | 'profile' | 'events' | 'complete';
  artistId?: string;
  retryFunction?: () => void;
  timeout?: number; // Timeout in milliseconds
}

export default function LoadingStateManager({
  isLoading,
  error,
  data,
  children,
  loadingStage = 'initial',
  artistId,
  retryFunction,
  timeout = 10000 // 10 second default timeout
}: LoadingStateManagerProps) {
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    if (isLoading && timeout > 0) {
      const timer = setTimeout(() => {
        setHasTimedOut(true);
      }, timeout);

      return () => clearTimeout(timer);
    }
  }, [isLoading, timeout]);

  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      setHasTimedOut(false);
      if (retryFunction) {
        retryFunction();
      }
    }
  };

  // Timeout error state
  if (hasTimedOut && isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center px-4 max-w-md">
          <div className="space-y-6">
            <div className="text-6xl">⏱️</div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-[var(--foreground)]">
                Taking longer than expected
              </h2>
              <p className="text-[var(--foreground)]/70">
                The artist profile is taking a while to load. This might be due to a slow connection.
              </p>
            </div>
            
            <div className="flex flex-col gap-3">
              {retryCount < maxRetries && retryFunction && (
                <button
                  onClick={handleRetry}
                  className="px-6 py-3 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90 transition-colors font-medium"
                >
                  Try Again ({maxRetries - retryCount} attempts left)
                </button>
              )}
              
              <button
                onClick={() => window.location.href = '/'}
                className="px-6 py-3 bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 text-[var(--foreground)] rounded-lg transition-colors font-medium"
              >
                Back to Map
              </button>
            </div>

            <div className="text-xs text-[var(--foreground)]/50">
              Timeout after {timeout / 1000} seconds
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <ArtistNotFound 
        error={error}
        artistId={artistId}
      />
    );
  }

  // Loading state
  if (isLoading) {
    return <ProgressiveLoader stage={loadingStage} />;
  }

  // Success state with error boundary
  return (
    <EnhancedErrorBoundary level="page">
      {children}
    </EnhancedErrorBoundary>
  );
}