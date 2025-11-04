import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EventsList from '../EventsList';
import { Event } from '@/lib/types';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

// Mock distance utilities
jest.mock('@/lib/utils/distance', () => ({
  getUserLocation: jest.fn(),
  calculateDistance: jest.fn(),
  formatDistance: jest.fn(),
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => {
    const d = new Date(date);
    if (formatStr === 'EEE, MMM d, yyyy') {
      return 'Mon, Dec 1, 2025';
    }
    return d.toISOString();
  }),
}));

const { getUserLocation, calculateDistance, formatDistance } = require('@/lib/utils/distance');

describe('EventsList', () => {
  const mockEvents: Event[] = [
    {
      id: 'event-1',
      name: 'Rock Concert',
      date: '2025-12-01',
      startTime: '20:00',
      endTime: '23:00',
      venueName: 'Test Venue',
      venueId: 'venue-1',
      artistIds: ['artist-1'],
      location: { lat: 40.7128, lng: -74.0060 },
      price: '$25',
      ticketUrl: 'https://tickets.com/event1',
      eventUrl: 'https://events.com/event1',
      ticketinformation: 'Tickets available at the door',
      source: 'bndy.live',
      status: 'approved',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    },
    {
      id: 'event-2',
      name: 'Jazz Night',
      date: '2025-11-15',
      startTime: '19:30',
      venueName: 'Jazz Club',
      venueId: 'venue-2',
      artistIds: ['artist-2'],
      location: { lat: 40.7589, lng: -73.9851 },
      price: '$15',
      source: 'bndy.live',
      status: 'approved',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    getUserLocation.mockResolvedValue({ lat: 40.7128, lng: -74.0060 });
    calculateDistance.mockReturnValue(5.2);
    formatDistance.mockReturnValue('5.2 mi');
  });

  it('renders section title correctly', () => {
    render(<EventsList events={mockEvents} />);
    
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Upcoming Events');
  });

  it('displays event count in header', async () => {
    render(<EventsList events={mockEvents} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Upcoming Events \(2\)/)).toBeInTheDocument();
    });
  });

  it('renders all event details correctly', () => {
    render(<EventsList events={mockEvents} />);
    
    // Check first event details
    expect(screen.getByText('Rock Concert')).toBeInTheDocument();
    expect(screen.getByText('20:00')).toBeInTheDocument();
    expect(screen.getByText('- 23:00')).toBeInTheDocument();
    expect(screen.getByText('Test Venue')).toBeInTheDocument();
    expect(screen.getByText('$25')).toBeInTheDocument();
    expect(screen.getByText('Tickets available at the door')).toBeInTheDocument();
    
    // Check second event details
    expect(screen.getByText('Jazz Night')).toBeInTheDocument();
    expect(screen.getByText('19:30')).toBeInTheDocument();
    expect(screen.getByText('Jazz Club')).toBeInTheDocument();
    expect(screen.getByText('$15')).toBeInTheDocument();
  });

  it('renders ticket and event detail links correctly', () => {
    render(<EventsList events={mockEvents} />);
    
    const ticketLink = screen.getByRole('link', { name: /get tickets/i });
    expect(ticketLink).toBeInTheDocument();
    expect(ticketLink).toHaveAttribute('href', 'https://tickets.com/event1');
    expect(ticketLink).toHaveAttribute('target', '_blank');
    
    const eventDetailsLink = screen.getByRole('link', { name: /event details/i });
    expect(eventDetailsLink).toBeInTheDocument();
    expect(eventDetailsLink).toHaveAttribute('href', 'https://events.com/event1');
    expect(eventDetailsLink).toHaveAttribute('target', '_blank');
  });

  it('renders venue links correctly', () => {
    render(<EventsList events={mockEvents} />);
    
    const venueLinks = screen.getAllByRole('link', { name: /view venue/i });
    expect(venueLinks.length).toBeGreaterThan(0);
    
    venueLinks.forEach(link => {
      expect(link).toHaveAttribute('href', expect.stringMatching(/\/venues\//));
    });
  });

  it('shows empty state when no events provided', () => {
    render(<EventsList events={[]} />);
    
    expect(screen.getByText('No upcoming events')).toBeInTheDocument();
    expect(screen.getByText('Check back later for new performances and shows.')).toBeInTheDocument();
  });

  it('displays location filter when user location is available', async () => {
    render(<EventsList events={mockEvents} />);
    
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
    
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    
    // Check filter options
    expect(screen.getByRole('option', { name: 'All distances' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Within 5 miles' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Within 10 miles' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Within 25 miles' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Within 50 miles' })).toBeInTheDocument();
  });

  it('filters events by distance when filter is applied', async () => {
    // Mock one event being far away
    calculateDistance.mockImplementation((userLoc: any, eventLoc: any) => {
      if (eventLoc.lat === 40.7589) return 15; // Jazz Night is 15 miles away
      return 5; // Rock Concert is 5 miles away
    });

    render(<EventsList events={mockEvents} />);
    
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
    
    // Apply 10 mile filter
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '10' } });
    
    await waitFor(() => {
      // Should show filtered count
      expect(screen.getByText(/Upcoming Events \(1 of 2\)/)).toBeInTheDocument();
      // Should show Rock Concert but not Jazz Night
      expect(screen.getByText('Rock Concert')).toBeInTheDocument();
      expect(screen.queryByText('Jazz Night')).not.toBeInTheDocument();
    });
  });

  it('shows empty state when all events are filtered out', async () => {
    // Mock all events being far away
    calculateDistance.mockReturnValue(100);

    render(<EventsList events={mockEvents} />);
    
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
    
    // Apply 5 mile filter
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '5' } });
    
    await waitFor(() => {
      expect(screen.getByText('No events within 5 miles')).toBeInTheDocument();
      expect(screen.getByText('Try expanding your search radius or')).toBeInTheDocument();
    });
    
    // Test "view all events" button
    const viewAllButton = screen.getByRole('button', { name: /view all events/i });
    fireEvent.click(viewAllButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Upcoming Events \(2\)/)).toBeInTheDocument();
    });
  });

  it('displays distance information when user location is available', async () => {
    render(<EventsList events={mockEvents} />);
    
    await waitFor(() => {
      expect(formatDistance).toHaveBeenCalled();
      expect(screen.getByText('5.2 mi')).toBeInTheDocument();
    });
  });

  it('handles missing optional event fields gracefully', () => {
    const minimalEvent: Event = {
      id: 'minimal-event',
      name: 'Minimal Event',
      date: '2025-12-01',
      startTime: '19:00',
      venueName: 'Minimal Venue',
      venueId: 'venue-minimal',
      artistIds: [],
      location: { lat: 40.7128, lng: -74.0060 },
      source: 'bndy.live',
      status: 'approved',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    };
    
    render(<EventsList events={[minimalEvent]} />);
    
    expect(screen.getByText('Minimal Event')).toBeInTheDocument();
    expect(screen.getByText('Minimal Venue')).toBeInTheDocument();
    
    // Should not show missing fields
    expect(screen.queryByText(/\$\d+/)).not.toBeInTheDocument(); // No price
    expect(screen.queryByText(/get tickets/i)).not.toBeInTheDocument(); // No ticket URL
    expect(screen.queryByText(/event details/i)).not.toBeInTheDocument(); // No event URL
  });

  it('handles user location permission denied gracefully', async () => {
    getUserLocation.mockResolvedValue(null);
    
    render(<EventsList events={mockEvents} />);
    
    await waitFor(() => {
      // Should not show location filter
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
      // Should still show events
      expect(screen.getByText('Rock Concert')).toBeInTheDocument();
      expect(screen.getByText('Jazz Night')).toBeInTheDocument();
    });
  });

  it('formats dates correctly', () => {
    render(<EventsList events={mockEvents} />);
    
    expect(screen.getByText('Mon, Dec 1, 2025')).toBeInTheDocument();
  });

  it('handles events without location data', async () => {
    const eventsWithoutLocation = mockEvents.map(event => ({
      ...event,
      location: { lat: 0, lng: 0 } // Events must have location, use default
    }));
    
    render(<EventsList events={eventsWithoutLocation} />);
    
    await waitFor(() => {
      // Should show events but no distance info
      expect(screen.getByText('Rock Concert')).toBeInTheDocument();
      expect(screen.queryByText('5.2 mi')).not.toBeInTheDocument();
    });
  });

  it('applies correct accessibility attributes', () => {
    render(<EventsList events={mockEvents} />);
    
    // Check heading hierarchy
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    
    // Check links have proper attributes
    const externalLinks = screen.getAllByRole('link', { name: /get tickets|event details/i });
    externalLinks.forEach(link => {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });
});