import { Metadata } from "next";
import { ArtistProfileData } from "@/lib/types/artist-profile";
import { Artist, Event, getSocialMediaURLs } from "@/lib/types";
import ArtistProfileClient from "./ArtistProfileClient";

export default async function ArtistProfilePage({ params }: { params: Promise<{ artistId: string }> }) {
  const { artistId } = await params;

  console.log("Fetching artist:", artistId);

  // Server components must use direct API URL (not /api/* proxy which only works in browser)
  // This matches the pattern used in bndy-backstage godmode-service.ts
  const artistResponse = await fetch(`https://api.bndy.co.uk/api/artists/${artistId}`, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store'
  });

  if (!artistResponse.ok) {
    console.error("Failed to fetch artist:", artistResponse.status);
    return <ArtistProfileClient initialData={null} error={`Failed to load artist: ${artistResponse.status}`} artistId={artistId} />;
  }

  const artistData = await artistResponse.json() as Artist;

  // Fetch public events for this artist
  // Use new public endpoint - efficient query using artistId-date-index GSI
  const today = new Date().toISOString().split('T')[0];
  const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const eventsResponse = await fetch(
    `https://api.bndy.co.uk/api/artists/${artistId}/public-events?startDate=${today}&endDate=${futureDate}`,
    {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    }
  );

  let upcomingEvents: Event[] = [];
  if (eventsResponse.ok) {
    const data = await eventsResponse.json();
    // Transform from DynamoDB format to frontend Event format
    upcomingEvents = (data.events || []).map((event: any) => ({
      id: event.id,
      name: event.title || event.name || 'Unnamed Event',
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      venueId: event.venueId,
      venueName: event.venueName || '',
      artistIds: [event.artistId],
      location: {
        lat: event.geoLat,
        lng: event.geoLng
      },
      description: event.description,
      ticketed: event.ticketed,
      ticketUrl: event.ticketUrl,
      eventUrl: event.eventUrl,
      source: event.source || 'bndy.live',
      status: event.status || 'approved',
      createdAt: event.createdAt,
      updatedAt: event.updatedAt
    } as Event));
  }

  // Build profile data
  const profileData: ArtistProfileData = {
    id: artistData.id,
    name: artistData.name,
    bio: artistData.bio,
    profileImageUrl: artistData.profileImageUrl,
    genres: artistData.genres || [],
    location: artistData.location,
    socialMediaUrls: getSocialMediaURLs(artistData),
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
