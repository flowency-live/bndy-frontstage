"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Artist profile error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <div className="text-center px-4 max-w-lg">
        <div className="space-y-8">
          {/* Error Animation */}
          <div className="relative">
            <div className="text-8xl font-bold text-[var(--foreground)]/10 select-none">
              500
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-4xl animate-bounce">💥</div>
            </div>
          </div>

          {/* Error Message */}
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-[var(--foreground)]">
              Something went wrong
            </h1>
            <p className="text-lg text-[var(--foreground)]/70 leading-relaxed">
              We encountered an unexpected error while loading the artist profile. This might be temporary.
            </p>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-left">
                <summary className="text-sm font-medium text-red-800 dark:text-red-200 cursor-pointer">
                  Error Details (Development)
                </summary>
                <div className="mt-2 space-y-2">
                  <div>
                    <p className="text-xs font-medium text-red-700 dark:text-red-300">Message:</p>
                    <p className="text-xs text-red-600 dark:text-red-400 font-mono break-all">
                      {error.message}
                    </p>
                  </div>
                  {error.digest && (
                    <div>
                      <p className="text-xs font-medium text-red-700 dark:text-red-300">Digest:</p>
                      <p className="text-xs text-red-600 dark:text-red-400 font-mono">
                        {error.digest}
                      </p>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>

          {/* Suggestions */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              What you can try:
            </h2>
            <ul className="text-left space-y-2 text-[var(--foreground)]/70">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Refresh the page to try loading again</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Check your internet connection</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Try again in a few minutes</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center px-8 py-4 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90 transition-all duration-200 font-medium text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <span className="mr-2">🔄</span>
              Try Again
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-8 py-4 bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 text-[var(--foreground)] rounded-lg transition-all duration-200 font-medium text-lg"
            >
              <span className="mr-2">🗺️</span>
              Back to Map
            </Link>
          </div>

          {/* Decorative Elements */}
          <div className="flex justify-center space-x-4 opacity-30">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}