import { render, screen, fireEvent } from '@testing-library/react';
import EventMarkerPopup from '../EventMarkerPopup';
import { Event } from '@/lib/types';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: { children: React.ReactNode; href: string }) {
    return <a href={href} {...props}>{children}</a>;
  };
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  X: () => <span data-testid="x-icon" />,
  ChevronLeft: () => <span data-testid="chevron-left-icon" />,
  ChevronRight: () => <span data-testid="chevron-right-icon" />,
  MapPin: () => <span data-testid="mappin-icon" />,
}));

// Mock date-utils
jest.mock('@/lib/utils/date-utils', () => ({
  formatEventDate: jest.fn((date: Date) => {
    const d = new Date(date);
    if (d.toDateString() === new Date().toDateString()) return 'Today';
    return 'Sat 22nd Feb';
  }),
  formatTime: jest.fn((time: string) => {
    if (!time) return 'TBA';
    const [hours] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:00${period}`;
  }),
}));

const createMockEvent = (overrides: Partial<Event> = {}): Event => ({
  id: 'event-1',
  name: 'Test Event',
  date: '2025-02-22',
  startTime: '19:00',
  endTime: '23:00',
  venueName: 'The Blue Lamp',
  venueId: 'venue-123',
  venueCity: 'Aberdeen',
  artistIds: ['artist-1'],
  location: { lat: 57.15, lng: -2.1 },
  source: 'bndy.live',
  status: 'approved',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  ...overrides,
});

describe('EventMarkerPopup', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Content rendering', () => {
    it('displays formatted event date', () => {
      const event = createMockEvent();
      render(<EventMarkerPopup events={[event]} onClose={mockOnClose} />);

      expect(screen.getByText('Sat 22nd Feb')).toBeInTheDocument();
    });

    it('displays formatted start and end time', () => {
      const event = createMockEvent({ startTime: '19:00', endTime: '23:00' });
      render(<EventMarkerPopup events={[event]} onClose={mockOnClose} />);

      expect(screen.getByText(/7:00PM/)).toBeInTheDocument();
      expect(screen.getByText(/11:00PM/)).toBeInTheDocument();
    });

    it('displays venue name as clickable link', () => {
      const event = createMockEvent({ venueName: 'The Blue Lamp', venueId: 'venue-123' });
      render(<EventMarkerPopup events={[event]} onClose={mockOnClose} />);

      const venueLink = screen.getByRole('link', { name: /The Blue Lamp/i });
      expect(venueLink).toBeInTheDocument();
    });

    it('links to correct venue page', () => {
      const event = createMockEvent({ venueId: 'venue-123' });
      render(<EventMarkerPopup events={[event]} onClose={mockOnClose} />);

      const venueLink = screen.getByRole('link', { name: /The Blue Lamp/i });
      expect(venueLink).toHaveAttribute('href', '/venues/venue-123');
    });

    it('displays venue city when available', () => {
      const event = createMockEvent({ venueCity: 'Aberdeen' });
      render(<EventMarkerPopup events={[event]} onClose={mockOnClose} />);

      expect(screen.getByText(/Aberdeen/)).toBeInTheDocument();
    });
  });

  describe('Close behavior', () => {
    it('calls onClose when close button clicked', () => {
      const event = createMockEvent();
      render(<EventMarkerPopup events={[event]} onClose={mockOnClose} />);

      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Multiple events navigation', () => {
    it('shows navigation when multiple events provided', () => {
      const events = [
        createMockEvent({ id: 'event-1' }),
        createMockEvent({ id: 'event-2', date: '2025-03-15' }),
        createMockEvent({ id: 'event-3', date: '2025-04-20' }),
      ];
      render(<EventMarkerPopup events={events} onClose={mockOnClose} />);

      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });

    it('shows "1 of N" counter', () => {
      const events = [
        createMockEvent({ id: 'event-1' }),
        createMockEvent({ id: 'event-2' }),
        createMockEvent({ id: 'event-3' }),
      ];
      render(<EventMarkerPopup events={events} onClose={mockOnClose} />);

      expect(screen.getByText('1 of 3')).toBeInTheDocument();
    });

    it('navigates to next event when Next clicked', () => {
      const events = [
        createMockEvent({ id: 'event-1', venueName: 'Venue One' }),
        createMockEvent({ id: 'event-2', venueName: 'Venue Two' }),
      ];
      render(<EventMarkerPopup events={events} onClose={mockOnClose} />);

      // Initially shows first venue
      expect(screen.getByText(/Venue One/)).toBeInTheDocument();

      // Click next
      fireEvent.click(screen.getByRole('button', { name: /next/i }));

      // Now shows second venue
      expect(screen.getByText(/Venue Two/)).toBeInTheDocument();
      expect(screen.getByText('2 of 2')).toBeInTheDocument();
    });

    it('navigates to previous event when Prev clicked', () => {
      const events = [
        createMockEvent({ id: 'event-1', venueName: 'Venue One' }),
        createMockEvent({ id: 'event-2', venueName: 'Venue Two' }),
      ];
      render(<EventMarkerPopup events={events} onClose={mockOnClose} />);

      // Go to second event first
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      expect(screen.getByText(/Venue Two/)).toBeInTheDocument();

      // Click previous
      fireEvent.click(screen.getByRole('button', { name: /previous/i }));

      // Back to first venue
      expect(screen.getByText(/Venue One/)).toBeInTheDocument();
      expect(screen.getByText('1 of 2')).toBeInTheDocument();
    });

    it('disables previous button on first event', () => {
      const events = [
        createMockEvent({ id: 'event-1' }),
        createMockEvent({ id: 'event-2' }),
      ];
      render(<EventMarkerPopup events={events} onClose={mockOnClose} />);

      const prevButton = screen.getByRole('button', { name: /previous/i });
      expect(prevButton).toBeDisabled();
    });

    it('disables next button on last event', () => {
      const events = [
        createMockEvent({ id: 'event-1' }),
        createMockEvent({ id: 'event-2' }),
      ];
      render(<EventMarkerPopup events={events} onClose={mockOnClose} />);

      // Go to last event
      fireEvent.click(screen.getByRole('button', { name: /next/i }));

      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Single event', () => {
    it('hides navigation when single event provided', () => {
      const event = createMockEvent();
      render(<EventMarkerPopup events={[event]} onClose={mockOnClose} />);

      expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument();
      expect(screen.queryByText(/of/)).not.toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles missing endTime gracefully', () => {
      const event = createMockEvent({ startTime: '19:00', endTime: undefined });
      render(<EventMarkerPopup events={[event]} onClose={mockOnClose} />);

      expect(screen.getByText(/7:00PM/)).toBeInTheDocument();
      // Should not crash and should not show "- undefined"
      expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
    });

    it('handles missing venueCity gracefully', () => {
      const event = createMockEvent({ venueCity: undefined });
      render(<EventMarkerPopup events={[event]} onClose={mockOnClose} />);

      // Should render without crashing
      expect(screen.getByText(/The Blue Lamp/)).toBeInTheDocument();
    });

    it('handles empty events array gracefully', () => {
      render(<EventMarkerPopup events={[]} onClose={mockOnClose} />);

      // Should render something or nothing without crashing
      expect(screen.queryByRole('button', { name: /close/i })).toBeInTheDocument();
    });
  });
});
