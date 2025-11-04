"use client";

import ArtistProfileHeaderSkeleton from "./skeletons/ArtistProfileHeaderSkeleton";
import ArtistBioSkeleton from "./skeletons/ArtistBioSkeleton";
import UpcomingEventsSkeleton from "./skeletons/UpcomingEventsSkeleton";
import SocialShareSectionSkeleton from "./skeletons/SocialShareSectionSkeleton";

export default function ArtistProfileSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Mobile-first responsive layout with proper spacing for header */}
      <div className="w-full pt-4 pb-8">
        {/* Profile Header Skeleton */}
        <ArtistProfileHeaderSkeleton />

        {/* Main Content Skeleton */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
          {/* Artist Bio Skeleton */}
          <ArtistBioSkeleton />

          {/* Upcoming Events Skeleton */}
          <UpcomingEventsSkeleton />

          {/* Social Sharing Section Skeleton */}
          <SocialShareSectionSkeleton />

          {/* Back to Map Link Skeleton */}
          <div className="pt-4 sm:pt-6 border-t border-[var(--border)]">
            <div className="h-12 bg-[var(--foreground)]/10 animate-pulse rounded-lg w-full sm:w-40" />
          </div>
        </div>
      </div>
    </div>
  );
}