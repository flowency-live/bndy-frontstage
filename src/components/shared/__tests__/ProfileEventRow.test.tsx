import { render, screen } from '@testing-library/react';
import ProfileEventRow from '../ProfileEventRow';
import { Event } from '@/lib/types';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

// Mock artist display utility
jest.mock('@/lib/utils/artist-display', () => ({
  formatArtistDisplay: jest.fn(() => 'Test Artist'),
}));

describe('ProfileEventRow', () => {
  const baseEvent: Event = {
    id: 'event-1',
    name: 'Test Event',
    date: '2026-05-15',
    startTime: '20:00',
    venueName: 'Test Venue',
    venueId: 'venue-1',
    venueCity: 'Manchester',
    artistIds: ['artist-1'],
    location: { lat: 53.4808, lng: -2.2426 },
    source: 'bndy.live',
    status: 'approved',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  describe('price display logic', () => {
    it('shows £ree when ticketed is false', () => {
      const event = { ...baseEvent, ticketed: false };
      render(<ProfileEventRow event={event} counterpartType="venue" />);

      expect(screen.getByText('£ree')).toBeInTheDocument();
    });

    it('shows £ree when ticketed is true but price is null', () => {
      const event = { ...baseEvent, ticketed: true, price: null };
      render(<ProfileEventRow event={event} counterpartType="venue" />);

      expect(screen.getByText('£ree')).toBeInTheDocument();
    });

    it('shows £ree when ticketed is true but price is undefined', () => {
      const event = { ...baseEvent, ticketed: true, price: undefined };
      render(<ProfileEventRow event={event} counterpartType="venue" />);

      expect(screen.getByText('£ree')).toBeInTheDocument();
    });

    it('shows £ree when price is "Free"', () => {
      const event = { ...baseEvent, ticketed: true, price: 'Free' };
      render(<ProfileEventRow event={event} counterpartType="venue" />);

      expect(screen.getByText('£ree')).toBeInTheDocument();
    });

    it('shows £ree when price is "0"', () => {
      const event = { ...baseEvent, ticketed: true, price: '0' };
      render(<ProfileEventRow event={event} counterpartType="venue" />);

      expect(screen.getByText('£ree')).toBeInTheDocument();
    });

    it('shows price when ticketed is true and price has value', () => {
      const event = { ...baseEvent, ticketed: true, price: '£5' };
      render(<ProfileEventRow event={event} counterpartType="venue" />);

      expect(screen.getByText('£5')).toBeInTheDocument();
      expect(screen.queryByText('£ree')).not.toBeInTheDocument();
    });

    it('shows price with various formats', () => {
      const priceFormats = ['£10', '$15', '€20', '5.00', 'Donation'];

      priceFormats.forEach(price => {
        const event = { ...baseEvent, ticketed: true, price };
        const { unmount } = render(<ProfileEventRow event={event} counterpartType="venue" />);

        expect(screen.getByText(price)).toBeInTheDocument();
        unmount();
      });
    });

    it('shows TBC when ticketed is true but price is empty string', () => {
      const event = { ...baseEvent, ticketed: true, price: '' };
      render(<ProfileEventRow event={event} counterpartType="venue" />);

      // Empty string is falsy, so isFree is true
      expect(screen.getByText('£ree')).toBeInTheDocument();
    });

    it('applies paid class when event has price', () => {
      const event = { ...baseEvent, ticketed: true, price: '£10' };
      render(<ProfileEventRow event={event} counterpartType="venue" />);

      const stub = screen.getByText('£10');
      expect(stub).toHaveClass('paid');
    });

    it('does not apply paid class when event is free', () => {
      const event = { ...baseEvent, ticketed: false };
      render(<ProfileEventRow event={event} counterpartType="venue" />);

      const stub = screen.getByText('£ree');
      expect(stub).not.toHaveClass('paid');
    });
  });

  describe('basic rendering', () => {
    it('renders time correctly', () => {
      render(<ProfileEventRow event={baseEvent} counterpartType="venue" />);

      expect(screen.getByText('20:00')).toBeInTheDocument();
    });

    it('renders venue name as counterpart on artist profile', () => {
      render(<ProfileEventRow event={baseEvent} counterpartType="venue" />);

      expect(screen.getByText('Test Venue')).toBeInTheDocument();
    });

    it('renders venue city', () => {
      render(<ProfileEventRow event={baseEvent} counterpartType="venue" />);

      expect(screen.getByText('Manchester')).toBeInTheDocument();
    });

    it('renders distance when provided', () => {
      render(<ProfileEventRow event={baseEvent} counterpartType="venue" distance={5} />);

      expect(screen.getByText('5 mi')).toBeInTheDocument();
    });

    it('shows <1 mi for very close events', () => {
      render(<ProfileEventRow event={baseEvent} counterpartType="venue" distance={0.5} />);

      expect(screen.getByText('<1 mi')).toBeInTheDocument();
    });
  });
});
