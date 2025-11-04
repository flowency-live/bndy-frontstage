"use client";

import '../animations.css';

function EventCardSkeleton({ index }: { index: number }) {
  return (
    <div 
      className={`bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-4 sm:p-6 progressive-fade-in stagger-${index}`}
    >
      <div className="flex gap-4">
        {/* Date Section Skeleton */}
        <div className="flex-shrink-0">
          <div className="skeleton-shimmer rounded-lg p-3 min-w-[60px] h-[72px]" />
        </div>

        {/* Event Details Skeleton */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Event Name Skeleton */}
          <div className="h-6 skeleton-shimmer rounded w-3/4" />

          {/* Event Info Skeleton */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 skeleton-shimmer rounded" />
              <div className="h-4 skeleton-shimmer rounded w-20" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 skeleton-shimmer rounded" />
              <div className="h-4 skeleton-shimmer rounded w-32" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 skeleton-shimmer rounded" />
              <div className="h-4 skeleton-shimmer rounded w-16" />
            </div>
          </div>

          {/* Action Buttons Skeleton */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <div className="h-10 skeleton-shimmer rounded-lg w-32" />
            <div className="h-10 skeleton-shimmer rounded-lg w-28" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UpcomingEventsSkeleton() {
  return (
    <section className="space-y-4 sm:space-y-6 progressive-fade-in">
      {/* Section Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-7 sm:h-8 skeleton-shimmer rounded-lg w-40 stagger-1" />
        <div className="h-6 skeleton-shimmer rounded-full w-20 stagger-2" />
      </div>

      {/* Event Cards Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((index) => (
          <EventCardSkeleton key={index} index={index} />
        ))}
      </div>
    </section>
  );
}