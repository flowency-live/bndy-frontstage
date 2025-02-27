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
  address: string;
  postcode?: string;
  description?: string;
  imageUrl?: string;
  phone?: string;
  email?: string;
  socialMediaURLs?: SocialMediaURL[];  // Unified social media URLs array
  facilities?: string[];
  standardStartTime?: string;
  standardEndTime?: string;
  standardTicketPrice?: string;
}

export interface Venue extends BaseVenue {
  id: string;
  validated: boolean;
  createdAt: string;
  updatedAt: string;
}

// Artist Types
export interface Artist {
  id: string;
  name: string;
  nameVariants?: string[];
  socialMediaURLs?: SocialMediaURL[];  // Unified social media URLs array
  genres?: string[];
  createdAt: string;
  updatedAt: string;
  profileImageUrl?: string;
  description?: string;
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
  artistIds: string[];
  location: {
      lat: number;
      lng: number;
  };
  description?: string;
  ticketPrice?: string;
  ticketUrl?: string;
  eventUrl?: string;
  source: EventSource;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
  isOpenMic?: boolean;
  postcode?: string; // For event location postcode
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

// =========================================
// FUTURE IMPLEMENTATION TYPES - NOT CURRENTLY USED
// =========================================

// TODO: These types will be implemented in future iterations

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
  ticketPrice?: string;
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
  const socialMediaURLs: SocialMediaURL[] = [];

  // Check if item already has the socialMediaURLs property
  if (item.socialMediaURLs && item.socialMediaURLs.length > 0) {
    return item.socialMediaURLs;
  }

  // Handle legacy venue social properties
  if ('websiteUrl' in item && typeof item.websiteUrl === 'string') {
    socialMediaURLs.push({ platform: 'website', url: item.websiteUrl });
  }
  
  if ('facebookUrl' in item && typeof item.facebookUrl === 'string') {
    socialMediaURLs.push({ platform: 'facebook', url: item.facebookUrl });
  }

  // Handle legacy artist social properties
  if ('instagramUrl' in item && typeof item.instagramUrl === 'string') {
    socialMediaURLs.push({ platform: 'instagram', url: item.instagramUrl });
  }
  
  if ('spotifyUrl' in item && typeof item.spotifyUrl === 'string') {
    socialMediaURLs.push({ platform: 'spotify', url: item.spotifyUrl });
  }

  return socialMediaURLs;
}

// Function to check if an item has any social media URLs
export function hasSocialMedia(item: Venue | Artist): boolean {
  // First check if it has socialMediaURLs
  if (item.socialMediaURLs && item.socialMediaURLs.length > 0) {
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