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
import VideosTab from "@/components/artist/tabs/VideosTab";
import AvailabilityTab from "@/components/artist/tabs/AvailabilityTab";

interface ArtistProfileClientProps {
  initialData: ArtistProfileData | null;
  error?: string;
  artistId?: string;
}

export default function ArtistProfileClient({ initialData, error, artistId }: ArtistProfileClientProps) {
  const [isLoading] = useState(false);
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") as "events" | "videos" | "availability") || "events";

  // Simple logging (client-side only to avoid hydration issues)
  useEffect(() => {
  }, [artistId, initialData, error]);

  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
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
      <div className="min-h-screen bg-background">
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
    <div className="bg-background min-h-screen">
      {/* Hero Banner with transparent controls, social icons, and genre badges */}
      <div className="relative">
        <ArtistHeroBanner
          socialMediaUrls={initialData.socialMediaUrls}
          artistId={initialData.id}
          artistName={initialData.name}
        />

        {/* Genre Badges - Overlapping bottom of banner */}
        {initialData.genres && initialData.genres.length > 0 && (
          <GenreBadges genres={initialData.genres} />
        )}
      </div>

      {/* Artist Info Section */}
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
        {activeTab === "events" && (
          <EventsTab
            events={initialData.upcomingEvents}
            artistLocation={initialData.location}
          />
        )}
        {activeTab === "videos" && <VideosTab />}
        {activeTab === "availability" && <AvailabilityTab />}
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