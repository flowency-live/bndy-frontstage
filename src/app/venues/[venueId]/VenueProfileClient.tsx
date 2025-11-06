"use client";

import { useState, useEffect } from "react";
import { Event, Venue } from "@/lib/types";
import Link from "next/link";
import VenueHeader from "@/components/venue/VenueHeader";
import EventsList from "@/components/artist/EventsList";

interface VenueProfileClientProps {
  initialData: Venue | null;
  events: Event[];
  error?: string;
  venueId?: string;
}

export default function VenueProfileClient({ initialData, events, error, venueId }: VenueProfileClientProps) {
  const [isLoading] = useState(false);

  // Simple logging (client-side only to avoid hydration issues)
  useEffect(() => {
  }, [venueId, initialData, error]);

  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Venue Not Found</h1>
          <p className="text-muted-foreground">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            ← Back to Map
          </Link>
        </div>
      </div>
    );
  }

  // Handle loading state
  if (isLoading || !initialData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="h-64 bg-muted rounded-lg mb-6"></div>
          {/* Content skeleton */}
          <div className="container mx-auto px-4 space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background">
      {/* Venue Header */}
      <header>
        <VenueHeader venue={initialData} />
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-4 pt-4">
        {/* Events Section */}
        <section aria-label="Events at this venue">
          <EventsList
            events={events}
            artistLocation={initialData.address || `${initialData.location.lat}, ${initialData.location.lng}`}
          />
        </section>

        {/* Navigation Section */}
        <nav className="pt-8 mt-8 border-t border-border" aria-label="Page Navigation">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
          >
            ← Back to Map
          </Link>
        </nav>
      </div>
    </div>
  );
}
