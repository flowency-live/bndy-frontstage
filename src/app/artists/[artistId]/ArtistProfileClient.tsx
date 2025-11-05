"use client";

import { ArtistProfileData } from "@/lib/types/artist-profile";
import { useState, useEffect } from "react";
import Link from "next/link";
import ArtistHeader from "@/components/artist/ArtistHeader";
import EventsList from "@/components/artist/EventsList";
import SocialShareSection from "@/components/artist/SocialShareSection";

interface ArtistProfileClientProps {
  initialData: ArtistProfileData | null;
  error?: string;
  artistId?: string;
}

export default function ArtistProfileClient({ initialData, error, artistId }: ArtistProfileClientProps) {
  // IMMEDIATE CLIENT-SIDE DEBUG - Logs on every render
  console.log("=== CLIENT RENDER START ===");
  console.log("CLIENT RENDER: artistId =", artistId);
  console.log("CLIENT RENDER: error =", error);
  console.log("CLIENT RENDER: initialData =", initialData ? "HAS DATA" : "NULL");
  if (initialData) {
    console.log("CLIENT RENDER: Artist name =", initialData.name);
  }
  console.log("=== CLIENT RENDER END ===");

  const [isLoading] = useState(false);

  // CLIENT-SIDE DEBUG LOGGING - After mount
  useEffect(() => {
    console.log("=== CLIENT: ArtistProfileClient mounted (useEffect) ===");
    console.log("CLIENT useEffect: artistId prop:", artistId);
    console.log("CLIENT useEffect: error prop:", error);
    console.log("CLIENT useEffect: initialData prop:", initialData);
    if (initialData) {
      console.log("CLIENT useEffect: Artist name from initialData:", initialData.name);
      console.log("CLIENT useEffect: Full initialData:", JSON.stringify(initialData, null, 2));
    }
  }, [artistId, error, initialData]);

  // Handle error state
  if (error) {
    console.error("CLIENT: Rendering error state. Error message:", error);
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
    console.log("CLIENT: Rendering loading/no-data state. isLoading:", isLoading, "initialData:", initialData);
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

  console.log("CLIENT: Rendering artist profile for:", initialData.name);

  return (
    <div className="min-h-screen bg-background">
      {/* Artist Header */}
      <header>
        <ArtistHeader artist={initialData} />
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Events Section */}
        <section aria-label="Upcoming Events">
          <EventsList 
            events={initialData.upcomingEvents} 
            artistLocation={initialData.location}
          />
        </section>

        {/* Social Share Section */}
        <section aria-label="Share Artist">
          <SocialShareSection
            artistName={initialData.name}
            artistId={artistId || ''}
            description={initialData.bio}
          />
        </section>

        {/* Navigation Section */}
        <nav className="pt-6 border-t border-border" aria-label="Page Navigation">
          <Link 
            href="/" 
            className="inline-flex items-center px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
          >
            ← Back to Map
          </Link>
        </nav>
      </main>
    </div>
  );
}