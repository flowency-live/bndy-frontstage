// src/lib/types.ts - Added postcode field

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
}

export interface Venue extends BaseVenue {
  id: string;
  validated: boolean;
  createdAt: string;
  updatedAt: string;
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
  postcode?: string; // Added postcode field for events
}

// Artist Types
export interface Artist {
  id: string;
  name: string;
  nameVariants?: string[];
  facebookUrl?: string;
  instagramUrl?: string;
  spotifyUrl?: string;
  websiteUrl?: string;
  genres?: string[];
  createdAt: string;
  updatedAt: string;
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
}

// Conflict handling
export interface DateConflict {
  type: 'venue' | 'artist';
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