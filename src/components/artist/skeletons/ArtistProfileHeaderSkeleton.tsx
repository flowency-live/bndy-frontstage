"use client";

import '../animations.css';

export default function ArtistProfileHeaderSkeleton() {
  return (
    <div className="w-full bg-gradient-to-b from-[var(--primary)]/10 to-transparent progressive-fade-in">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8 sm:pt-8 sm:pb-12">
        <div className="flex flex-col items-center text-center space-y-4 sm:space-y-6">
          {/* Profile Image Skeleton */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 rounded-full skeleton-shimmer border-4 border-white shadow-lg progressive-scale-in" />

          {/* Artist Name Skeleton */}
          <div className="space-y-2">
            <div className="h-8 sm:h-10 lg:h-12 xl:h-14 skeleton-shimmer rounded-lg w-48 sm:w-64 lg:w-80 stagger-1" />
          </div>

          {/* Genre Tags Skeleton */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-xs sm:max-w-sm lg:max-w-md xl:max-w-lg px-4">
            {[1, 2, 3].map((index) => (
              <div
                key={index}
                className={`h-8 skeleton-shimmer rounded-full w-16 sm:w-20 stagger-${index + 1} progressive-slide-left`}
              />
            ))}
          </div>

          {/* Social Media Links Skeleton */}
          <div className="flex justify-center gap-3 sm:gap-4">
            {[1, 2, 3, 4].map((index) => (
              <div
                key={index}
                className={`w-10 h-10 sm:w-12 sm:h-12 skeleton-shimmer rounded-full stagger-${index + 3} progressive-scale-in`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}