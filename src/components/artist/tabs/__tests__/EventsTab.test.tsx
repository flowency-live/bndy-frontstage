import { render, screen, fireEvent } from '@testing-library/react';
import EventsTab from '../EventsTab';
import { Event } from '@/lib/types';

// Mock the child components
jest.mock('../../EventsList', () => {
  return function MockEventsList({ events, sortBy }: { events: Event[], sortBy: string }) {
    return <div data-testid="events-list" data-sort-by={sortBy}>Events: {events.length}</div>;
  };
});

jest.mock('../../ArtistEventsMap', () => {
  return function MockArtistEventsMap({ events }: { events: Event[] }) {
    return <div data-testid="artist-events-map">Map with {events.length} events</div>;
  };
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Calendar: () => <span data-testid="calendar-icon" />,
  MapPin: () => <span data-testid="mappin-icon" />,
  Map: () => <span data-testid="map-icon" />,
}));

const mockEvents: Event[] = [
  {
    id: 'event-1',
    name: 'Test Event',
    date: '2025-12-01',
    startTime: '20:00',
    venueName: 'Test Venue',
    venueId: 'venue-1',
    artistIds: ['artist-1'],
    location: { lat: 51.5, lng: -0.1 },
    source: 'bndy.live',
    status: 'approved',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'event-2',
    name: 'Another Event',
    date: '2025-12-15',
    startTime: '19:00',
    venueName: 'Another Venue',
    venueId: 'venue-2',
    artistIds: ['artist-1'],
    location: { lat: 51.6, lng: -0.2 },
    source: 'bndy.live',
    status: 'approved',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  }
];

describe('EventsTab', () => {
  describe('Toggle button rendering', () => {
    it('renders By Date toggle button with Calendar icon', () => {
      render(<EventsTab events={mockEvents} />);

      const dateButton = screen.getByRole('button', { name: /by date/i });
      expect(dateButton).toBeInTheDocument();
      expect(screen.getByTestId('calendar-icon')).toBeInTheDocument();
    });

    it('renders By Distance toggle button with MapPin icon', () => {
      render(<EventsTab events={mockEvents} />);

      const distanceButton = screen.getByRole('button', { name: /by distance/i });
      expect(distanceButton).toBeInTheDocument();
      expect(screen.getByTestId('mappin-icon')).toBeInTheDocument();
    });

    it('renders Map toggle button with Map icon', () => {
      render(<EventsTab events={mockEvents} />);

      const mapButton = screen.getByRole('button', { name: /^map$/i });
      expect(mapButton).toBeInTheDocument();
      expect(screen.getByTestId('map-icon')).toBeInTheDocument();
    });
  });

  describe('View mode switching', () => {
    it('defaults to date view mode', () => {
      render(<EventsTab events={mockEvents} />);

      const dateButton = screen.getByRole('button', { name: /by date/i });
      expect(dateButton).toHaveAttribute('aria-pressed', 'true');

      const eventsList = screen.getByTestId('events-list');
      expect(eventsList).toHaveAttribute('data-sort-by', 'date');
    });

    it('shows EventsList when date mode is selected', () => {
      render(<EventsTab events={mockEvents} />);

      expect(screen.getByTestId('events-list')).toBeInTheDocument();
      expect(screen.queryByTestId('artist-events-map')).not.toBeInTheDocument();
    });

    it('shows EventsList when distance mode is selected', () => {
      render(<EventsTab events={mockEvents} />);

      const distanceButton = screen.getByRole('button', { name: /by distance/i });
      fireEvent.click(distanceButton);

      expect(screen.getByTestId('events-list')).toBeInTheDocument();
      expect(screen.getByTestId('events-list')).toHaveAttribute('data-sort-by', 'distance');
      expect(screen.queryByTestId('artist-events-map')).not.toBeInTheDocument();
    });

    it('shows ArtistEventsMap when map mode is selected', () => {
      render(<EventsTab events={mockEvents} />);

      const mapButton = screen.getByRole('button', { name: /^map$/i });
      fireEvent.click(mapButton);

      expect(screen.getByTestId('artist-events-map')).toBeInTheDocument();
      expect(screen.queryByTestId('events-list')).not.toBeInTheDocument();
    });

    it('switches from map back to date mode correctly', () => {
      render(<EventsTab events={mockEvents} />);

      // Go to map
      const mapButton = screen.getByRole('button', { name: /^map$/i });
      fireEvent.click(mapButton);
      expect(screen.getByTestId('artist-events-map')).toBeInTheDocument();

      // Go back to date
      const dateButton = screen.getByRole('button', { name: /by date/i });
      fireEvent.click(dateButton);
      expect(screen.getByTestId('events-list')).toBeInTheDocument();
      expect(screen.queryByTestId('artist-events-map')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has correct aria-pressed state on toggle buttons', () => {
      render(<EventsTab events={mockEvents} />);

      const dateButton = screen.getByRole('button', { name: /by date/i });
      const distanceButton = screen.getByRole('button', { name: /by distance/i });
      const mapButton = screen.getByRole('button', { name: /^map$/i });

      // Initially date is pressed
      expect(dateButton).toHaveAttribute('aria-pressed', 'true');
      expect(distanceButton).toHaveAttribute('aria-pressed', 'false');
      expect(mapButton).toHaveAttribute('aria-pressed', 'false');

      // Click map button
      fireEvent.click(mapButton);
      expect(dateButton).toHaveAttribute('aria-pressed', 'false');
      expect(distanceButton).toHaveAttribute('aria-pressed', 'false');
      expect(mapButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('has tabpanel role on container', () => {
      render(<EventsTab events={mockEvents} />);

      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });
  });

  describe('Event data passing', () => {
    it('passes events to EventsList component', () => {
      render(<EventsTab events={mockEvents} />);

      const eventsList = screen.getByTestId('events-list');
      expect(eventsList).toHaveTextContent('Events: 2');
    });

    it('passes events to ArtistEventsMap component', () => {
      render(<EventsTab events={mockEvents} />);

      const mapButton = screen.getByRole('button', { name: /^map$/i });
      fireEvent.click(mapButton);

      const eventsMap = screen.getByTestId('artist-events-map');
      expect(eventsMap).toHaveTextContent('Map with 2 events');
    });
  });
});
