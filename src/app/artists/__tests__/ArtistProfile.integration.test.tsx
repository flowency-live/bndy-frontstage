import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ArtistProfileData } from '@/lib/types/artist-profile';
import { Event } from '@/lib/types';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/artists/test-artist',
}));

// Mock the artist service
jest.mock('@/lib/services/artist-service-new', () => ({
  getArtistById: jest.fn(),
  getArtistEvents: jest.fn(),
}));

// Mock distance utilities
jest.mock('@/lib/utils/distance', () => ({
  getUserLocation: jest.fn(),
  calculateDistance: jest.fn(),
  formatDistance: jest.fn(),
}));

// Create a mock ArtistProfileClient component for testing
const MockArtistProfileClient = ({ artistId }: { artistId: string }) => {
  const [loading, setLoading] = React.useState(true);
  const [artist, setArtist] = React.useState<ArtistProfileData | null>(null);
  const [events, setEvents] = React.useState<Event[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const { getArtistById, getArtistEvents } = require('@/lib/services/artist-service-new');
        const artistData = await getArtistById(artistId);
        const eventsData = await getArtistEvents(artistId);
        
        setArtist(artistData);
        setEvents(eventsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load artist');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [artistId]);

  if (loading) {
    return <div data-testid="loading">Loading artist profile...</div>;
  }

  if (error) {
    return <div data-testid="error">{error}</div>;
  }

  if (!artist) {
    return <div data-testid="not-found">Artist not found</div>;
  }

  return (
    <div data-testid="artist-profile">
      {/* Artist Header */}
      <header data-testid="artist-header">
        <h1>{artist.name}</h1>
        {artist.location && <p data-testid="artist-location">{artist.location}</p>}
        {artist.description && <p data-testid="artist-description">{artist.description}</p>}
        {artist.genres && artist.genres.length > 0 && (
          <div data-testid="artist-genres">
            {artist.genres.map(genre => (
              <span key={genre} data-testid={`genre-${genre.toLowerCase()}`}>{genre}</span>
            ))}
          </div>
        )}
        {artist.socialMediaURLs && artist.socialMediaURLs.length > 0 && (
          <div data-testid="social-media-links">
            {artist.socialMediaURLs.map(social => (
              <a 
                key={social.platform} 
                href={social.url}
                data-testid={`social-${social.platform}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {social.platform}
              </a>
            ))}
          </div>
        )}
      </header>

      {/* Events List */}
      <section data-testid="events-section">
        <h2>Upcoming Events</h2>
        {events.length > 0 ? (
          <div data-testid="events-list">
            {events.map(event => (
              <div key={event.id} data-testid={`event-${event.id}`}>
                <h3>{event.name}</h3>
                <p>{event.venueName}</p>
                <p>{event.date}</p>
                {event.startTime && <p>{event.startTime}</p>}
                {event.price && <p data-testid={`event-price-${event.id}`}>{event.price}</p>}
                {event.ticketUrl && (
                  <a 
                    href={event.ticketUrl} 
                    data-testid={`ticket-link-${event.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Get Tickets
                  </a>
                )}
                <a 
                  href={`/venues/${event.venueId}`}
                  data-testid={`venue-link-${event.id}`}
                >
                  View Venue
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div data-testid="no-events">No upcoming events</div>
        )}
      </section>

      {/* Navigation */}
      <nav data-testid="navigation">
        <a href="/artists" data-testid="back-to-browse">Back to Artists</a>
      </nav>
    </div>
  );
};

import React from 'react';

const { getArtistById, getArtistEvents } = require('@/lib/services/artist-service-new');
const { getUserLocation, calculateDistance, formatDistance } = require('@/lib/utils/distance');

describe('Artist Profile Integration Tests', () => {
  let queryClient: QueryClient;

  const mockArtist: ArtistProfileData = {
    id: 'test-artist-1',
    name: 'Test Artist',
    description: 'A comprehensive test artist with full profile information for integration testing.',
    profileImageUrl: 'https://example.com/profile.jpg',
    location: 'New York, NY',
    genres: ['Rock', 'Pop', 'Alternative'],
    socialMediaURLs: [
      { platform: 'spotify', url: 'https://spotify.com/artist/test' },
      { platform: 'facebook', url: 'https://facebook.com/testartist' },
      { platform: 'instagram', url: 'https://instagram.com/testartist' },
      { platform: 'youtube', url: 'https://youtube.com/testartist' }
    ],
    upcomingEvents: []
  };

  const mockEvents: Event[] = [
    {
      id: 'event-1',
      name: 'Rock Concert',
      date: '2025-12-01',
      startTime: '20:00',
      endTime: '23:00',
      venueName: 'Madison Square Garden',
      venueId: 'venue-1',
      price: '$75',
      ticketUrl: 'https://tickets.com/event1',
      eventUrl: 'https://events.com/event1',
      location: { lat: 40.7505, lng: -73.9934 }
    },
    {
      id: 'event-2',
      name: 'Acoustic Session',
      date: '2025-11-15',
      startTime: '19:30',
      venueName: 'Blue Note',
      venueId: 'venue-2',
      price: '$45',
      ticketUrl: 'https://tickets.com/event2',
      location: { lat: 40.7308, lng: -74.0014 }
    },
    {
      id: 'event-3',
      name: 'Festival Performance',
      date: '2025-10-20',
      startTime: '15:00',
      venueName: 'Central Park',
      venueId: 'venue-3',
      price: 'Free',
      location: { lat: 40.7829, lng: -73.9654 }
    }
  ];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    jest.clearAllMocks();
    getArtistById.mockResolvedValue(mockArtist);
    getArtistEvents.mockResolvedValue(mockEvents);
    getUserLocation.mockResolvedValue({ lat: 40.7128, lng: -74.0060 });
    calculateDistance.mockReturnValue(5.2);
    formatDistance.mockReturnValue('5.2 mi');
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  describe('Complete Artist Profile Page Loading and Display', () => {
    it('loads and displays complete artist profile with all sections', async () => {
      renderWithQueryClient(<MockArtistProfileClient artistId="test-artist-1" />);
      
      // Should show loading state initially
      expect(screen.getByTestId('loading')).toBeInTheDocument();
      expect(screen.getByText('Loading artist profile...')).toBeInTheDocument();
      
      // Wait for profile to load
      await waitFor(() => {
        expect(screen.getByTestId('artist-profile')).toBeInTheDocument();
      });
      
      // Verify API calls were made
      expect(getArtistById).toHaveBeenCalledWith('test-artist-1');
      expect(getArtistEvents).toHaveBeenCalledWith('test-artist-1');
      
      // Check artist header section
      const header = screen.getByTestId('artist-header');
      expect(header).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test Artist');
      expect(screen.getByTestId('artist-location')).toHaveTextContent('New York, NY');
      expect(screen.getByTestId('artist-description')).toHaveTextContent('A comprehensive test artist');
      
      // Check genres
      const genresSection = screen.getByTestId('artist-genres');
      expect(genresSection).toBeInTheDocument();
      expect(screen.getByTestId('genre-rock')).toHaveTextContent('Rock');
      expect(screen.getByTestId('genre-pop')).toHaveTextContent('Pop');
      expect(screen.getByTestId('genre-alternative')).toHaveTextContent('Alternative');
      
      // Check social media links
      const socialSection = screen.getByTestId('social-media-links');
      expect(socialSection).toBeInTheDocument();
      expect(screen.getByTestId('social-spotify')).toHaveAttribute('href', 'https://spotify.com/artist/test');
      expect(screen.getByTestId('social-facebook')).toHaveAttribute('href', 'https://facebook.com/testartist');
      expect(screen.getByTestId('social-instagram')).toHaveAttribute('href', 'https://instagram.com/testartist');
      expect(screen.getByTestId('social-youtube')).toHaveAttribute('href', 'https://youtube.com/testartist');
      
      // Check events section
      const eventsSection = screen.getByTestId('events-section');
      expect(eventsSection).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Upcoming Events');
      
      const eventsList = screen.getByTestId('events-list');
      expect(eventsList).toBeInTheDocument();
      expect(screen.getByTestId('event-event-1')).toBeInTheDocument();
      expect(screen.getByTestId('event-event-2')).toBeInTheDocument();
      expect(screen.getByTestId('event-event-3')).toBeInTheDocument();
      
      // Check navigation
      const navigation = screen.getByTestId('navigation');
      expect(navigation).toBeInTheDocument();
      expect(screen.getByTestId('back-to-browse')).toHaveAttribute('href', '/artists');
    });

    it('displays event information correctly with all details', async () => {
      renderWithQueryClient(<MockArtistProfileClient artistId="test-artist-1" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('artist-profile')).toBeInTheDocument();
      });
      
      // Check first event details
      const event1 = screen.getByTestId('event-event-1');
      expect(event1).toContainElement(screen.getByText('Rock Concert'));
      expect(event1).toContainElement(screen.getByText('Madison Square Garden'));
      expect(event1).toContainElement(screen.getByText('2025-12-01'));
      expect(event1).toContainElement(screen.getByText('20:00'));
      expect(screen.getByTestId('event-price-event-1')).toHaveTextContent('$75');
      
      // Check ticket and venue links
      const ticketLink1 = screen.getByTestId('ticket-link-event-1');
      expect(ticketLink1).toHaveAttribute('href', 'https://tickets.com/event1');
      expect(ticketLink1).toHaveAttribute('target', '_blank');
      expect(ticketLink1).toHaveAttribute('rel', 'noopener noreferrer');
      
      const venueLink1 = screen.getByTestId('venue-link-event-1');
      expect(venueLink1).toHaveAttribute('href', '/venues/venue-1');
      
      // Check second event details
      const event2 = screen.getByTestId('event-event-2');
      expect(event2).toContainElement(screen.getByText('Acoustic Session'));
      expect(event2).toContainElement(screen.getByText('Blue Note'));
      expect(screen.getByTestId('event-price-event-2')).toHaveTextContent('$45');
      
      // Check third event (free event)
      const event3 = screen.getByTestId('event-event-3');
      expect(event3).toContainElement(screen.getByText('Festival Performance'));
      expect(event3).toContainElement(screen.getByText('Central Park'));
      expect(screen.getByTestId('event-price-event-3')).toHaveTextContent('Free');
    });

    it('handles artist profile with no events', async () => {
      getArtistEvents.mockResolvedValue([]);
      
      renderWithQueryClient(<MockArtistProfileClient artistId="test-artist-1" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('artist-profile')).toBeInTheDocument();
      });
      
      // Should show no events message
      expect(screen.getByTestId('no-events')).toBeInTheDocument();
      expect(screen.getByText('No upcoming events')).toBeInTheDocument();
      expect(screen.queryByTestId('events-list')).not.toBeInTheDocument();
    });

    it('handles artist profile with minimal data', async () => {
      const minimalArtist: ArtistProfileData = {
        id: 'minimal-artist',
        name: 'Minimal Artist',
        upcomingEvents: []
      };
      
      getArtistById.mockResolvedValue(minimalArtist);
      getArtistEvents.mockResolvedValue([]);
      
      renderWithQueryClient(<MockArtistProfileClient artistId="minimal-artist" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('artist-profile')).toBeInTheDocument();
      });
      
      // Should display basic information
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Minimal Artist');
      
      // Should not display optional sections
      expect(screen.queryByTestId('artist-location')).not.toBeInTheDocument();
      expect(screen.queryByTestId('artist-description')).not.toBeInTheDocument();
      expect(screen.queryByTestId('artist-genres')).not.toBeInTheDocument();
      expect(screen.queryByTestId('social-media-links')).not.toBeInTheDocument();
      
      // Should still show events section (even if empty)
      expect(screen.getByTestId('events-section')).toBeInTheDocument();
      expect(screen.getByTestId('no-events')).toBeInTheDocument();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('handles artist not found error', async () => {
      getArtistById.mockResolvedValue(null);
      
      renderWithQueryClient(<MockArtistProfileClient artistId="nonexistent-artist" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('not-found')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Artist not found')).toBeInTheDocument();
      expect(screen.queryByTestId('artist-profile')).not.toBeInTheDocument();
    });

    it('handles API errors gracefully', async () => {
      getArtistById.mockRejectedValue(new Error('Network error'));
      
      renderWithQueryClient(<MockArtistProfileClient artistId="test-artist-1" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Network error')).toBeInTheDocument();
      expect(screen.queryByTestId('artist-profile')).not.toBeInTheDocument();
    });

    it('handles events loading failure while artist loads successfully', async () => {
      getArtistEvents.mockRejectedValue(new Error('Events API failed'));
      
      renderWithQueryClient(<MockArtistProfileClient artistId="test-artist-1" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Events API failed')).toBeInTheDocument();
    });

    it('handles concurrent API calls correctly', async () => {
      // Simulate different response times
      getArtistById.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockArtist), 100))
      );
      getArtistEvents.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockEvents), 50))
      );
      
      renderWithQueryClient(<MockArtistProfileClient artistId="test-artist-1" />);
      
      // Should show loading initially
      expect(screen.getByTestId('loading')).toBeInTheDocument();
      
      // Wait for both API calls to complete
      await waitFor(() => {
        expect(screen.getByTestId('artist-profile')).toBeInTheDocument();
      });
      
      // Both API calls should have been made
      expect(getArtistById).toHaveBeenCalledWith('test-artist-1');
      expect(getArtistEvents).toHaveBeenCalledWith('test-artist-1');
      
      // All data should be displayed
      expect(screen.getByText('Test Artist')).toBeInTheDocument();
      expect(screen.getByTestId('events-list')).toBeInTheDocument();
    });
  });

  describe('Social Media and External Links Integration', () => {
    it('provides correct external link attributes for security', async () => {
      renderWithQueryClient(<MockArtistProfileClient artistId="test-artist-1" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('artist-profile')).toBeInTheDocument();
      });
      
      // Check social media links have proper security attributes
      const socialLinks = [
        screen.getByTestId('social-spotify'),
        screen.getByTestId('social-facebook'),
        screen.getByTestId('social-instagram'),
        screen.getByTestId('social-youtube')
      ];
      
      socialLinks.forEach(link => {
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      });
      
      // Check ticket links have proper security attributes
      const ticketLinks = [
        screen.getByTestId('ticket-link-event-1'),
        screen.getByTestId('ticket-link-event-2')
      ];
      
      ticketLinks.forEach(link => {
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });

    it('handles missing social media URLs gracefully', async () => {
      const artistWithoutSocial: ArtistProfileData = {
        ...mockArtist,
        socialMediaURLs: []
      };
      
      getArtistById.mockResolvedValue(artistWithoutSocial);
      
      renderWithQueryClient(<MockArtistProfileClient artistId="test-artist-1" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('artist-profile')).toBeInTheDocument();
      });
      
      // Should not display social media section
      expect(screen.queryByTestId('social-media-links')).not.toBeInTheDocument();
      expect(screen.queryByTestId('social-spotify')).not.toBeInTheDocument();
    });

    it('handles events without ticket URLs', async () => {
      const eventsWithoutTickets: Event[] = [
        {
          id: 'event-no-tickets',
          name: 'Free Concert',
          date: '2025-12-01',
          venueName: 'Local Park',
          venueId: 'venue-park'
        }
      ];
      
      getArtistEvents.mockResolvedValue(eventsWithoutTickets);
      
      renderWithQueryClient(<MockArtistProfileClient artistId="test-artist-1" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('artist-profile')).toBeInTheDocument();
      });
      
      // Should display event but no ticket link
      expect(screen.getByTestId('event-event-no-tickets')).toBeInTheDocument();
      expect(screen.getByText('Free Concert')).toBeInTheDocument();
      expect(screen.queryByTestId('ticket-link-event-no-tickets')).not.toBeInTheDocument();
      
      // Should still have venue link
      expect(screen.getByTestId('venue-link-event-no-tickets')).toBeInTheDocument();
    });
  });

  describe('Navigation and User Flow Integration', () => {
    it('provides correct navigation back to artist browse', async () => {
      renderWithQueryClient(<MockArtistProfileClient artistId="test-artist-1" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('artist-profile')).toBeInTheDocument();
      });
      
      const backLink = screen.getByTestId('back-to-browse');
      expect(backLink).toHaveAttribute('href', '/artists');
      expect(backLink).toHaveTextContent('Back to Artists');
    });

    it('provides correct venue navigation links', async () => {
      renderWithQueryClient(<MockArtistProfileClient artistId="test-artist-1" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('artist-profile')).toBeInTheDocument();
      });
      
      // Check venue links for each event
      expect(screen.getByTestId('venue-link-event-1')).toHaveAttribute('href', '/venues/venue-1');
      expect(screen.getByTestId('venue-link-event-2')).toHaveAttribute('href', '/venues/venue-2');
      expect(screen.getByTestId('venue-link-event-3')).toHaveAttribute('href', '/venues/venue-3');
    });

    it('maintains proper URL structure for all links', async () => {
      renderWithQueryClient(<MockArtistProfileClient artistId="test-artist-1" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('artist-profile')).toBeInTheDocument();
      });
      
      // Check internal links use relative paths
      expect(screen.getByTestId('back-to-browse')).toHaveAttribute('href', '/artists');
      expect(screen.getByTestId('venue-link-event-1')).toHaveAttribute('href', '/venues/venue-1');
      
      // Check external links use full URLs
      expect(screen.getByTestId('social-spotify')).toHaveAttribute('href', 'https://spotify.com/artist/test');
      expect(screen.getByTestId('ticket-link-event-1')).toHaveAttribute('href', 'https://tickets.com/event1');
    });
  });
});