"use client";

import React from "react";
import Link from "next/link";
import { logError } from "@/lib/utils/errorLogger";
import './animations.css';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId?: string;
}

interface EnhancedErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ 
    error?: Error; 
    errorInfo?: React.ErrorInfo;
    resetError: () => void;
    errorId?: string;
  }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  level?: 'page' | 'section' | 'component';
}

class EnhancedErrorBoundary extends React.Component<
  EnhancedErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: EnhancedErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return { 
      hasError: true, 
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Enhanced Error Boundary caught an error:", error, errorInfo);
    
    this.setState({ errorInfo });
    
    // Log error with context
    logError(error, {
      component: `ErrorBoundary-${this.props.level || 'unknown'}`,
      artistId: undefined, // Could be passed as prop if needed
    });
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error details for debugging
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Details');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  resetError = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      errorId: undefined 
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent 
            error={this.state.error} 
            errorInfo={this.state.errorInfo}
            resetError={this.resetError}
            errorId={this.state.errorId}
          />
        );
      }

      return (
        <ErrorFallback 
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
          errorId={this.state.errorId}
          level={this.props.level}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error?: Error;
  errorInfo?: React.ErrorInfo;
  resetError: () => void;
  errorId?: string;
  level?: 'page' | 'section' | 'component';
}

function ErrorFallback({ 
  error, 
  errorInfo, 
  resetError, 
  errorId, 
  level = 'component' 
}: ErrorFallbackProps) {
  const isPageLevel = level === 'page';
  const isSectionLevel = level === 'section';

  const containerClass = isPageLevel 
    ? "min-h-screen bg-[var(--background)] flex items-center justify-center"
    : isSectionLevel
    ? "min-h-[200px] flex items-center justify-center"
    : "min-h-[100px] flex items-center justify-center";

  const contentClass = isPageLevel
    ? "text-center px-4 max-w-md"
    : "text-center px-4 max-w-sm";

  return (
    <div className={`${containerClass} progressive-fade-in`}>
      <div className={contentClass}>
        <div className="space-y-4">
          {/* Error Icon */}
          <div className={`${isPageLevel ? 'text-6xl' : 'text-4xl'} error-shake`}>
            {isPageLevel ? '💥' : '⚠️'}
          </div>
          
          {/* Error Message */}
          <div className="space-y-2">
            <h2 className={`${isPageLevel ? 'text-2xl' : 'text-lg'} font-bold text-[var(--foreground)]`}>
              {isPageLevel ? 'Something went wrong' : 'Error loading content'}
            </h2>
            <p className="text-[var(--foreground)]/70 text-sm">
              {isPageLevel 
                ? 'We encountered an unexpected error. This might be temporary.'
                : 'This section failed to load properly.'
              }
            </p>
          </div>

          {/* Error Details (development only) */}
          {process.env.NODE_ENV === 'development' && error && (
            <details className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-left">
              <summary className="text-sm font-medium text-red-800 dark:text-red-200 cursor-pointer">
                Error Details (Dev Mode)
              </summary>
              <div className="mt-2 space-y-2">
                <div>
                  <p className="text-xs font-medium text-red-700 dark:text-red-300">Message:</p>
                  <p className="text-xs text-red-600 dark:text-red-400 font-mono break-all">
                    {error.message}
                  </p>
                </div>
                {errorId && (
                  <div>
                    <p className="text-xs font-medium text-red-700 dark:text-red-300">Error ID:</p>
                    <p className="text-xs text-red-600 dark:text-red-400 font-mono">
                      {errorId}
                    </p>
                  </div>
                )}
                {errorInfo?.componentStack && (
                  <div>
                    <p className="text-xs font-medium text-red-700 dark:text-red-300">Component Stack:</p>
                    <pre className="text-xs text-red-600 dark:text-red-400 font-mono overflow-auto max-h-20">
                      {errorInfo.componentStack.trim()}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}

          {/* Action Buttons */}
          <div className={`flex ${isPageLevel ? 'flex-col sm:flex-row' : 'flex-col'} gap-2 justify-center`}>
            <button
              onClick={resetError}
              className="inline-flex items-center justify-center px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90 transition-colors text-sm font-medium smooth-transition"
            >
              Try Again
            </button>
            
            {isPageLevel && (
              <Link
                href="/"
                className="inline-flex items-center justify-center px-4 py-2 bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 text-[var(--foreground)] rounded-lg transition-colors text-sm font-medium smooth-transition"
              >
                Back to Map
              </Link>
            )}
          </div>

          {/* Help Text */}
          <div className="pt-2 border-t border-[var(--border)]">
            <p className="text-xs text-[var(--foreground)]/50">
              {isPageLevel 
                ? 'If this problem persists, please refresh the page.'
                : 'Try refreshing the page if the error continues.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnhancedErrorBoundary;