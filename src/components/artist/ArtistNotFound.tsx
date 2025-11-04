"use client";

import Link from "next/link";

interface ArtistNotFoundProps {
  error?: string;
  artistId?: string;
}

export default function ArtistNotFound({ error, artistId }: ArtistNotFoundProps) {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <div className="text-center px-4 max-w-lg">
        <div className="space-y-8">
          {/* 404 Animation */}
          <div className="relative">
            <div className="text-8xl font-bold text-[var(--foreground)]/10 select-none">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-4xl animate-bounce">🎵</div>
            </div>
          </div>

          {/* Error Message */}
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-[var(--foreground)]">
              Artist Not Found
            </h1>
            <p className="text-lg text-[var(--foreground)]/70 leading-relaxed">
              {error || "The artist you're looking for doesn't exist or has been removed."}
            </p>
            
            {artistId && (
              <p className="text-sm text-[var(--foreground)]/50 font-mono bg-[var(--foreground)]/5 px-3 py-2 rounded">
                Artist ID: {artistId}
              </p>
            )}
          </div>

          {/* Suggestions */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              What you can do:
            </h2>
            <ul className="text-left space-y-2 text-[var(--foreground)]/70">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Check if the artist name is spelled correctly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Browse the map to discover other artists</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Try searching for similar artists or genres</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-8 py-4 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90 transition-all duration-200 font-medium text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <span className="mr-2">🗺️</span>
              Explore the Map
            </Link>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center px-8 py-4 bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 text-[var(--foreground)] rounded-lg transition-all duration-200 font-medium text-lg"
            >
              <span className="mr-2">←</span>
              Go Back
            </button>
          </div>

          {/* Decorative Elements */}
          <div className="flex justify-center space-x-4 opacity-30">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}