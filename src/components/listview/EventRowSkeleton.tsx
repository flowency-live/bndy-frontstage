// src/components/listview/EventRowSkeleton.tsx
"use client";

interface EventRowSkeletonProps {
  count?: number;
}

export function EventRowSkeleton({ count = 3 }: EventRowSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="ev animate-pulse">
          {/* Time skeleton */}
          <div className="h-4 w-12 bg-lv-surface rounded skeleton-shimmer" />

          {/* Headline skeleton */}
          <div className="space-y-2">
            <div className="h-5 w-48 bg-lv-surface rounded skeleton-shimmer" />
            <div className="h-4 w-32 bg-lv-surface-2 rounded skeleton-shimmer" />
          </div>

          {/* Meta skeleton */}
          <div className="h-4 w-24 bg-lv-surface rounded skeleton-shimmer" />

          {/* Stub skeleton */}
          <div className="h-8 w-16 bg-lv-surface rounded skeleton-shimmer" />
        </div>
      ))}
    </>
  );
}

export function DateGroupSkeleton() {
  return (
    <div className="lv-date-group animate-pulse">
      {/* Date label skeleton */}
      <div className="lv-date-label">
        <div className="h-7 w-20 bg-lv-surface rounded skeleton-shimmer" />
        <div className="h-3 w-16 bg-lv-surface-2 rounded mt-2 skeleton-shimmer" />
        <div className="h-5 w-20 bg-lv-orange-soft rounded mt-3 skeleton-shimmer" />
      </div>

      {/* Events skeleton */}
      <div className="lv-date-events">
        <EventRowSkeleton count={3} />
      </div>
    </div>
  );
}
