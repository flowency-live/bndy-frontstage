"use client";

import '../animations.css';

export default function ArtistBioSkeleton() {
  return (
    <section className="space-y-3 sm:space-y-4 progressive-fade-in">
      <div className="h-6 sm:h-7 skeleton-shimmer rounded-lg w-20 stagger-1" />
      
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-4 sm:p-6 progressive-slide-left">
        <div className="space-y-3">
          {/* Bio text lines skeleton */}
          <div className="space-y-2">
            <div className="h-4 skeleton-shimmer rounded w-full stagger-2" />
            <div className="h-4 skeleton-shimmer rounded w-5/6 stagger-3" />
            <div className="h-4 skeleton-shimmer rounded w-4/5 stagger-4" />
            <div className="h-4 skeleton-shimmer rounded w-3/4 stagger-5" />
          </div>

          {/* Show more button skeleton */}
          <div className="pt-2">
            <div className="h-4 skeleton-shimmer rounded w-24 stagger-5" />
          </div>
        </div>
      </div>
    </section>
  );
}