// Artist Profile specific types for the new mobile-first implementation
import { Event } from "@/lib/types";

export interface ArtistProfileData {
  id: string;
  name: string;
  bio?: string;  // Backend returns 'bio' not 'description'
  profileImageUrl?: string;
  genres?: string[];
  artistType?: string;
  location?: string;
  socialMediaUrls?: any[];  // Backend uses lowercase 'Urls'
  upcomingEvents: Event[];
  publishAvailability?: boolean; // Whether to display availability tab publicly
}

export interface ArtistProfileMetaTags {
  title: string; // "Artist Name | bndy"
  description: string; // Artist bio or default description
  ogImage: string; // Artist profile image or default
  ogUrl: string; // Canonical profile URL
  twitterCard: 'summary_large_image';
}