import { Metadata } from "next";
import { ArtistProfileData } from "@/lib/types/artist-profile";
import { Artist, Event } from "@/lib/types";
import ArtistProfileClient from "./ArtistProfileClient";

// Simple fetch helper that uses /api/* proxy (Amplify routes to API Gateway)
async function fetchFromAPI(path: string): Promise<Response> {
  return fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store'
  });
}

export default async function ArtistProfilePage({ params }: { params: Promise<{ artistId: string }> }) {
  try {
    const { artistId } = await params;

    console.log("=== FETCHING ARTIST:", artistId);

    // Use /api/* proxy - Amplify routes to API Gateway
    const artistResponse = await fetchFromAPI(`/api/artists/${artistId}`);
    console.log("Artist API response status:", artistResponse.status);

    if (!artistResponse.ok) {
      console.error("Artist API failed:", artistResponse.status, artistResponse.statusText);
      return <ArtistProfileClient initialData={null} error={`Failed to load artist: ${artistResponse.status}`} artistId={artistId} />;
    }

    const artistData = await artistResponse.json() as Artist;
    console.log("Artist data received:", artistData.name);

    // Fetch events using /api/* proxy
    const eventsResponse = await fetchFromAPI(`/api/events?artistId=${artistId}`);
    const upcomingEvents = eventsResponse.ok ? await eventsResponse.json() as Event[] : [];
    console.log("Events received:", upcomingEvents.length);

    // Build profile data
    const profileData: ArtistProfileData = {
      id: artistData.id,
      name: artistData.name,
      bio: artistData.bio,
      profileImageUrl: artistData.profileImageUrl,
      genres: artistData.genres || [],
      location: artistData.location,
      socialMediaUrls: artistData.socialMediaUrls || [],
      upcomingEvents: upcomingEvents
    };

    return <ArtistProfileClient initialData={profileData} artistId={artistId} />;
  } catch (error) {
    console.error("=== ARTIST PROFILE ERROR ===");
    console.error("Error type:", error?.constructor?.name);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    console.error("Full error object:", error);
    console.error("=== END ERROR ===");

    // Re-throw to let Next.js handle it, but we've logged everything first
    throw error;
  }
}

// Simplified metadata generation
export async function generateMetadata({ params }: { params: Promise<{ artistId: string }> }): Promise<Metadata> {
  const { artistId } = await params;

  try {
    const response = await fetchFromAPI(`/api/artists/${artistId}`);

    if (!response.ok) {
      return {
        title: "Artist Not Found | bndy",
        description: "The artist you're looking for doesn't exist or has been removed.",
      };
    }

    const artist = await response.json() as Artist;

    return {
      title: `${artist.name} | bndy`,
      description: artist.bio || `Discover ${artist.name} on bndy`,
    };
  } catch (error) {
    return {
      title: "Artist Profile | bndy",
      description: "Discover artists and their upcoming events on bndy.",
    };
  }
}
