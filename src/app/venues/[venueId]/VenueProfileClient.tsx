"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Event, Venue, getSocialMediaURLs } from "@/lib/types";
import Link from "next/link";
import VenueHeroBanner from "@/components/venue/VenueHeroBanner";
import VenueInfo from "@/components/venue/VenueInfo";
import VenueInfoStrip from "@/components/venue/VenueInfoStrip";
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
  const activeTab = (searchParams.get("tab") as "events" | "about" | "photos") || "events";

  // Simple logging (client-side only to avoid hydration issues)
  useEffect(() => {
  }, [venueId, initialData, error]);

  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen bg-[var(--lv-bg)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-[var(--lv-text)]">Venue Not Found</h1>
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
          <div className="h-64 bg-[var(--lv-surface)]"></div>
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
    <div className="venue-profile-page bg-[var(--lv-bg)] min-h-screen">
      {/* Hero Banner - DO NOT MODIFY (as per plan constraints) */}
      <VenueHeroBanner
        socialMediaUrls={getSocialMediaURLs(initialData)}
        venueId={initialData.id}
        venueName={initialData.name}
      />

      {/* Venue Info Section - Avatar overlaps banner via negative margin in profile-intro */}
      <VenueInfo venue={initialData} />

      {/* Blurb (Description) */}
      {initialData.description && (
        <div className="profile-wrap">
          <p className="profile-blurb">{initialData.description}</p>
        </div>
      )}

      {/* Venue Info Strip - Type, Capacity, Avg Door */}
      <div className="profile-wrap">
        <VenueInfoStrip
          venueType={initialData.facilities?.join(" · ") || "Live Music Venue"}
          standardTicketed={initialData.standardTicketed}
        />
      </div>

      {/* Tab Navigation */}
      <TabNavigation
        venueId={initialData.id}
        eventCount={events.length}
      />

      {/* Tab Content */}
      <div className="py-2">
        <div className={activeTab === "events" ? "block" : "hidden"}>
          <EventsTab
            events={events}
            venueLocation={initialData.address || `${initialData.location.lat}, ${initialData.location.lng}`}
          />
        </div>
        <div className={activeTab === "about" ? "block" : "hidden"}>
          <LinksTab />
        </div>
      </div>

      {/* Navigation Section */}
      <div className="profile-wrap pb-4 pt-2">
        <nav className="pt-4 mt-4 border-t border-[var(--lv-rule)]" aria-label="Page Navigation">
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
