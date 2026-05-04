// src/components/__tests__/ListView.loading.test.tsx
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock all external dependencies before importing ListView
jest.mock('lucide-react', () => ({
  Search: () => <span data-testid="search-icon" />,
  X: () => <span data-testid="x-icon" />,
  ChevronDown: () => <span data-testid="chevron-down" />,
  ChevronRight: () => <span data-testid="chevron-right" />,
  MapPin: () => <span data-testid="map-pin" />,
  Plus: () => <span data-testid="plus" />,
}));

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, exit, transition, style, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock components that have complex dependencies
jest.mock('@/components/filters/LocationSelector', () => ({
  __esModule: true,
  default: () => <div data-testid="location-selector">Location Selector</div>,
}));

jest.mock('@/components/overlays/EventInfoOverlay', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/events/AddEventButton', () => ({
  AddEventButton: () => <div data-testid="add-event-button" />,
}));

jest.mock('@/components/listview/DateGroup', () => ({
  DateGroup: () => <div data-testid="date-group" />,
}));

jest.mock('@/components/listview/DateColumnGrid', () => ({
  DateColumnGrid: () => <div data-testid="date-column-grid" />,
}));

jest.mock('@/components/listview/EventRowSkeleton', () => ({
  DateGroupSkeleton: () => <div data-testid="date-group-skeleton" className="animate-pulse" />,
}));

jest.mock('@/context/EventsContext', () => ({
  useEvents: () => ({
    radius: 10,
    setRadius: jest.fn(),
    selectedLocation: { lat: 53, lng: -2, name: 'Test Location' },
  }),
}));

jest.mock('@/hooks/useEventsForList', () => ({
  useEventsForList: jest.fn(),
  formatDistance: (d: number) => `${d} mi`,
  getDistanceClass: () => '',
}));

import ListView from '../ListView';
import { useEventsForList } from '@/hooks/useEventsForList';

const mockUseEventsForList = useEventsForList as jest.MockedFunction<typeof useEventsForList>;

describe('ListView loading states', () => {
  const createQueryClient = () => new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={createQueryClient()}>
      {children}
    </QueryClientProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows skeleton when isPending is true (no data yet)', () => {
    mockUseEventsForList.mockReturnValue({
      events: [],
      isLoading: false,  // In RQ v5, isLoading can be false
      isPending: true,   // isPending true means no data yet
      isError: false,
      error: null,
    } as ReturnType<typeof useEventsForList>);

    render(<ListView />, { wrapper });

    // Should show skeleton when pending (ListView renders 2 skeleton groups)
    const skeletons = screen.getAllByTestId('date-group-skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows skeleton when isLoading is true', () => {
    mockUseEventsForList.mockReturnValue({
      events: [],
      isLoading: true,
      isPending: true,
      isError: false,
      error: null,
    } as ReturnType<typeof useEventsForList>);

    render(<ListView />, { wrapper });

    // Skeleton should be visible (ListView renders 2 skeleton groups)
    const skeletons = screen.getAllByTestId('date-group-skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows "No gigs nearby" when loaded with empty events', () => {
    mockUseEventsForList.mockReturnValue({
      events: [],
      isLoading: false,
      isPending: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useEventsForList>);

    render(<ListView />, { wrapper });

    // Should show empty state, not skeleton
    expect(screen.getByText(/no gigs nearby/i)).toBeInTheDocument();
    expect(screen.queryByTestId('date-group-skeleton')).not.toBeInTheDocument();
  });

  it('shows error state when isError is true', () => {
    mockUseEventsForList.mockReturnValue({
      events: [],
      isLoading: false,
      isPending: false,
      isError: true,
      error: new Error('Failed to load'),
    } as ReturnType<typeof useEventsForList>);

    render(<ListView />, { wrapper });

    // Should show error state
    expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    expect(screen.getByText(/try again/i)).toBeInTheDocument();
  });

  it('does NOT show skeleton when we have cached data (isPending false, isLoading false)', () => {
    // This simulates having stale cached data - should show the data, not skeleton
    const mockEvents = [
      {
        id: '1',
        name: 'Test Event',
        date: new Date().toISOString().split('T')[0],
        startTime: '20:00',
        venueName: 'Test Venue',
        venueId: 'v1',
        location: { lat: 53, lng: -2 },
        distanceMiles: 5,
      },
    ];

    mockUseEventsForList.mockReturnValue({
      events: mockEvents,
      isLoading: false,
      isPending: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useEventsForList>);

    render(<ListView />, { wrapper });

    // Should NOT show skeleton
    expect(screen.queryByTestId('date-group-skeleton')).not.toBeInTheDocument();
    // Should show the search UI (main content)
    expect(screen.getByPlaceholderText(/search artist or venue/i)).toBeInTheDocument();
  });
});
