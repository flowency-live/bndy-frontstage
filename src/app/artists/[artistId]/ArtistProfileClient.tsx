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
import AvailabilityTab from "@/components/artist/tabs/AvailabilityTab";
import { getArtistAvailability } from "@/lib/services/artist-service";
import type { Event } from "@/lib/types";

interface ArtistProfileClientProps {
  initialData: ArtistProfileData | null;
  error?: string;
  artistId?: string;
}

export default function ArtistProfileClient({ initialData, error, artistId }: ArtistProfileClientProps) {
  const [isLoading] = useState(false);
  const [availability, setAvailability] = useState<Event[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") as "events" | "links" | "availability") || "events";

  // Fetch availability if artist publishes it
  useEffect(() => {
    async function fetchAvailability() {
      if (!artistId || !initialData?.publishAvailability) return;

      setLoadingAvailability(true);
      try {
        const availabilityData = await getArtistAvailability(artistId);
        setAvailability(availabilityData);
      } catch (error) {
        console.error('Failed to load availability:', error);
        setAvailability([]);
      } finally {
        setLoadingAvailability(false);
      }
    }

    fetchAvailability();
  }, [artistId, initialData?.publishAvailability]);

  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen bg-[var(--lv-bg)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-[var(--lv-text)]">Artist Not Found</h1>
          <p className="text-[var(--lv-text-2)]">{error}</p>
          <Link
            href="/"
            className="profile-btn primary"
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
      <div className="min-h-screen bg-[var(--lv-bg)]">
        <div className="animate-pulse">
          <div className="h-[200px] sm:h-[250px] lg:h-[300px] bg-[var(--lv-surface)] mb-6"></div>
          <div className="profile-wrap space-y-4">
            <div className="h-8 bg-[var(--lv-surface)] rounded w-1/3"></div>
            <div className="h-4 bg-[var(--lv-surface)] rounded w-2/3"></div>
            <div className="h-32 bg-[var(--lv-surface)] rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="artist-profile-page bg-[var(--lv-bg)] min-h-screen">
      {/* Hero Banner - DO NOT MODIFY (as per plan constraints) */}
      <ArtistHeroBanner
        socialMediaUrls={initialData.socialMediaUrls}
        artistId={initialData.id}
        artistName={initialData.name}
      />

      {/* Artist Info Section - Avatar overlaps banner via negative margin in profile-intro */}
      <ArtistInfo artist={initialData} />

      {/* Blurb (Bio) - italic quote style */}
      {initialData.bio && (
        <div className="profile-wrap">
          <p className="profile-blurb italic">"{initialData.bio}"</p>
        </div>
      )}

      {/* Genre Badges - Now in normal flow */}
      {initialData.genres && initialData.genres.length > 0 && (
        <div className="profile-wrap">
          <GenreBadges genres={initialData.genres} />
        </div>
      )}

      {/* Tab Navigation */}
      <TabNavigation
        artistId={initialData.id}
        hasVideos={false}
        publishAvailability={initialData.publishAvailability}
        eventCount={initialData.upcomingEvents.length}
        availabilityCount={availability.length}
      />

      {/* Tab Content */}
      <div className="py-6">
        <div className={activeTab === "events" ? "block" : "hidden"}>
          <EventsTab
            events={initialData.upcomingEvents}
            artistLocation={initialData.location}
          />
        </div>
        <div className={activeTab === "availability" ? "block" : "hidden"}>
          <AvailabilityTab
            availability={availability}
            loading={loadingAvailability}
          />
        </div>
        <div className={activeTab === "links" ? "block" : "hidden"}>
          <LinksTab />
        </div>
      </div>

      {/* Navigation Section */}
      <div className="profile-wrap pb-8 pt-4">
        <nav className="pt-8 mt-8 border-t border-[var(--lv-rule)]" aria-label="Page Navigation">
          <Link
            href="/"
            className="profile-btn"
          >
            ← Back to Map
          </Link>
        </nav>
      </div>
    </div>
  );
}