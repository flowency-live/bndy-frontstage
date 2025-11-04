"use client";

import { useState, useEffect } from "react";
import ArtistProfileHeaderSkeleton from "./skeletons/ArtistProfileHeaderSkeleton";
import ArtistBioSkeleton from "./skeletons/ArtistBioSkeleton";
import UpcomingEventsSkeleton from "./skeletons/UpcomingEventsSkeleton";
import SocialShareSectionSkeleton from "./skeletons/SocialShareSectionSkeleton";

interface ProgressiveLoaderProps {
  stage: 'initial' | 'profile' | 'events' | 'complete';
  children?: React.ReactNode;
}

export default function ProgressiveLoader({ stage, children }: ProgressiveLoaderProps) {
  const [currentStage, setCurrentStage] = useState<typeof stage>('initial');

  useEffect(() => {
    // Simulate progressive loading stages with smooth transitions
    const stageOrder: (typeof stage)[] = ['initial', 'profile', 'events', 'complete'];
    const currentIndex = stageOrder.indexOf(stage);
    const targetIndex = stageOrder.indexOf(currentStage);

    if (currentIndex > targetIndex) {
      // Progress forward through stages with realistic timing
      const timer = setTimeout(() => {
        const nextIndex = targetIndex + 1;
        if (nextIndex < stageOrder.length) {
          setCurrentStage(stageOrder[nextIndex]);
        }
      }, 200 + (targetIndex * 100)); // Progressive delay for better perceived performance

      return () => clearTimeout(timer);
    } else {
      setCurrentStage(stage);
    }
  }, [stage, currentStage]);

  if (currentStage === 'complete' && children) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Progress Indicator */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="h-1 bg-[var(--foreground)]/10">
          <div 
            className="h-full bg-gradient-to-r from-[var(--primary)] via-blue-500 to-purple-500 transition-all duration-700 ease-out relative"
            style={{
              width: currentStage === 'initial' ? '25%' : 
                     currentStage === 'profile' ? '50%' : 
                     currentStage === 'events' ? '75%' : '100%'
            }}
          >
            {/* Shimmer effect on progress bar */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
          </div>
        </div>
      </div>

      <div className="w-full pt-4 pb-8">
        {/* Header - Always show skeleton initially */}
        {currentStage === 'initial' && <ArtistProfileHeaderSkeleton />}
        
        {/* Progressive content loading */}
        {currentStage !== 'initial' && (
          <>
            {/* Show actual header if available, otherwise skeleton */}
            <ArtistProfileHeaderSkeleton />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
              {/* Bio Section */}
              {currentStage === 'profile' ? (
                <ArtistBioSkeleton />
              ) : currentStage === 'events' || currentStage === 'complete' ? (
                <ArtistBioSkeleton />
              ) : null}

              {/* Events Section */}
              {currentStage === 'events' || currentStage === 'complete' ? (
                <UpcomingEventsSkeleton />
              ) : null}

              {/* Social Share Section */}
              {currentStage === 'complete' && (
                <SocialShareSectionSkeleton />
              )}

              {/* Back to Map Link Skeleton */}
              <div className="pt-4 sm:pt-6 border-t border-[var(--border)]">
                <div className="h-12 bg-[var(--foreground)]/10 animate-pulse rounded-lg w-full sm:w-40" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Loading Status Text */}
      <div className="fixed bottom-4 right-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg px-4 py-2 shadow-lg">
        <div className="flex items-center gap-2 text-sm text-[var(--foreground)]/70">
          <div className="w-2 h-2 bg-[var(--primary)] rounded-full animate-pulse" />
          <span>
            {currentStage === 'initial' && 'Loading artist profile...'}
            {currentStage === 'profile' && 'Loading artist details...'}
            {currentStage === 'events' && 'Loading upcoming events...'}
            {currentStage === 'complete' && 'Almost ready...'}
          </span>
        </div>
      </div>
    </div>
  );
}