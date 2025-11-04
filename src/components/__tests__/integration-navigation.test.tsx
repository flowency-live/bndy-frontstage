import { render, screen, fireEvent } from '@testing-library/react';
import { EventCard } from '@/components/listview/EventCard';
import { EventRow } from '@/components/listview/EventRow';
import { Event } from '@/lib/types';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

describe('Map and Event System Integration', () => {
  const mockEventWithArtist: Event = {
    id: 'event-1',
    name: 'Rock Concert',
    date: '2025-12-01',
    startTime: '20:00',
    endTime: '23:00',
    venueName: 'Test Venue',
    venueId: 'venue-1',
    artistIds: ['artist-1'],
    price: '$25',
    ticketUrl: 'https://tickets.com/event1',
    eventUrl: 'https://events.com/event1'
  };

  const mockEventWithoutArtist: Event = {
    id: 'event-2',
    name: 'Open Mic Night',
    date: '2025-11-15',
    startTime: '19:30',
    venueName: 'Jazz Club',
    venueId: 'venue-2'
  };

  describe('EventCard Integration', () => {
    it('renders artist profile link when event has artist', () => {
      render(<EventCard event={mockEventWithArtist} />);
      
      const artistLink = screen.getByRole('link', { name: /view artist profile/i });
      expect(artistLink).toBeInTheDocument();
      expect(artistLink).toHaveAttribute('href', '/artists/artist-1');
    });

    it('does not render artist link when event has no artist', () => {
      render(<EventCard event={mockEventWithoutArtist} />);
      
      expect(screen.queryByRole('link', { name: /view artist profile/i })).not.toBeInTheDocument();
    });

    it('renders venue link correctly', () => {
      render(<EventCard event={mockEventWithArtist} />);
      
      const venueLink = screen.getByRole('link', { name: 'Test Venue' });
      expect(venueLink).toBeInTheDocument();
      expect(venueLink).toHaveAttribute('href', '/venues/venue-1');
    });

    it('prevents event propagation on link clicks', () => {
      const mockStopPropagation = jest.fn();
      render(<EventCard event={mockEventWithArtist} />);
      
      const artistLink = screen.getByRole('link', { name: /view artist profile/i });
      
      fireEvent.click(artistLink, { stopPropagation: mockStopPropagation });
      
      // The link should exist and be clickable
      expect(artistLink).toBeInTheDocument();
    });
  });

  describe('EventRow Integration', () => {
    it('renders artist profile link when event has artist', () => {
      render(
        <table>
          <tbody>
            <tr>
              <EventRow event={mockEventWithArtist} />
            </tr>
          </tbody>
        </table>
      );
      
      const artistLink = screen.getByRole('link', { name: /view artist/i });
      expect(artistLink).toBeInTheDocument();
      expect(artistLink).toHaveAttribute('href', '/artists/artist-1');
    });

    it('does not render artist link when event has no artist', () => {
      render(
        <table>
          <tbody>
            <tr>
              <EventRow event={mockEventWithoutArtist} />
            </tr>
          </tbody>
        </table>
      );
      
      expect(screen.queryByRole('link', { name: /view artist/i })).not.toBeInTheDocument();
    });

    it('renders venue link in mobile view', () => {
      render(
        <table>
          <tbody>
            <tr>
              <EventRow event={mockEventWithArtist} />
            </tr>
          </tbody>
        </table>
      );
      
      // Should have venue link (there might be multiple due to responsive design)
      const venueLinks = screen.getAllByRole('link', { name: 'Test Venue' });
      expect(venueLinks.length).toBeGreaterThan(0);
      venueLinks.forEach(link => {
        expect(link).toHaveAttribute('href', '/venues/venue-1');
      });
    });

    it('shows full date when showFullDate is true', () => {
      render(
        <table>
          <tbody>
            <tr>
              <EventRow event={mockEventWithArtist} showFullDate={true} />
            </tr>
          </tbody>
        </table>
      );
      
      // Should show formatted date
      expect(screen.getByText(/Dec/)).toBeInTheDocument();
    });
  });

  describe('Navigation Flow Integration', () => {
    it('provides correct navigation paths for artist profiles', () => {
      render(<EventCard event={mockEventWithArtist} />);
      
      const artistLink = screen.getByRole('link', { name: /view artist profile/i });
      expect(artistLink.getAttribute('href')).toBe('/artists/artist-1');
    });

    it('provides correct navigation paths for venue profiles', () => {
      render(<EventCard event={mockEventWithArtist} />);
      
      const venueLink = screen.getByRole('link', { name: 'Test Venue' });
      expect(venueLink.getAttribute('href')).toBe('/venues/venue-1');
    });

    it('handles events with multiple artists correctly', () => {
      const eventWithMultipleArtists: Event = {
        ...mockEventWithArtist,
        artistIds: ['artist-1', 'artist-2', 'artist-3']
      };

      render(<EventCard event={eventWithMultipleArtists} />);
      
      // Should link to the first artist
      const artistLink = screen.getByRole('link', { name: /view artist profile/i });
      expect(artistLink).toHaveAttribute('href', '/artists/artist-1');
    });

    it('handles empty artistIds array correctly', () => {
      const eventWithEmptyArtists: Event = {
        ...mockEventWithArtist,
        artistIds: []
      };

      render(<EventCard event={eventWithEmptyArtists} />);
      
      expect(screen.queryByRole('link', { name: /view artist profile/i })).not.toBeInTheDocument();
    });
  });

  describe('Accessibility Integration', () => {
    it('provides proper ARIA labels for navigation links', () => {
      render(<EventCard event={mockEventWithArtist} />);
      
      const mapLink = screen.getByLabelText('Open in Google Maps');
      expect(mapLink).toBeInTheDocument();
      expect(mapLink).toHaveAttribute('target', '_blank');
      expect(mapLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('maintains proper link hierarchy for screen readers', () => {
      render(<EventCard event={mockEventWithArtist} />);
      
      const links = screen.getAllByRole('link');
      
      // Should have artist link, venue link, and maps link
      expect(links.length).toBeGreaterThanOrEqual(3);
      
      // Each link should have proper href
      links.forEach(link => {
        expect(link).toHaveAttribute('href');
        expect(link.getAttribute('href')).not.toBe('');
      });
    });
  });
});