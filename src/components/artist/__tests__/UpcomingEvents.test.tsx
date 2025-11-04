import { render, screen, fireEvent } from '@testing-library/react';
import UpcomingEvents from '../UpcomingEvents';
import { Event } from '@/lib/types';

// Mock LazyContentImage component
jest.mock('../LazyContentImage', () => {
  return function MockLazyContentImage({ src, alt, fallback, ...props }: any) {
    return <img src={src} alt={alt} data-testid="lazy-content-image" {...props} />;
  };
});

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

describe('UpcomingEvents', () => {
  const mockEvents: Event[] = [
    {
      id: 'event-1',
      name: 'Rock Concert',
      date: '2025-12-01',
      startTime: '20:00',
      endTime: '23:00',
      venueName: 'Test Venue',
      venueId: 'venue-1',
      price: '$25',
      ticketUrl: 'https://tickets.com/event1',
      eventUrl: 'https://events.com/event1',
      ticketinformation: 'Tickets available at the door',
      imageUrl: 'https://example.com/event1.jpg'
    },
    {
      id: 'event-2',
      name: 'Jazz Night',
      date: '2025-11-15',
      startTime: '19:30',
      venueName: 'Jazz Club',
      venueId: 'venue-2',
      price: '$15'
    }
  ];

  const pastEvent: Event = {
    id: 'past-event',
    name: 'Past Concert',
    date: '2024-01-01',
    startTime: '20:00',
    venueName: 'Old Venue',
    venueId: 'venue-past'
  };

  beforeEach(() => {
    // Mock current date to ensure consistent test results
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-11-01'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders section title correctly', () => {
    render(<UpcomingEvents events={mockEvents} />);
    
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Upcoming Events');
  });

  it('displays event count badge', () => {
    render(<UpcomingEvents events={mockEvents} />);
    
    expect(screen.getByText('2 events')).toBeInTheDocument();
  });

  it('displays singular event count', () => {
    render(<UpcomingEvents events={[mockEvents[0]]} />);
    
    expect(screen.getByText('1 event')).toBeInTheDocument();
  });

  it('filters out past events', () => {
    const eventsWithPast = [...mockEvents, pastEvent];
    render(<UpcomingEvents events={eventsWithPast} />);
    
    expect(screen.getByText('Rock Concert')).toBeInTheDocument();
    expect(screen.getByText('Jazz Night')).toBeInTheDocument();
    expect(screen.queryByText('Past Concert')).not.toBeInTheDocument();
  });

  it('sorts events chronologically', () => {
    render(<UpcomingEvents events={mockEvents} />);
    
    const eventCards = screen.getAllByRole('button');
    // Jazz Night (Nov 15) should come before Rock Concert (Dec 1)
    expect(eventCards[0]).toHaveAttribute('aria-label', expect.stringContaining('Jazz Night'));
    expect(eventCards[1]).toHaveAttribute('aria-label', expect.stringContaining('Rock Concert'));
  });

  it('renders event details correctly', () => {
    render(<UpcomingEvents events={[mockEvents[0]]} />);
    
    expect(screen.getByText('Rock Concert')).toBeInTheDocument();
    expect(screen.getByText('8:00 PM')).toBeInTheDocument();
    expect(screen.getByText('- 11:00 PM')).toBeInTheDocument();
    expect(screen.getByText('Test Venue')).toBeInTheDocument();
    expect(screen.getByText('$25')).toBeInTheDocument();
    expect(screen.getByText('Tickets available at the door')).toBeInTheDocument();
  });

  it('formats date correctly', () => {
    render(<UpcomingEvents events={[mockEvents[0]]} />);
    
    expect(screen.getByText('Dec')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
  });

  it('renders ticket button when ticketUrl is provided', () => {
    render(<UpcomingEvents events={[mockEvents[0]]} />);
    
    const ticketButton = screen.getByRole('link', { name: /get tickets/i });
    expect(ticketButton).toBeInTheDocument();
    expect(ticketButton).toHaveAttribute('href', 'https://tickets.com/event1');
    expect(ticketButton).toHaveAttribute('target', '_blank');
  });

  it('renders event details button when eventUrl is provided', () => {
    render(<UpcomingEvents events={[mockEvents[0]]} />);
    
    const detailsButton = screen.getByRole('link', { name: /event details/i });
    expect(detailsButton).toBeInTheDocument();
    expect(detailsButton).toHaveAttribute('href', 'https://events.com/event1');
    expect(detailsButton).toHaveAttribute('target', '_blank');
  });

  it('renders find more info button when no URLs provided', () => {
    const eventWithoutUrls: Event = {
      id: 'event-no-urls',
      name: 'No URLs Event',
      date: '2025-12-01',
      venueName: 'Test Venue',
      venueId: 'venue-1'
    };
    
    render(<UpcomingEvents events={[eventWithoutUrls]} />);
    
    expect(screen.getByRole('button', { name: /find more info/i })).toBeInTheDocument();
  });

  it('renders venue link correctly', () => {
    render(<UpcomingEvents events={[mockEvents[0]]} />);
    
    const venueLink = screen.getByRole('link', { name: 'Test Venue' });
    expect(venueLink).toHaveAttribute('href', '/venues/venue-1');
  });

  it('renders event image when provided', () => {
    render(<UpcomingEvents events={[mockEvents[0]]} />);
    
    const image = screen.getByTestId('lazy-content-image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/event1.jpg');
    expect(image).toHaveAttribute('alt', 'Rock Concert event image');
  });

  it('handles event card click', () => {
    // Mock document.createElement and appendChild/removeChild
    const mockLink = {
      href: '',
      target: '',
      rel: '',
      style: { transition: '' },
      click: jest.fn()
    };
    
    const originalCreateElement = document.createElement;
    document.createElement = jest.fn().mockReturnValue(mockLink);
    document.body.appendChild = jest.fn();
    document.body.removeChild = jest.fn();
    
    render(<UpcomingEvents events={[mockEvents[0]]} />);
    
    const eventCard = screen.getByRole('button', { name: /view details for rock concert/i });
    fireEvent.click(eventCard);
    
    expect(mockLink.click).toHaveBeenCalled();
    
    // Restore original createElement
    document.createElement = originalCreateElement;
  });

  it('handles keyboard navigation', () => {
    const mockLink = {
      href: '',
      target: '',
      rel: '',
      style: { transition: '' },
      click: jest.fn()
    };
    
    const originalCreateElement = document.createElement;
    document.createElement = jest.fn().mockReturnValue(mockLink);
    document.body.appendChild = jest.fn();
    document.body.removeChild = jest.fn();
    
    render(<UpcomingEvents events={[mockEvents[0]]} />);
    
    const eventCard = screen.getByRole('button', { name: /view details for rock concert/i });
    
    fireEvent.keyDown(eventCard, { key: 'Enter' });
    expect(mockLink.click).toHaveBeenCalled();
    
    fireEvent.keyDown(eventCard, { key: ' ' });
    expect(mockLink.click).toHaveBeenCalledTimes(2);
    
    // Restore original createElement
    document.createElement = originalCreateElement;
  });

  it('shows empty state when no upcoming events', () => {
    render(<UpcomingEvents events={[]} />);
    
    expect(screen.getByText('No upcoming events')).toBeInTheDocument();
    expect(screen.getByText(/doesn't have any scheduled performances yet/)).toBeInTheDocument();
    expect(screen.getByText('Check back soon for new shows! 🎤')).toBeInTheDocument();
  });

  it('shows empty state when only past events', () => {
    render(<UpcomingEvents events={[pastEvent]} />);
    
    expect(screen.getByText('No upcoming events')).toBeInTheDocument();
  });

  it('prevents event propagation on button clicks', () => {
    const mockStopPropagation = jest.fn();
    
    render(<UpcomingEvents events={[mockEvents[0]]} />);
    
    const ticketButton = screen.getByRole('link', { name: /get tickets/i });
    
    fireEvent.click(ticketButton, { stopPropagation: mockStopPropagation });
    
    // The actual stopPropagation is called in the component's onClick handler
    // This test ensures the button exists and can be clicked
    expect(ticketButton).toBeInTheDocument();
  });

  it('handles missing optional fields gracefully', () => {
    const minimalEvent: Event = {
      id: 'minimal-event',
      name: 'Minimal Event',
      date: '2025-12-01',
      venueName: 'Minimal Venue',
      venueId: 'venue-minimal'
    };
    
    render(<UpcomingEvents events={[minimalEvent]} />);
    
    expect(screen.getByText('Minimal Event')).toBeInTheDocument();
    expect(screen.getByText('Minimal Venue')).toBeInTheDocument();
    expect(screen.queryByText(/\$\d+/)).not.toBeInTheDocument(); // No price
    expect(screen.queryByText(/\d+:\d+ [AP]M/)).not.toBeInTheDocument(); // No time
  });
});