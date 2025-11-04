"use client";

import '../animations.css';

export default function SocialShareSectionSkeleton() {
  return (
    <section className="space-y-4 progressive-fade-in">
      {/* Section Header Skeleton */}
      <div className="h-6 sm:h-7 skeleton-shimmer rounded-lg w-32 stagger-1" />
      
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-4 sm:p-6">
        <div className="space-y-4">
          {/* Share buttons skeleton */}
          <div className="flex flex-wrap gap-3">
            {[1, 2, 3, 4].map((index) => (
              <div
                key={index}
                className={`h-10 skeleton-shimmer rounded-lg w-24 stagger-${index + 1}`}
              />
            ))}
          </div>

          {/* Copy link skeleton */}
          <div className="pt-2 border-t border-[var(--border)]">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-10 skeleton-shimmer rounded-lg stagger-5" />
              <div className="h-10 skeleton-shimmer rounded-lg w-20 stagger-5" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}