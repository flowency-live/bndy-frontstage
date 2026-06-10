'use client';

// src/components/shared/EventDisclaimer.tsx
// Event accuracy disclaimer component (FS-10)
// Unintrusive disclaimer for all event-displaying screens

import { useState, useEffect } from 'react';
import { X, Info } from 'lucide-react';

const STORAGE_KEY = 'bndy-disclaimer-dismissed';

type DisclaimerVariant = 'inline' | 'banner' | 'compact';

interface EventDisclaimerProps {
  variant?: DisclaimerVariant;
}

export default function EventDisclaimer({ variant = 'inline' }: EventDisclaimerProps) {
  const [isDismissed, setIsDismissed] = useState(true); // Start hidden to prevent flash

  useEffect(() => {
    // Check localStorage on mount
    const dismissed = localStorage.getItem(STORAGE_KEY) === 'true';
    setIsDismissed(dismissed);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  if (isDismissed) {
    return null;
  }

  // Compact variant - minimal text
  if (variant === 'compact') {
    return (
      <div
        role="note"
        className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground bg-muted/50 dark:bg-muted/30 rounded"
      >
        <Info className="w-3 h-3 flex-shrink-0" />
        <span>
          Events subject to change - click profiles for latest info
        </span>
        <button
          type="button"
          onClick={handleDismiss}
          className="ml-auto p-0.5 hover:bg-background/50 rounded"
          aria-label="Dismiss"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  // Banner variant - fixed at bottom
  if (variant === 'banner') {
    return (
      <div
        role="note"
        className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 dark:bg-background/95 backdrop-blur-sm border-t border-border shadow-lg"
      >
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Info className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <p className="text-sm text-muted-foreground flex-1">
            <span className="font-medium text-foreground">Events subject to change</span>
            {' '}- check venue/artist for accuracy.{' '}
            <span className="text-xs opacity-75">
              Click artist or venue names to view their profiles for the latest info.
            </span>
          </p>
          <button
            type="button"
            onClick={handleDismiss}
            className="px-3 py-1 text-xs font-medium bg-primary/10 hover:bg-primary/20 text-primary rounded transition-colors"
            aria-label="Got it"
          >
            Got it
          </button>
        </div>
      </div>
    );
  }

  // Default inline variant
  return (
    <div
      role="note"
      className="flex items-start gap-3 px-4 py-3 bg-muted/30 dark:bg-muted/20 border border-border/50 rounded-lg"
    >
      <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Events subject to change</span>
          {' '}- check venue/artist for accuracy.{' '}
          <span className="text-xs opacity-75">
            Click artist or venue names to view their profiles for the latest info.
          </span>
        </p>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="p-1 hover:bg-background/50 rounded transition-colors flex-shrink-0"
        aria-label="Close"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
}
