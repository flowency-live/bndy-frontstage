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
  availabilityMode?: 'selected_dates_only' | 'free_weekends';  // How availability is shown
  contactMethod?: 'phone' | 'whatsapp';  // Preferred contact method for bookings
  phoneNumber?: string | null;  // Contact phone number
  whatsappNumber?: string | null;  // WhatsApp number for bookings
}

export interface ArtistProfileMetaTags {
  title: string; // "Artist Name | bndy"
  description: string; // Artist bio or default description
  ogImage: string; // Artist profile image or default
  ogUrl: string; // Canonical profile URL
  twitterCard: 'summary_large_image';
}