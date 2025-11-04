"use client";

import { useState } from "react";
import ArtistProfileSkeleton from "./ArtistProfileSkeleton";
import ArtistNotFound from "./ArtistNotFound";
import LoadingState from "./LoadingState";
import ProgressiveLoader from "./ProgressiveLoader";
import EnhancedErrorBoundary from "./EnhancedErrorBoundary";

// Demo component to test all loading states and error handling
export default function LoadingStateDemo() {
  const [currentDemo, setCurrentDemo] = useState<string>('skeleton');

  const demos = [
    { id: 'skeleton', name: 'Full Page Skeleton' },
    { id: 'progressive', name: 'Progressive Loading' },
    { id: 'notfound', name: '404 Not Found' },
    { id: 'loadingstates', name: 'Individual Loading States' },
    { id: 'errorboundary', name: 'Error Boundary' },
  ];

  const renderDemo = () => {
    switch (currentDemo) {
      case 'skeleton':
        return <ArtistProfileSkeleton />;
      
      case 'progressive':
        return <ProgressiveLoader stage="events" />;
      
      case 'notfound':
        return <ArtistNotFound error="This is a demo of the 404 page" artistId="demo-artist-123" />;
      
      case 'loadingstates':
        return (
          <div className="min-h-screen bg-[var(--background)] p-8 space-y-8">
            <h1 className="text-2xl font-bold">Individual Loading States</h1>
            
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-2">Profile Loading</h2>
                <LoadingState type="profile" message="Loading artist profile..." />
              </div>
              
              <div>
                <h2 className="text-lg font-semibold mb-2">Events Loading</h2>
                <LoadingState type="events" message="Loading upcoming events..." />
              </div>
              
              <div>
                <h2 className="text-lg font-semibold mb-2">Bio Loading</h2>
                <LoadingState type="bio" message="Loading artist bio..." />
              </div>
              
              <div>
                <h2 className="text-lg font-semibold mb-2">Social Loading</h2>
                <LoadingState type="social" message="Loading social links..." />
              </div>
              
              <div>
                <h2 className="text-lg font-semibold mb-2">Generic Loading</h2>
                <LoadingState type="generic" message="Loading content..." />
              </div>
            </div>
          </div>
        );
      
      case 'errorboundary':
        return (
          <EnhancedErrorBoundary level="page">
            <ErrorTrigger />
          </EnhancedErrorBoundary>
        );
      
      default:
        return <div>Select a demo</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Demo Controls */}
      <div className="fixed top-4 left-4 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-lg">
        <h3 className="font-semibold mb-2">Loading States Demo</h3>
        <div className="space-y-2">
          {demos.map((demo) => (
            <button
              key={demo.id}
              onClick={() => setCurrentDemo(demo.id)}
              className={`block w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                currentDemo === demo.id
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {demo.name}
            </button>
          ))}
        </div>
      </div>

      {/* Demo Content */}
      <div className="ml-64">
        {renderDemo()}
      </div>
    </div>
  );
}

// Component that throws an error for testing error boundary
function ErrorTrigger() {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    throw new Error("This is a test error for the error boundary demo");
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <button
        onClick={() => setShouldError(true)}
        className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
      >
        Trigger Error
      </button>
    </div>
  );
}