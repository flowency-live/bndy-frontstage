import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ArtistEventsMap from '../ArtistEventsMap';
import { Event } from '@/lib/types';

// Mock Leaflet - must be before component import
const mockMap = {
  fitBounds: jest.fn(),
  addLayer: jest.fn(),
  removeLayer: jest.fn(),
  setView: jest.fn(),
  remove: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
};

const mockMarker = {
  addTo: jest.fn().mockReturnThis(),
  bindPopup: jest.fn().mockReturnThis(),
  on: jest.fn().mockReturnThis(),
  remove: jest.fn(),
  getLatLng: jest.fn(() => ({ lat: 51.5, lng: -0.1 })),
};

const mockTileLayer = {
  addTo: jest.fn().mockReturnThis(),
};

const mockLatLngBounds = {
  isValid: jest.fn(() => true),
  extend: jest.fn(),
};

const mockPopup = {
  setContent: jest.fn().mockReturnThis(),
  openOn: jest.fn().mockReturnThis(),
};

jest.mock('leaflet', () => ({
  map: jest.fn(() => mockMap),
  tileLayer: jest.fn(() => mockTileLayer),
  marker: jest.fn(() => mockMarker),
  latLngBounds: jest.fn(() => mockLatLngBounds),
  popup: jest.fn(() => mockPopup),
  divIcon: jest.fn(() => ({})),
  DomEvent: {
    stopPropagation: jest.fn(),
  },
}));

// Mock the Leaflet settings
jest.mock('@/components/map/LeafletSettings/leaflet-icon-fix', () => ({
  completeLeafletIconFix: jest.fn(),
}));

jest.mock('@/components/map/LeafletSettings/TileProviders', () => ({
  tileLayer: {
    url: 'https://{s}.tile.test/{z}/{x}/{y}.png',
    className: 'test-tiles',
  },
}));

jest.mock('@/components/map/LeafletSettings/LeafletMarkers', () => ({
  createEventMarkerIcon: jest.fn(() => ({})),
}));

// Mock EventMarkerPopup
jest.mock('../EventMarkerPopup', () => {
  return function MockEventMarkerPopup({ events, onClose }: { events: Event[]; onClose: () => void }) {
    return (
      <div data-testid="event-marker-popup">
        <span>Events: {events.length}</span>
        <button onClick={onClose}>Close popup</button>
      </div>
    );
  };
});

const createMockEvent = (overrides: Partial<Event> = {}): Event => ({
  id: 'event-1',
  name: 'Test Event',
  date: '2025-02-22',
  startTime: '19:00',
  venueName: 'Test Venue',
  venueId: 'venue-1',
  artistIds: ['artist-1'],
  location: { lat: 51.5, lng: -0.1 },
  source: 'bndy.live',
  status: 'approved',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  ...overrides,
});

describe('ArtistEventsMap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders map container with correct height', () => {
      const events = [createMockEvent()];
      render(<ArtistEventsMap events={events} />);

      const container = screen.getByTestId('artist-events-map');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('h-[400px]');
    });

    it('renders empty state when no events provided', () => {
      render(<ArtistEventsMap events={[]} />);

      expect(screen.getByText(/no events to display/i)).toBeInTheDocument();
    });

    it('renders empty state when all events lack location data', () => {
      const eventsWithoutLocation = [
        createMockEvent({ id: 'e1', location: { lat: 0, lng: 0 } }),
        createMockEvent({ id: 'e2', location: { lat: 0, lng: 0 } }),
      ];
      render(<ArtistEventsMap events={eventsWithoutLocation} />);

      expect(screen.getByText(/no events to display/i)).toBeInTheDocument();
    });
  });

  describe('Marker creation', () => {
    it('creates markers for events with valid locations', async () => {
      const L = require('leaflet');
      const events = [
        createMockEvent({ id: 'event-1', location: { lat: 51.5, lng: -0.1 } }),
        createMockEvent({ id: 'event-2', location: { lat: 52.0, lng: -0.2 } }),
      ];

      render(<ArtistEventsMap events={events} />);

      await waitFor(() => {
        // Should create a marker for each unique location
        expect(L.marker).toHaveBeenCalledTimes(2);
      });
    });

    it('groups events at same location into single marker', async () => {
      const L = require('leaflet');
      const sameLocation = { lat: 51.5, lng: -0.1 };
      const events = [
        createMockEvent({ id: 'event-1', location: sameLocation }),
        createMockEvent({ id: 'event-2', location: sameLocation }),
        createMockEvent({ id: 'event-3', location: sameLocation }),
      ];

      render(<ArtistEventsMap events={events} />);

      await waitFor(() => {
        // Should create only one marker for all 3 events at same location
        expect(L.marker).toHaveBeenCalledTimes(1);
      });
    });

    it('skips events without location data', async () => {
      const L = require('leaflet');
      const events = [
        createMockEvent({ id: 'event-1', location: { lat: 51.5, lng: -0.1 } }),
        createMockEvent({ id: 'event-2', location: { lat: 0, lng: 0 } }), // Invalid
      ];

      render(<ArtistEventsMap events={events} />);

      await waitFor(() => {
        // Should only create marker for valid location
        expect(L.marker).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Bounds fitting', () => {
    it('fits bounds to show all markers on mount', async () => {
      const L = require('leaflet');
      const events = [
        createMockEvent({ id: 'event-1', location: { lat: 51.5, lng: -0.1 } }),
        createMockEvent({ id: 'event-2', location: { lat: 52.0, lng: -0.2 } }),
      ];

      render(<ArtistEventsMap events={events} />);

      await waitFor(() => {
        expect(L.latLngBounds).toHaveBeenCalled();
        expect(mockMap.fitBounds).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('has appropriate aria label on container', () => {
      const events = [createMockEvent()];
      render(<ArtistEventsMap events={events} />);

      const container = screen.getByTestId('artist-events-map');
      expect(container).toHaveAttribute('aria-label', expect.stringContaining('map'));
    });
  });
});
