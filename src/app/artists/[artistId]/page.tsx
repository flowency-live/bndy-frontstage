import { Metadata } from "next";
import { ArtistProfileData } from "@/lib/types/artist-profile";
import { Artist, Event } from "@/lib/types";
import ArtistProfileClient from "./ArtistProfileClient";
import { getArtistById, getArtistEvents } from "@/lib/services/artist-service-new";

// Fetch artist data using service layer
async function fetchArtistData(artistId: string): Promise<Artist | null> {
  try {
    console.log("fetchArtistData: Calling getArtistById with ID:", artistId);
    const result = await getArtistById(artistId);
    console.log("fetchArtistData: getArtistById returned:", result ? "Artist object" : "null");
    if (result) {
      console.log("fetchArtistData: Artist name:", result.name);
      console.log("fetchArtistData: Artist has required fields:", {
        id: !!result.id,
        name: !!result.name,
        bio: !!result.bio,
        profileImageUrl: !!result.profileImageUrl
      });
    }
    return result;
  } catch (error) {
    console.error("fetchArtistData: ERROR caught");
    console.error("fetchArtistData: Error type:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("fetchArtistData: Error message:", error instanceof Error ? error.message : String(error));
    console.error("fetchArtistData: Error details:", error);
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
    const metaDescription = artistData.bio
      ? `${artistData.bio.slice(0, 155)}...`
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

// Fetch events for artist using service layer
async function fetchEventsForArtist(artistId: string): Promise<Event[]> {
  try {
    return await getArtistEvents(artistId);
  } catch (error) {
    console.error("Error fetching events for artist:", error);
    return [];
  }
}

export default async function ArtistProfilePage({ params }: { params: Promise<{ artistId: string }> }) {
  try {
    const { artistId } = await params;
    console.log("=== ARTIST PROFILE PAGE DEBUG START ===");
    console.log("Requested artistId:", artistId);

    // Fetch artist data from DynamoDB API
    console.log("Attempting to fetch artist data from API...");
    const artistData = await fetchArtistData(artistId);
    console.log("API fetch completed. Artist data received:", artistData ? "YES" : "NO");

    if (!artistData) {
      console.error("ARTIST DATA IS NULL - Cannot load profile");
      console.log("=== ARTIST PROFILE PAGE DEBUG END (FAILED) ===");
      return <ArtistProfileClient initialData={null} error="CODE MODIFIED - Artist data could not be loaded from the database. Check server logs for details." artistId={artistId} />;
    }

    console.log("Artist data structure:", JSON.stringify(artistData, null, 2));
    console.log("Artist name:", artistData.name);
    console.log("Artist ID from data:", artistData.id);

    // Fetch upcoming events from DynamoDB API
    console.log("Attempting to fetch events for artist...");
    const upcomingEvents = await fetchEventsForArtist(artistId);
    console.log("Events fetch completed. Count:", upcomingEvents.length);

    // Combine into profile data structure
    console.log("Building profile data structure...");
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

    console.log("Profile data built successfully");
    console.log("=== ARTIST PROFILE PAGE DEBUG END (SUCCESS) ===");
    return <ArtistProfileClient initialData={profileData} artistId={artistId} />;
  } catch (error) {
    console.error("=== ARTIST PROFILE PAGE ERROR ===");
    console.error("Error type:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    const { artistId } = await params;
    console.error("Failed artistId:", artistId);
    console.error("=== ARTIST PROFILE PAGE ERROR END ===");
    return <ArtistProfileClient initialData={null} error="EXCEPTION CAUGHT - Failed to load artist profile. Check console for detailed error information." artistId={artistId} />;
  }
}
