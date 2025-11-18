// src/lib/types.ts - Updated with new fields

// =========================================
// CURRENT ACTIVE TYPES - USED IN APP
// =========================================

// Venue Types
export interface BaseVenue {
  name: string;
  nameVariants?: string[];
  googlePlaceId?: string;
  location: {
    lat: number;
    lng: number;
  };
  // API also returns these at root level (legacy)
  latitude?: number;
  longitude?: number;
  address: string;
  city?: string;
  postcode?: string;
  description?: string;
  imageUrl?: string;
  profileImageUrl?: string | null; // API returns this field
  phone?: string;
  email?: string;
  website?: string;
  socialMediaUrls?: any[];  // NOTE: Backend inconsistency - Venues use uppercase, Artists use lowercase
  facilities?: string[];
  standardStartTime?: string;
  standardEndTime?: string;
  standardTicketed?: boolean; // Default should be false
  standardTicketUrl?: string; // Venue's standard ticket website
  standardTicketInformation?: string; // Venue's standard ticket details
}

export interface Venue extends BaseVenue {
  id: string;
  validated: boolean;
  createdAt: string;
  updatedAt: string;
}

// Artist Types
// NOTE: Backend returns 'bio' not 'description', and 'socialMediaUrls' not 'socialMediaUrls'
export interface Artist {
  id: string;
  name: string;
  nameVariants?: string[];
  artist_type?: 'band' | 'solo' | 'duo' | 'group' | 'dj' | 'collective'; // No "Band" entity - use artist_type field
  artistType?: string; // NEW: Lambda now returns both artist_type and artistType for compatibility
  socialMediaUrls?: any[];  // Backend uses lowercase 'Urls' - legacy individual URL fields also exist
  genres?: string[];  // Flat list of genres (simplified 2025-11-07)
  acoustic?: boolean;  // NEW: Indicates acoustic performance capability
  actType?: ('originals' | 'covers' | 'tribute')[]; // NEW: Type of act (multiselect)
  createdAt?: string;
  updatedAt?: string;
  profileImageUrl?: string;
  bio?: string;  // Backend uses 'bio' not 'description'
  location?: string;
  // Legacy fields from backend
  facebookUrl?: string;
  instagramUrl?: string;
  websiteUrl?: string;
  youtubeUrl?: string;
  spotifyUrl?: string;
  twitterUrl?: string;
}

// Artist and Venue Social Media URLs
// Define the list of supported social platforms
export type SocialPlatform = "website" | "spotify" | "facebook" | "instagram" | "youtube" | "x";

// An object for a social media link
export interface SocialMediaURL {
  platform: SocialPlatform;
  url: string;
}

// Member Types
export interface ArtistMember {
  id: string;
  userId: string;
  displayName: string;
  photoURL?: string;
  instruments?: string[];
  role?: string;
  isAdmin: boolean;
  joinedAt: string;
}

// Event Types
export type EventSource = 'bndy.live' | 'user' | 'bndy.core';
export type EventStatus = 'pending' | 'approved' | 'rejected';

export interface Event {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime?: string;
  venueId: string;
  venueName: string;
  venueCity?: string; // City/town where venue is located
  artistIds: string[];
  artistName?: string; // Artist name for venue event listings
  location: {
      lat: number;
      lng: number;
  };
  description?: string;
  //ticketPrice?: string;
  price?: string | null; // Ticket price for community events
  ticketed?: boolean; // Whether the event is ticketed
  ticketinformation?: string; // Free-text details about tickets
  ticketUrl?: string; // URL to purchase tickets
  eventUrl?: string;
  imageUrl?: string; // Optional event image for enhanced display
  source: EventSource;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
  isOpenMic?: boolean;
  postcode?: string; // For event location postcode
  verifiedByArtist?: boolean; // Whether artist has verified this community event
  notes?: string | null; // Additional notes for community events
  hasCustomTitle?: boolean; // Whether event has a custom title (not default format)
}

// Filter Types
export interface EventFilters {
  searchTerm: string;
  genre?: string;
  ticketType: 'all' | 'free' | 'paid';
  postcode?: string;
  dateFilter: 'all' | 'today' | 'week' | 'month';
}

export interface LocationFilter {
  searchRadius: number;
  center?: {
      lat: number;
      lng: number;
  };
}

// User Types
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  postcode?: string;
  instruments?: string[];
  createdAt: string;
  isAdmin?: boolean;
}

// Recurring Event Types
export type RecurringFrequency = 'weekly' | 'monthly';
export interface RecurringEventConfig {
    frequency: RecurringFrequency;
    endDate: string;
    skipDates?: string[];
}

export interface EventFormData {
  venue: Venue;
  artists: Artist[];
  name: string;
  date: string;
  startTime: string;
  endTime?: string;
  description?: string;
  ticketed?: boolean;
  ticketinformation?: string; // Ensure this is optional
  ticketUrl?: string;
  eventUrl?: string;
  isOpenMic?: boolean;
  recurring?: RecurringEventConfig;
  // Add this field for conflict tracking
  dateConflicts?: DateConflict[];
}

// Make sure DateConflict is properly defined
export interface DateConflict {
  type: 'venue' | 'artist' | 'exact_duplicate';
  name: string;
  existingEvent: {
    name: string;
    startTime: string;
  };
}

export interface EventConflictCheck {
  venue: Venue;
  artists: Artist[];
  date: string;
  isOpenMic?: boolean;
}

// Export/Import support
export interface ProcessedEvent {
  id: string;
  artist: string;
  venue: string;
  date: string;
  time?: string;
  ticketPrice?: string;
  ticketUrl?: string;
  status: 'pending' | 'processing' | 'ready' | 'error';
  venueMatch?: ImportMatch<Venue>;
  artistMatch?: ImportMatch<Artist>;
  error?: string;
}

export interface ImportMatch<T> {
  id?: string;
  name: string;
  confidence: number;
  isNew?: boolean;
  data?: Partial<T>;
}

// Added helper functions to handle social media URLs for legacy properties
export function getSocialMediaURLs(item: Venue | Artist): SocialMediaURL[] {
  // Initialize an empty array
  const socialMediaUrls: SocialMediaURL[] = [];

  // Check for socialMediaUrls (uppercase - used by Venues backend)
  const urls = ('socialMediaUrls' in item && (item as any).socialMediaUrls) ||
               ('socialMediaUrls' in item && (item as any).socialMediaUrls) ||
               [];

  if (urls && urls.length > 0) {
    return urls;
  }

  // Handle legacy venue social properties
  if ('websiteUrl' in item && typeof item.websiteUrl === 'string' && item.websiteUrl.trim()) {
    socialMediaUrls.push({ platform: 'website', url: item.websiteUrl });
  }

  if ('facebookUrl' in item && typeof item.facebookUrl === 'string' && item.facebookUrl.trim()) {
    socialMediaUrls.push({ platform: 'facebook', url: item.facebookUrl });
  }

  // Handle legacy artist social properties
  if ('instagramUrl' in item && typeof item.instagramUrl === 'string' && item.instagramUrl.trim()) {
    socialMediaUrls.push({ platform: 'instagram', url: item.instagramUrl });
  }

  if ('spotifyUrl' in item && typeof item.spotifyUrl === 'string' && item.spotifyUrl.trim()) {
    socialMediaUrls.push({ platform: 'spotify', url: item.spotifyUrl });
  }

  if ('youtubeUrl' in item && typeof item.youtubeUrl === 'string' && item.youtubeUrl.trim()) {
    socialMediaUrls.push({ platform: 'youtube', url: item.youtubeUrl });
  }

  if ('twitterUrl' in item && typeof item.twitterUrl === 'string' && item.twitterUrl.trim()) {
    socialMediaUrls.push({ platform: 'x', url: item.twitterUrl });
  }

  return socialMediaUrls;
}

// Function to check if an item has any social media URLs
export function hasSocialMedia(item: Venue | Artist): boolean {
  // Check for either case variant
  const urls = ('socialMediaUrls' in item && (item as any).socialMediaUrls) ||
               ('socialMediaUrls' in item && (item as any).socialMediaUrls) ||
               [];

  if (urls && urls.length > 0) {
    return true;
  }

  // Then check for legacy properties
  return !!(
    ('websiteUrl' in item && item.websiteUrl) ||
    ('facebookUrl' in item && item.facebookUrl) ||
    ('instagramUrl' in item && item.instagramUrl) ||
    ('spotifyUrl' in item && item.spotifyUrl)
  );
}