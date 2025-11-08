// src/lib/constants.ts
// NOTE: GENRES moved to src/lib/constants/genres.ts (2025-11-07)
// Import from there instead: import { GENRES } from '@/lib/constants/genres';

export const COLLECTIONS = {
  EVENTS: 'bf_events',
  VENUES: 'bf_venues',
  ARTISTS: 'bf_artists',
  USERS: 'bf_users'
} as const;

// Date range options for list view
export const DATE_RANGES = [
  { id: "today", label: "Today" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "thisWeek", label: "This Week" },
  { id: "thisWeekend", label: "This Weekend" },
  { id: "nextWeek", label: "Next Week" },
  { id: "nextWeekend", label: "Next Weekend" },
  { id: "future", label: "Future Events" },
  { id: "all", label: "All Events" }
] as const;

// Distance options (in km)
export const DISTANCE_OPTIONS = [
  { value: 5, label: "5mile radius" },
  { value: 10, label: "10mile radius" },
  { value: 25, label: "25mile radius" },
  { value: 50, label: "50mile radius" }
] as const;

export const CITY_LOCATIONS = {
  STOKE_ON_TRENT: { 
    lat: 53.0027, 
    lng: -2.1794, 
    name: "Stoke-on-Trent" 
  },
  STOCKPORT: { 
    lat: 53.4106, 
    lng: -2.1584, 
    name: "Stockport" 
  }
};

// Default location for the app
export const DEFAULT_LOCATION = CITY_LOCATIONS.STOKE_ON_TRENT;