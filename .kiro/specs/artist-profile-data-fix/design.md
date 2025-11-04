# Design Document

## Overview

This design focuses on creating a clean, functional artist profile system with proper data fetching and display. The system includes both individual artist profile pages and a comprehensive artist browse page. The design prioritizes data accuracy, performance, and user experience over complex animations.

## Architecture

### Data Flow Architecture
```
User Request → Next.js Page → Service Layer → /api/* (Amplify Proxy) → API Gateway → Lambda → DynamoDB → Response Chain
```

### Service Layer Architecture
```
Components → Service Functions → API Endpoints → Lambda Functions → DynamoDB
```
- **No Direct Fetch**: Components never call fetch directly
- **Service Layer Required**: All API interactions through service layer
- **Credentials Included**: All requests include `credentials: 'include'`
- **Error Propagation**: Consistent error handling through service layer

### API Integration
- **Serverless Architecture**: Lambda + API Gateway + DynamoDB + Cognito + S3
- **Single Domain Strategy**: All API calls through `.bndy.co.uk/api/*` using Amplify proxy to API Gateway
- **Service Layer Pattern**: All API calls go through dedicated service layer functions, no direct fetch in components
- **Authentication**: Include credentials with `credentials: 'include'` for httpOnly cookies
- **Lambda Functions**: One Lambda = One Job principle
  - `getArtist` Lambda for individual artist data
  - `searchArtists` Lambda for artist search/browse
  - `getArtistEvents` Lambda for artist-specific events
- **Caching Strategy**: 5-minute cache for artist data, 3-minute cache for events
- **Error Handling**: Graceful fallbacks with user-friendly error messages

### Component Architecture
```
ArtistProfilePage (Server Component)
├── ArtistProfileClient (Client Component)
    ├── ArtistHeader (Social media style header with profile info)
    │   ├── ProfileCover (Banner/cover area)
    │   ├── ProfilePicture (Large circular profile image)
    │   ├── ArtistInfo (Name, location, genres, bio)
    │   └── SocialMediaLinks (Platform icons)
    ├── SocialShareSection (Artist sharing functionality - based on EventInfoOverlay pattern)
    │   ├── NativeShareButton (Web Share API using navigator.share)
    │   ├── PlatformShareButtons (Facebook, Twitter fallbacks)
    │   └── CopyLinkButton (Clipboard functionality)
    ├── EventsList (Event cards with location filtering)
    │   ├── LocationFilter (Distance filter dropdown)
    │   ├── EventCard (Individual event display)
    │   └── EmptyState (No events message)
    └── ErrorBoundary (Graceful error handling)

ArtistBrowsePage (Server Component)
├── ArtistBrowseClient (Client Component)
    ├── SearchAndFilters (Real-time search/filter)
    ├── ArtistGrid (Responsive card grid)
    ├── ArtistCard (Square tile with image/name)
    └── EmptyState (No results message)
```

## Components and Interfaces

### ArtistHeader Component
**Purpose**: Social media style header with complete artist information
**Design**: Instagram/Facebook style profile header with cover area and profile details

```typescript
interface ArtistHeaderProps {
  artist: {
    id: string;
    name: string;
    description?: string;
    profileImageUrl?: string;
    genres?: string[];
    location?: string;
    socialMediaURLs?: SocialMediaURL[];
  };
}
```

**Layout**:
- Cover/banner area with gradient background or artist image
- Large circular profile picture (150px) positioned over cover area
- Artist name prominently displayed below profile picture
- Artist location (if available) with location icon
- Genre tags displayed as styled pills/badges
- Artist bio/description in readable paragraph format
- Social media links as horizontal row of official platform icons
- Follow/share buttons (future enhancement)
- All content designed to fit above the fold on desktop, scrollable on mobile

### EventsList Component
**Purpose**: Display artist's upcoming events with location filtering
**Design**: Card-based event display with distance filtering controls

```typescript
interface EventsListProps {
  events: Event[];
  artistLocation?: string;
  userLocation?: { lat: number; lng: number };
}
```

**Features**:
- Location filter dropdown (5 miles, 10 miles, 25 miles, 50 miles, All)
- Event cards showing date, venue, distance from user
- Ticket purchase buttons where available
- Empty state when no events match filter criteria
- Responsive card grid layout

### SocialMediaSection Component
**Purpose**: Display social media links with official platform icons
**Design**: Horizontal row of recognizable social media icons integrated into header

```typescript
interface SocialMediaSectionProps {
  socialMediaURLs: Array<{
    platform: 'facebook' | 'instagram' | 'spotify' | 'youtube' | 'x' | 'website';
    url: string;
  }>;
}
```

**Features**:
- Official platform icons with brand colors
- Hover effects with platform-specific styling
- Opens links in new tabs
- Responsive layout (stacks on mobile)
- Integrated into artist header section

### SocialShareButton Component (Reusable)
**Purpose**: Universal sharing component for artists, events, and venues
**Design**: Flexible, reusable sharing component extracted from EventInfoOverlay pattern
**Location**: `src/components/shared/SocialShareButton.tsx`

```typescript
interface SocialShareButtonProps {
  title: string;
  text: string;
  url?: string; // Defaults to current page URL
  className?: string;
  variant?: 'button' | 'icon'; // Button with text or icon-only
  size?: 'sm' | 'md' | 'lg';
}
```

**Features**:
- **Universal**: Works for artists, events, venues, and any shareable content
- **Primary**: Native Web Share API (`navigator.share`) for modern browsers
- **Fallback**: Platform-specific sharing buttons (Facebook, Twitter) when native sharing unavailable
- **Copy Link**: Clipboard API for copying shareable URLs
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Consistent UI**: Uses Share2 icon from Lucide React (same as EventInfoOverlay)
- **Error Handling**: Graceful fallback when sharing APIs fail
- **Flexible**: Supports different variants (button vs icon) and sizes

**Usage Examples**:
```typescript
// Artist Profile
<SocialShareButton 
  title="John Doe | bndy"
  text="Check out John Doe on bndy!"
  variant="button"
/>

// Event (existing EventInfoOverlay)
<SocialShareButton 
  title="Rock Concert | bndy"
  text="Check out this event: Rock Concert on Dec 1st"
  variant="icon"
  size="sm"
/>

// Venue
<SocialShareButton 
  title="The Jazz Club | bndy"
  text="Check out The Jazz Club on bndy!"
/>
```

**Implementation Pattern** (extracted from EventInfoOverlay.tsx):
```typescript
const handleShare = async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url: url || window.location.href,
      });
    } catch (err) {
      console.error("Error sharing", err);
      // Fall back to platform-specific buttons
    }
  } else {
    // Show platform-specific sharing buttons
  }
};
```

### ArtistCard Component
**Purpose**: Square tile for artist browse grid
**Design**: Clean, consistent card design

```typescript
interface ArtistCardProps {
  artist: {
    id: string;
    name: string;
    profileImageUrl?: string;
    location?: string;
  };
}
```

**Layout**:
- Square aspect ratio (1:1)
- Artist image as background with overlay
- Artist name at bottom with readable contrast
- Hover effect for interactivity
- Click navigates to artist profile

### SearchAndFilters Component
**Purpose**: Real-time search and filtering for artist browse
**Design**: Clean, intuitive filter interface

```typescript
interface SearchAndFiltersProps {
  onSearch: (query: string) => void;
  onLocationFilter: (location: string) => void;
  availableLocations: string[];
}
```

**Features**:
- Real-time search input
- Location dropdown filter
- Clear filters button
- Search state persistence

## Data Models

### Artist Data Structure
```typescript
interface Artist {
  id: string;
  name: string;
  artist_type: 'band' | 'solo' | 'duo' | 'group' | 'collective';
  description?: string;
  profileImageUrl?: string;
  genres?: string[];
  location?: string;
  socialMediaURLs?: SocialMediaURL[];
  createdAt: string;
  updatedAt: string;
}
```
**Note**: No "Band" entity - use "Artist" with `artist_type` field to distinguish between bands, solo artists, duos, etc.

### Event Data Structure
```typescript
interface Event {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime?: string;
  venueId: string;
  venueName: string;
  artistIds: string[];
  ticketed?: boolean;
  ticketUrl?: string;
  eventUrl?: string;
}
```

## Error Handling

### API Error Handling
- **404 Artist Not Found**: Display user-friendly "Artist not found" page with navigation back to browse
- **Network Errors**: Show retry button with clear error message
- **Timeout Errors**: Display loading state with timeout message after 10 seconds
- **Invalid Data**: Log errors and display fallback content

### Image Error Handling
- **Profile Image Fails**: Show artist initial in colored circle
- **Social Media Icons**: Use text fallbacks if icons fail to load
- **Event Images**: Hide image container if image fails

### Data Validation
- Validate artist data structure on fetch
- Sanitize user input for search/filters
- Handle missing or malformed social media URLs gracefully

## Testing Strategy

### Unit Tests
- **Artist Data Fetching**: Test API calls and data transformation
- **Component Rendering**: Test all components with various data states
- **Search/Filter Logic**: Test real-time filtering functionality
- **Error Handling**: Test all error scenarios

### Integration Tests
- **Full Page Load**: Test complete artist profile page loading
- **Navigation Flow**: Test browse → profile → back navigation
- **API Integration**: Test actual API calls with mock responses
- **Responsive Design**: Test layouts on different screen sizes

### Service Layer Functions
```typescript
// Service layer for artist data - NO direct fetch in components
export async function getArtistById(artistId: string): Promise<Artist | null> {
  try {
    const response = await fetch(`/api/artists/${artistId}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch artist: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching artist:', error);
    throw error;
  }
}

export async function searchArtists(query: string, location?: string): Promise<Artist[]> {
  try {
    const params = new URLSearchParams({ q: query });
    if (location) params.append('location', location);
    
    const response = await fetch(`/api/artists/search?${params}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error searching artists:', error);
    throw error;
  }
}

export async function getArtistEvents(artistId: string): Promise<Event[]> {
  try {
    const response = await fetch(`/api/artists/${artistId}/events`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch artist events: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching artist events:', error);
    throw error;
  }
}
```

### API Testing Utilities
```typescript
// Test utility for validating service layer functions
export async function testArtistService(artistId: string) {
  const artist = await getArtistById(artistId);
  
  // Validate required fields
  expect(artist).toHaveProperty('id');
  expect(artist).toHaveProperty('name');
  expect(artist).toHaveProperty('artist_type');
  
  // Validate artist_type enum
  expect(['band', 'solo', 'duo', 'group', 'collective']).toContain(artist.artist_type);
  
  // Validate optional fields structure
  if (artist.socialMediaURLs) {
    expect(Array.isArray(artist.socialMediaURLs)).toBe(true);
  }
  
  return artist;
}
```

### Performance Testing
- **Load Time**: Measure time to first contentful paint
- **API Response Time**: Monitor API call duration
- **Image Loading**: Test image optimization and fallbacks
- **Search Performance**: Test search response time with large datasets

## Navigation Integration

### Header Navigation Update
- Add "Artists" link to existing header navigation
- Position between existing controls and theme toggle
- Maintain consistent styling with current navigation
- Add active state highlighting

### URL Structure
- Artist Browse: `/artists`
- Individual Artist: `/artists/[artistId]`
- Maintain SEO-friendly URLs
- Support browser back/forward navigation

## Mobile Responsiveness

### Artist Profile Mobile Design
- Stack content vertically on mobile
- Ensure touch-friendly social media buttons
- Optimize image sizes for mobile bandwidth
- Maintain readability on small screens

### Artist Browse Mobile Design
- Responsive grid (1 column on mobile, 2-4 on larger screens)
- Touch-friendly search input
- Collapsible filters on mobile
- Infinite scroll or pagination for performance

## Performance Optimizations

### Image Optimization
- Use Next.js Image component for automatic optimization
- Implement lazy loading for artist cards
- Provide appropriate image sizes for different screen densities
- Use WebP format where supported

### Data Loading
- Server-side rendering for initial page load
- Client-side caching for subsequent navigation
- Implement loading states for better perceived performance
- Use React Query for efficient data fetching and caching

### Bundle Optimization
- Code splitting for artist browse vs profile pages
- Lazy load non-critical components
- Optimize social media icons (use icon font or SVG sprites)
- Minimize JavaScript bundle size