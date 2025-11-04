"use client";

import { ArtistProfileData } from "@/lib/types/artist-profile";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useImagePreloader } from "@/lib/utils/imagePreloader";
import ArtistProfileHeader from "@/components/artist/ArtistProfileHeader";
import ArtistBio from "@/components/artist/ArtistBio";
import UpcomingEvents from "@/components/artist/UpcomingEvents";
import SocialShareSection from "@/components/artist/SocialShareSection";
import ArtistMetaTags from "@/components/artist/ArtistMetaTags";

import EnhancedErrorBoundary from "@/components/artist/EnhancedErrorBoundary";
import LoadingStateManager from "@/components/artist/LoadingStateManager";
import LazySection from "@/components/artist/LazySection";
import TouchGestureHandler from "@/components/artist/TouchGestureHandler";
import PerformanceMonitor from "@/components/artist/PerformanceMonitor";
import "@/components/artist/mobile-optimizations.css";
import "@/components/artist/page-transitions.css";

interface ArtistProfileClientProps {
  initialData: ArtistProfileData | null;
  error?: string;
  artistId?: string;
}



export default function ArtistProfileClient({ initialData, error, artistId }: ArtistProfileClientProps) {
  const [isLoading, setIsLoading] = useState(!initialData && !error);
  const [loadingStage, setLoadingStage] = useState<'initial' | 'profile' | 'events' | 'complete'>('initial');
  const { preloadBatch } = useImagePreloader();

  useEffect(() => {
    if (initialData) {
      // Preload critical images for better performance
      const imagesToPreload: string[] = [];
      
      if (initialData.profileImageUrl) {
        imagesToPreload.push(initialData.profileImageUrl);
      }
      
      // Preload any event images that might exist
      initialData.upcomingEvents.forEach(event => {
        if (event.imageUrl) {
          imagesToPreload.push(event.imageUrl);
        }
      });

      // Preload images in background
      if (imagesToPreload.length > 0) {
        preloadBatch(imagesToPreload, { priority: false }, 2, 50).catch(console.warn);
      }

      // Simulate progressive loading for better perceived performance
      const stages: typeof loadingStage[] = ['profile', 'events', 'complete'];
      let currentStageIndex = 0;

      const progressLoader = () => {
        if (currentStageIndex < stages.length) {
          setLoadingStage(stages[currentStageIndex]);
          currentStageIndex++;
          setTimeout(progressLoader, 200); // Smooth progression
        } else {
          setIsLoading(false);
        }
      };

      setTimeout(progressLoader, 100);
    } else if (error) {
      setIsLoading(false);
    }
  }, [initialData, error, preloadBatch]);

  // Use LoadingStateManager for comprehensive state handling
  if (error || isLoading || !initialData) {
    return (
      <LoadingStateManager
        isLoading={isLoading}
        error={error}
        data={initialData}
        loadingStage={loadingStage}
        artistId={artistId}
        timeout={15000} // 15 second timeout
      >
        {/* This will never render in loading/error states */}
        <div />
      </LoadingStateManager>
    );
  }

  const profileData = initialData;

  return (
    <EnhancedErrorBoundary level="page">
      {/* Performance monitoring for development */}
      <PerformanceMonitor />
      
      {/* Structured Data */}
      <ArtistMetaTags
        artistName={profileData.name}
        artistId={profileData.id}
        description={profileData.description}
        profileImageUrl={profileData.profileImageUrl}
        genres={profileData.genres}
        socialMediaURLs={profileData.socialMediaURLs}
        upcomingEvents={profileData.upcomingEvents}
      />

      <div className="min-h-screen bg-[var(--background)] mobile-optimized mobile-scroll-enhanced performance-critical page-enter" style={{ overflowY: 'auto', height: 'auto', minHeight: '100vh' }}>
        {/* Mobile-first responsive layout with proper spacing for header */}
        <div className="w-full pt-4 pb-8 safe-area-enhanced">
          {/* Profile Header - Mobile optimized with responsive design */}
          <TouchGestureHandler 
            className="performance-critical"
            enableHapticFeedback={true}
            onDoubleTap={() => {
              // Double tap to scroll to events section
              const eventsSection = document.querySelector('.upcoming-events-container');
              eventsSection?.scrollIntoView({ behavior: 'smooth' });
            }}
            onLongPress={() => {
              // Long press to share profile
              const shareSection = document.querySelector('.social-share-section');
              shareSection?.scrollIntoView({ behavior: 'smooth' });
            }}
            onSwipeUp={() => {
              // Swipe up to scroll to next section
              const eventsSection = document.querySelector('.upcoming-events-container');
              eventsSection?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <ArtistProfileHeader profileData={profileData} />
          </TouchGestureHandler>

          {/* Main Content - Mobile-first with proper spacing */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 performance-critical mobile-optimized-content">
            {/* Artist Bio - Smart content handling with collapsible functionality */}
            <LazySection 
              rootMargin="50px"
              fallback={
                <div className="skeleton-enhanced">
                  <div className="h-24 bg-gray-200 rounded-lg"></div>
                </div>
              }
            >
              <EnhancedErrorBoundary level="section">
                <div className="section-enter section-enter-delay-1">
                  <ArtistBio description={profileData.description} />
                </div>
              </EnhancedErrorBoundary>
            </LazySection>

            {/* Upcoming Events - Mobile-optimized cards with lazy loading */}
            <LazySection 
              rootMargin="100px"
              delay={100}
              fallback={
                <div className="skeleton-enhanced space-y-4">
                  <div className="h-8 bg-gray-200 rounded w-48"></div>
                  <div className="h-32 bg-gray-200 rounded-lg"></div>
                  <div className="h-32 bg-gray-200 rounded-lg"></div>
                </div>
              }
            >
              <EnhancedErrorBoundary level="section">
                <div className="section-enter section-enter-delay-2">
                  <UpcomingEvents events={profileData.upcomingEvents} />
                </div>
              </EnhancedErrorBoundary>
            </LazySection>

            {/* Social Sharing Section - Lazy loaded */}
            <LazySection 
              rootMargin="50px"
              delay={200}
              fallback={
                <div className="skeleton-enhanced">
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                </div>
              }
            >
              <EnhancedErrorBoundary level="section">
                <div className="section-enter section-enter-delay-3">
                  <SocialShareSection
                    artistName={profileData.name}
                    artistId={profileData.id}
                    description={profileData.description}
                  />
                </div>
              </EnhancedErrorBoundary>
            </LazySection>

            {/* Back to Map Link - Mobile-friendly */}
            <div className="pt-4 sm:pt-6 border-t border-[var(--border)] section-enter section-enter-delay-3">
              <TouchGestureHandler
                onTap={() => window.history.back()}
                className="touch-optimized"
                enableHapticFeedback={true}
              >
                <Link 
                  href="/" 
                  className="inline-flex items-center justify-center w-full sm:w-auto button-micro focus-enhanced nav-transition mobile-button-enhanced px-6 py-3 bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 text-[var(--foreground)] rounded-lg text-sm font-medium touch-target-enhanced mobile-focus-enhanced gpu-accelerated hover-enabled"
                >
                  ← Back to Map
                </Link>
              </TouchGestureHandler>
            </div>
          </div>
        </div>
      </div>
    </EnhancedErrorBoundary>
  );
}