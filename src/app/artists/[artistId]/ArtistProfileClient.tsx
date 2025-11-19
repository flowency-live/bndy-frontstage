"use client";

import { ArtistProfileData } from "@/lib/types/artist-profile";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ArtistHeroBanner from "@/components/artist/ArtistHeroBanner";
import GenreBadges from "@/components/artist/GenreBadges";
import ArtistInfo from "@/components/artist/ArtistInfo";
import TabNavigation from "@/components/artist/TabNavigation";
import EventsTab from "@/components/artist/tabs/EventsTab";
import LinksTab from "@/components/artist/tabs/LinksTab";

interface ArtistProfileClientProps {
  initialData: ArtistProfileData | null;
  error?: string;
  artistId?: string;
}

export default function ArtistProfileClient({ initialData, error, artistId }: ArtistProfileClientProps) {
  const [isLoading] = useState(false);
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") as "events" | "links") || "events";

  // Simple logging (client-side only to avoid hydration issues)
  useEffect(() => {
  }, [artistId, initialData, error]);

  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Artist Not Found</h1>
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
      <div className="min-h-screen bg-white dark:bg-background">
        <div className="animate-pulse">
          {/* Banner skeleton - matches ArtistHeroBanner heights */}
          <div className="h-[200px] sm:h-[250px] lg:h-[300px] bg-muted mb-6"></div>
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
    <div className="artist-profile-page bg-white dark:bg-background min-h-screen">
      {/*
        LAYOUT STRUCTURE - DO NOT MODIFY HIERARCHY

        This layout is carefully structured to maintain correct positioning:
        1. ArtistHeroBanner: Fixed height banner (200px/250px/300px) with social icons absolutely positioned bottom-right
        2. GenreBadges: Absolutely positioned (does NOT affect layout flow) - sits below banner, right-aligned
        3. ArtistInfo: Avatar uses negative margin (-mt-16/-mt-20/-mt-24) to overlap banner by exactly half its height

        CRITICAL: Genre badges MUST remain absolutely positioned. If moved into normal flow, avatar will be pushed down.
        CRITICAL: Avatar negative margin values are calibrated to position center at banner/background boundary.
        CRITICAL: Social icons are absolutely positioned within banner - independent of other elements.
      */}

      {/* Hero Banner with transparent controls and social icons */}
      <ArtistHeroBanner
        socialMediaUrls={initialData.socialMediaUrls}
        artistId={initialData.id}
        artistName={initialData.name}
      />

      {/* Genre Badges - ABSOLUTELY POSITIONED (does not affect layout flow) */}
      {initialData.genres && initialData.genres.length > 0 && (
        <div className="relative pointer-events-none">
          <div className="absolute top-0 left-0 right-0 z-10 pointer-events-auto">
            <GenreBadges genres={initialData.genres} />
          </div>
        </div>
      )}

      {/* Artist Info Section - Avatar overlaps banner via negative margin */}
      <div className="mb-8">
        <ArtistInfo artist={initialData} />
      </div>

      {/* Tab Navigation */}
      <TabNavigation
        artistId={initialData.id}
        hasVideos={false}
        publishAvailability={false}
      />

      {/* Tab Content */}
      <div className="py-6">
        <div className={activeTab === "events" ? "block" : "hidden"}>
          <EventsTab
            events={initialData.upcomingEvents}
            artistLocation={initialData.location}
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