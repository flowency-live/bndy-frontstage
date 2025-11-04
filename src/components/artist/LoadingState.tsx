"use client";

import './animations.css';

interface LoadingStateProps {
  type?: 'profile' | 'events' | 'bio' | 'social' | 'generic';
  message?: string;
  className?: string;
}

export default function LoadingState({ 
  type = 'generic', 
  message, 
  className = '' 
}: LoadingStateProps) {
  const getLoadingContent = () => {
    switch (type) {
      case 'profile':
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full skeleton-shimmer" />
            <div className="space-y-2">
              <div className="h-4 skeleton-shimmer rounded w-32" />
              <div className="h-3 skeleton-shimmer rounded w-24" />
            </div>
          </div>
        );
      
      case 'events':
        return (
          <div className="space-y-3">
            {[1, 2].map((index) => (
              <div key={index} className={`flex gap-3 stagger-${index}`}>
                <div className="w-12 h-12 skeleton-shimmer rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 skeleton-shimmer rounded w-3/4" />
                  <div className="h-3 skeleton-shimmer rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'bio':
        return (
          <div className="space-y-2">
            <div className="h-4 skeleton-shimmer rounded w-full" />
            <div className="h-4 skeleton-shimmer rounded w-5/6" />
            <div className="h-4 skeleton-shimmer rounded w-4/5" />
          </div>
        );
      
      case 'social':
        return (
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((index) => (
              <div 
                key={index} 
                className={`w-8 h-8 skeleton-shimmer rounded stagger-${index}`} 
              />
            ))}
          </div>
        );
      
      default:
        return (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[var(--primary)] rounded-full pulse-loading" />
            <div className="h-4 skeleton-shimmer rounded w-24" />
          </div>
        );
    }
  };

  return (
    <div className={`progressive-fade-in ${className}`}>
      {getLoadingContent()}
      {message && (
        <p className="text-sm text-[var(--foreground)]/60 mt-2 progressive-fade-in">
          {message}
        </p>
      )}
    </div>
  );
}