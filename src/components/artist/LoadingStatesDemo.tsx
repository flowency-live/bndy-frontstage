"use client";

import { useState } from "react";
import ProgressiveLoader from "./ProgressiveLoader";
import ArtistNotFound from "./ArtistNotFound";
import EnhancedErrorBoundary from "./EnhancedErrorBoundary";
import LoadingStateManager from "./LoadingStateManager";

// Demo component to test all loading states
export default function LoadingStatesDemo() {
  const [currentDemo, setCurrentDemo] = useState<'progressive' | 'notfound' | 'error' | 'timeout'>('progressive');
  const [loadingStage, setLoadingStage] = useState<'initial' | 'profile' | 'events' | 'complete'>('initial');

  const ErrorComponent = () => {
    throw new Error("Demo error for testing error boundary");
  };

  return (
    <div className="min-h-screen bg-[var(--background)] p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-4">Loading States Demo</h1>
          
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setCurrentDemo('progressive')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentDemo === 'progressive' 
                  ? 'bg-[var(--primary)] text-white' 
                  : 'bg-[var(--foreground)]/10 text-[var(--foreground)]'
              }`}
            >
              Progressive Loading
            </button>
            <button
              onClick={() => setCurrentDemo('notfound')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentDemo === 'notfound' 
                  ? 'bg-[var(--primary)] text-white' 
                  : 'bg-[var(--foreground)]/10 text-[var(--foreground)]'
              }`}
            >
              Not Found
            </button>
            <button
              onClick={() => setCurrentDemo('error')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentDemo === 'error' 
                  ? 'bg-[var(--primary)] text-white' 
                  : 'bg-[var(--foreground)]/10 text-[var(--foreground)]'
              }`}
            >
              Error Boundary
            </button>
            <button
              onClick={() => setCurrentDemo('timeout')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentDemo === 'timeout' 
                  ? 'bg-[var(--primary)] text-white' 
                  : 'bg-[var(--foreground)]/10 text-[var(--foreground)]'
              }`}
            >
              Timeout Demo
            </button>
          </div>

          {currentDemo === 'progressive' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setLoadingStage('initial')}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded"
                >
                  Initial
                </button>
                <button
                  onClick={() => setLoadingStage('profile')}
                  className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded"
                >
                  Profile
                </button>
                <button
                  onClick={() => setLoadingStage('events')}
                  className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded"
                >
                  Events
                </button>
                <button
                  onClick={() => setLoadingStage('complete')}
                  className="px-3 py-1 text-sm bg-purple-100 text-purple-800 rounded"
                >
                  Complete
                </button>
              </div>
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <ProgressiveLoader stage={loadingStage} />
              </div>
            </div>
          )}

          {currentDemo === 'notfound' && (
            <div className="border border-[var(--border)] rounded-lg overflow-hidden">
              <ArtistNotFound 
                error="Demo artist not found error"
                artistId="demo-artist-123"
              />
            </div>
          )}

          {currentDemo === 'error' && (
            <div className="border border-[var(--border)] rounded-lg overflow-hidden">
              <EnhancedErrorBoundary level="page">
                <ErrorComponent />
              </EnhancedErrorBoundary>
            </div>
          )}

          {currentDemo === 'timeout' && (
            <div className="border border-[var(--border)] rounded-lg overflow-hidden">
              <LoadingStateManager
                isLoading={true}
                loadingStage="initial"
                timeout={3000} // 3 second timeout for demo
              >
                <div>This should timeout</div>
              </LoadingStateManager>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}