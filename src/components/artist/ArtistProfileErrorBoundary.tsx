"use client";

import React from "react";
import Link from "next/link";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ArtistProfileErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

class ArtistProfileErrorBoundary extends React.Component<
  ArtistProfileErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ArtistProfileErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Artist Profile Error Boundary caught an error:", error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, resetError }: { error?: Error; resetError: () => void }) {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <div className="text-center px-4 max-w-md">
        <div className="space-y-6">
          {/* Error Icon */}
          <div className="text-6xl animate-pulse">⚠️</div>
          
          {/* Error Message */}
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              Something went wrong
            </h1>
            <p className="text-[var(--foreground)]/70 leading-relaxed">
              We encountered an unexpected error while loading the artist profile. 
              This might be a temporary issue.
            </p>
          </div>

          {/* Error Details (only in development) */}
          {process.env.NODE_ENV === 'development' && error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-left">
              <p className="text-sm text-red-800 dark:text-red-200 font-mono">
                {error.message}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={resetError}
              className="inline-flex items-center justify-center px-6 py-3 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90 transition-colors font-medium"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 text-[var(--foreground)] rounded-lg transition-colors font-medium"
            >
              Back to Map
            </Link>
          </div>

          {/* Additional Help */}
          <div className="pt-4 border-t border-[var(--border)]">
            <p className="text-sm text-[var(--foreground)]/60">
              If this problem persists, please try refreshing the page or contact support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ArtistProfileErrorBoundary;