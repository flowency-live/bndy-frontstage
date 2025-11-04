import { Metadata } from "next";
import { ArtistProfileData } from "@/lib/types/artist-profile";
import { Artist, Event } from "@/lib/types";
import ArtistProfileClient from "./ArtistProfileClient";

// Fetch artist data from DynamoDB API
async function fetchArtistData(artistId: string): Promise<Artist | null> {
  try {
    const response = await fetch(`https://api.bndy.co.uk/api/artists/${artistId}`, {
      next: { revalidate: 300 } // Cache for 5 minutes
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch artist: ${response.status}`);
    }
    
    return await response.json() as Artist;
  } catch (error) {
    console.error("Error fetching artist data:", error);
    return null;
  }
}

// Generate metadata for SEO and Open Graph
export async function generateMetadata({ params }: { params: Promise<{ artistId: string }> }): Promise<Metadata> {
  try {
    const { artistId } = await params;
    const artistData = await fetchArtistData(artistId);
    
    if (!artistData) {
      return {
        title: "Artist Not Found | bndy",
        description: "The artist you're looking for doesn't exist or has been removed.",
        robots: "noindex, nofollow"
      };
    }

    const pageTitle = `${artistData.name} | bndy`;
    const metaDescription = artistData.description 
      ? `${artistData.description.slice(0, 155)}...`
      : `Discover ${artistData.name} on bndy. Find upcoming events, music, and more.${artistData.genres ? ` Genres: ${artistData.genres.join(', ')}.` : ''}`;
    
    const canonicalUrl = `https://bndy.app/artists/${artistData.id}`;
    const ogImage = artistData.profileImageUrl || "https://bndy.app/openmic.png";

    return {
      title: pageTitle,
      description: metaDescription,
      keywords: `${artistData.name}, music, events, concerts, ${artistData.genres ? artistData.genres.join(', ') : 'live music'}`,
      authors: [{ name: artistData.name }],
      robots: "index, follow",
      alternates: {
        canonical: canonicalUrl
      },
      openGraph: {
        title: pageTitle,
        description: metaDescription,
        url: canonicalUrl,
        siteName: "bndy",
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: `${artistData.name} profile image`
          }
        ],
        locale: "en_US",
        type: "profile"
      },
      twitter: {
        card: "summary_large_image",
        title: pageTitle,
        description: metaDescription,
        images: [ogImage],
        site: "@bndy"
      },
      other: {
        "profile:first_name": artistData.name.split(' ')[0] || artistData.name,
        "profile:last_name": artistData.name.split(' ').slice(1).join(' ') || "",
        "music:musician": artistData.name
      }
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Artist Profile | bndy",
      description: "Discover artists and their upcoming events on bndy.",
      robots: "noindex, nofollow"
    };
  }
}

// Fetch events for artist from DynamoDB API
async function fetchEventsForArtist(artistId: string): Promise<Event[]> {
  try {
    // For now, we'll fetch all public events and filter by artistId
    // This is a temporary solution until we have a dedicated artist events endpoint
    const response = await fetch('https://api.bndy.co.uk/api/events/public', {
      next: { revalidate: 300 } // Cache for 5 minutes
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch events: ${response.status}`);
      return [];
    }
    
    const events = await response.json() as Event[];
    
    // Filter events for this artist
    const artistEvents = events.filter(event => 
      event.artistIds && event.artistIds.includes(artistId)
    );
    
    // Filter for upcoming events only
    const now = new Date();
    const upcomingEvents = artistEvents.filter(event => 
      new Date(event.date) >= now
    );
    
    return upcomingEvents;
  } catch (error) {
    console.error("Error fetching events for artist:", error);
    return [];
  }
}

export default async function ArtistProfilePage({ params }: { params: Promise<{ artistId: string }> }) {
  try {
    const { artistId } = await params;
    
    // Fetch artist data from DynamoDB API
    const artistData = await fetchArtistData(artistId);
    if (!artistData) {
      return <ArtistProfileClient initialData={null} error="The artist you're looking for doesn't exist or has been removed." artistId={artistId} />;
    }

    // Fetch upcoming events from DynamoDB API
    const upcomingEvents = await fetchEventsForArtist(artistId);

    // Debug logging to understand data structure
    console.log("🎵 Artist Profile Page - Artist data:", artistData);
    console.log("🎵 Artist Profile Page - Events found:", upcomingEvents.length);

    // Combine into profile data structure
    const profileData: ArtistProfileData = {
      id: artistData.id,
      name: artistData.name,
      description: artistData.description,
      profileImageUrl: artistData.profileImageUrl,
      genres: artistData.genres || [],
      socialMediaURLs: artistData.socialMediaURLs || [],
      upcomingEvents: upcomingEvents
    };

    return <ArtistProfileClient initialData={profileData} artistId={artistId} />;
  } catch (error) {
    console.error("Error fetching artist profile:", error);
    const { artistId } = await params;
    return <ArtistProfileClient initialData={null} error="Failed to load artist profile. Please try again later." artistId={artistId} />;
  }
}
