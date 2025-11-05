import { Metadata } from "next";
import { ArtistProfileData } from "@/lib/types/artist-profile";
import { Artist, Event } from "@/lib/types";
import ArtistProfileClient from "./ArtistProfileClient";

export default async function ArtistProfilePage({ params }: { params: Promise<{ artistId: string }> }) {
  const { artistId } = await params;

  console.log("=== FETCHING ARTIST:", artistId);

  // Direct API call
  const artistResponse = await fetch(`https://api.bndy.co.uk/api/artists/${artistId}`, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store'
  });

  console.log("Artist API response status:", artistResponse.status);

  if (!artistResponse.ok) {
    console.error("Artist API failed:", artistResponse.status, artistResponse.statusText);
    return <ArtistProfileClient initialData={null} error={`Failed to load artist: ${artistResponse.status}`} artistId={artistId} />;
  }

  const artistData = await artistResponse.json() as Artist;
  console.log("Artist data received:", artistData.name);

  // Fetch events
  const eventsResponse = await fetch(`https://api.bndy.co.uk/api/events?artistId=${artistId}`, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store'
  });

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
}

// Simplified metadata generation
export async function generateMetadata({ params }: { params: Promise<{ artistId: string }> }): Promise<Metadata> {
  const { artistId } = await params;

  try {
    const response = await fetch(`https://api.bndy.co.uk/api/artists/${artistId}`, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    });

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
