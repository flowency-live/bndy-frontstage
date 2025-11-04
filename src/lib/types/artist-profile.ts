// Artist Profile specific types for the new mobile-first implementation
import { Event, SocialMediaURL } from "@/lib/types";

export interface ArtistProfileData {
  id: string;
  name: string;
  description?: string;
  profileImageUrl?: string;
  genres?: string[];
  location?: string;
  socialMediaURLs?: SocialMediaURL[];
  upcomingEvents: Event[];
}

export interface ArtistProfileMetaTags {
  title: string; // "Artist Name | bndy"
  description: string; // Artist bio or default description
  ogImage: string; // Artist profile image or default
  ogUrl: string; // Canonical profile URL
  twitterCard: 'summary_large_image';
}