"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Event, Venue } from "@/lib/types";
import Link from "next/link";
import VenueHeader from "@/components/venue/VenueHeader";
import TabNavigation from "@/components/venue/TabNavigation";
import EventsTab from "@/components/venue/tabs/EventsTab";
import LinksTab from "@/components/venue/tabs/LinksTab";

interface VenueProfileClientProps {
  initialData: Venue | null;
  events: Event[];
  error?: string;
  venueId?: string;
}

export default function VenueProfileClient({ initialData, events, error, venueId }: VenueProfileClientProps) {
  const [isLoading] = useState(false);
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") as "events" | "links") || "events";

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
    <div className="venue-profile-page bg-background min-h-screen">
      {/* Venue Header */}
      <VenueHeader venue={initialData} />

      {/* Tab Navigation */}
      <TabNavigation venueId={initialData.id} />

      {/* Tab Content */}
      <div className="py-6">
        <div className={activeTab === "events" ? "block" : "hidden"}>
          <EventsTab
            events={events}
            venueLocation={initialData.address || `${initialData.location.lat}, ${initialData.location.lng}`}
          />
        </div>
        <div className={activeTab === "links" ? "block" : "hidden"}>
          <LinksTab />
        </div>
      </div>

      {/* Navigation Section */}
      <div className="container mx-auto px-4 pb-8 pt-4">
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
