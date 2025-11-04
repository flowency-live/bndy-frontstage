import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ArtistBrowseClient from '@/app/artists/ArtistBrowseClient';
import { Artist } from '@/lib/types';

// Mock the artist service
jest.mock('@/lib/services/artist-service-new', () => ({
  getAllArtists: jest.fn(),
  searchArtists: jest.fn(),
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/artists',
}));

// Mock the components with more realistic implementations
jest.mock('@/components/artist/ArtistCard', () => {
  return function MockArtistCard({ artist }: { artist: Artist }) {
    return (
      <div data-testid={`artist-card-${artist.id}`} className="artist-card">
        <a href={`/artists/${artist.id}`} data-testid={`artist-link-${artist.id}`}>
          <h3>{artist.name}</h3>
          {artist.location && <p>{artist.location}</p>}
          {artist.artist_type && <p className="capitalize">{artist.artist_type}</p>}
        </a>
      </div>
    );
  };
});

jest.mock('@/components/artist/SearchAndFilters', () => {
  return function MockSearchAndFilters({
    searchQuery,
    onSearchChange,
    locationFilter,
    onLocationChange,
    artistTypeFilter,
    onArtistTypeChange,
    onClearFilters,
    availableLocations,
    availableArtistTypes,
  }: any) {
    return (
      <div data-testid="search-and-filters" className="search-filters">
        <input
          data-testid="search-input"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search artists by name..."
          aria-label="Search artists"
        />
        <select
          data-testid="location-filter"
          value={locationFilter}
          onChange={(e) => onLocationChange(e.target.value)}
          aria-label="Filter by location"
        >
          <option value="">All locations</option>
          {availableLocations.map((location: string) => (
            <option key={location} value={location}>{location}</option>
          ))}
        </select>
        <select
          data-testid="type-filter"
          value={artistTypeFilter}
          onChange={(e) => onArtistTypeChange(e.target.value)}
          aria-label="Filter by artist type"
        >
          <option value="">All types</option>
          {availableArtistTypes.map((type: string) => (
            <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
          ))}
        </select>
        <button 
          data-testid="clear-filters" 
          onClick={onClearFilters}
          aria-label="Clear all filters"
        >
          Clear Filters
        </button>
      </div>
    );
  };
});

const { getAllArtists, searchArtists } = require('@/lib/services/artist-service-new');

describe('Artist System Integration Tests', () => {
  let queryClient: QueryClient;

  const mockArtists: Artist[] = [
    {
      id: 'artist-1',
      name: 'The Rock Band',
      location: 'New York, NY',
      artist_type: 'band',
      genres: ['Rock', 'Alternative'],
      description: 'A great rock band from New York',
      socialMediaURLs: [
        { platform: 'spotify', url: 'https://spotify.com/therockband' },
        { platform: 'facebook', url: 'https://facebook.com/therockband' }
      ]
    },
    {
      id: 'artist-2',
      name: 'Jazz Solo Artist',
      location: 'Los Angeles, CA',
      artist_type: 'solo',
      genres: ['Jazz', 'Blues'],
      description: 'Smooth jazz from LA',
      socialMediaURLs: [
        { platform: 'instagram', url: 'https://instagram.com/jazzsoloist' }
      ]
    },
    {
      id: 'artist-3',
      name: 'Pop Duo',
      location: 'New York, NY',
      artist_type: 'duo',
      genres: ['Pop', 'Electronic'],
      description: 'Electronic pop duo',
      socialMediaURLs: []
    },
    {
      id: 'artist-4',
      name: 'Country Solo',
      location: 'Nashville, TN',
      artist_type: 'solo',
      genres: ['Country'],
      description: 'Traditional country music',
      socialMediaURLs: [
        { platform: 'youtube', url: 'https://youtube.com/countrysoloist' }
      ]
    }
  ];

  // Mock sessionStorage
  const mockSessionStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    jest.clearAllMocks();
    getAllArtists.mockResolvedValue(mockArtists);
    searchArtists.mockResolvedValue([]);
    
    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true,
    });
    
    mockSessionStorage.getItem.mockReturnValue(null);
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  describe('Complete Artist Browse Page Loading and Display', () => {
    it('loads and displays artist browse page with all components', async () => {
      renderWithQueryClient(<ArtistBrowseClient />);
      
      // Should show loading state initially
      expect(screen.getByText('Loading artists...')).toBeInTheDocument();
      
      // Wait for artists to load
      await waitFor(() => {
        expect(screen.getByText('Showing all 4 artists')).toBeInTheDocument();
      });
      
      // Should display search and filters component
      expect(screen.getByTestId('search-and-filters')).toBeInTheDocument();
      expect(screen.getByLabelText('Search artists')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter by location')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter by artist type')).toBeInTheDocument();
      
      // Should display all artist cards
      expect(screen.getByTestId('artist-card-artist-1')).toBeInTheDocument();
      expect(screen.getByTestId('artist-card-artist-2')).toBeInTheDocument();
      expect(screen.getByTestId('artist-card-artist-3')).toBeInTheDocument();
      expect(screen.getByTestId('artist-card-artist-4')).toBeInTheDocument();
      
      // Should display artist information
      expect(screen.getByText('The Rock Band')).toBeInTheDocument();
      expect(screen.getByText('Jazz Solo Artist')).toBeInTheDocument();
      expect(screen.getByText('Pop Duo')).toBeInTheDocument();
      expect(screen.getByText('Country Solo')).toBeInTheDocument();
    });

    it('displays correct filter options based on loaded artists', async () => {
      renderWithQueryClient(<ArtistBrowseClient />);
      
      await waitFor(() => {
        expect(screen.getByText('Showing all 4 artists')).toBeInTheDocument();
      });
      
      // Check location filter options
      const locationFilter = screen.getByLabelText('Filter by location');
      expect(locationFilter).toContainHTML('<option value="Los Angeles, CA">Los Angeles, CA</option>');
      expect(locationFilter).toContainHTML('<option value="Nashville, TN">Nashville, TN</option>');
      expect(locationFilter).toContainHTML('<option value="New York, NY">New York, NY</option>');
      
      // Check artist type filter options
      const typeFilter = screen.getByLabelText('Filter by artist type');
      expect(typeFilter).toContainHTML('<option value="band">Band</option>');
      expect(typeFilter).toContainHTML('<option value="duo">Duo</option>');
      expect(typeFilter).toContainHTML('<option value="solo">Solo</option>');
    });

    it('handles error states gracefully with retry functionality', async () => {
      getAllArtists.mockRejectedValueOnce(new Error('Network error'));
      
      renderWithQueryClient(<ArtistBrowseClient />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load artists. Please try again.')).toBeInTheDocument();
      });
      
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
      expect(screen.queryByTestId('search-and-filters')).not.toBeInTheDocument();
      expect(screen.queryByTestId('artist-card-artist-1')).not.toBeInTheDocument();
    });
  });

  describe('Artist Browse to Profile Navigation Flow', () => {
    it('provides correct navigation links to artist profiles', async () => {
      renderWithQueryClient(<ArtistBrowseClient />);
      
      await waitFor(() => {
        expect(screen.getByText('Showing all 4 artists')).toBeInTheDocument();
      });
      
      // Check that each artist card has correct navigation link
      const rockBandLink = screen.getByTestId('artist-link-artist-1');
      expect(rockBandLink).toHaveAttribute('href', '/artists/artist-1');
      
      const jazzSoloLink = screen.getByTestId('artist-link-artist-2');
      expect(jazzSoloLink).toHaveAttribute('href', '/artists/artist-2');
      
      const popDuoLink = screen.getByTestId('artist-link-artist-3');
      expect(popDuoLink).toHaveAttribute('href', '/artists/artist-3');
      
      const countrySoloLink = screen.getByTestId('artist-link-artist-4');
      expect(countrySoloLink).toHaveAttribute('href', '/artists/artist-4');
    });

    it('maintains search state during navigation simulation', async () => {
      renderWithQueryClient(<ArtistBrowseClient />);
      
      await waitFor(() => {
        expect(screen.getByText('Showing all 4 artists')).toBeInTheDocument();
      });
      
      // Apply search filter
      const searchInput = screen.getByLabelText('Search artists');
      fireEvent.change(searchInput, { target: { value: 'Rock' } });
      
      // Apply location filter
      const locationFilter = screen.getByLabelText('Filter by location');
      fireEvent.change(locationFilter, { target: { value: 'New York, NY' } });
      
      await waitFor(() => {
        expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
          'artistBrowseState',
          JSON.stringify({
            searchQuery: 'Rock',
            locationFilter: 'New York, NY',
            artistTypeFilter: ''
          })
        );
      });
    });

    it('restores search state when returning from navigation', () => {
      const savedState = {
        searchQuery: 'Jazz',
        locationFilter: 'Los Angeles, CA',
        artistTypeFilter: 'solo'
      };
      
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(savedState));
      
      renderWithQueryClient(<ArtistBrowseClient />);
      
      // Should restore saved state
      expect(screen.getByLabelText('Search artists')).toHaveValue('Jazz');
      expect(screen.getByLabelText('Filter by location')).toHaveValue('Los Angeles, CA');
      expect(screen.getByLabelText('Filter by artist type')).toHaveValue('solo');
    });
  });

  describe('Search and Filtering Functionality End-to-End', () => {
    it('performs complete search workflow with API integration', async () => {
      const searchResults = [mockArtists[0]]; // Only rock band
      searchArtists.mockResolvedValue(searchResults);
      
      renderWithQueryClient(<ArtistBrowseClient />);
      
      await waitFor(() => {
        expect(screen.getByText('Showing all 4 artists')).toBeInTheDocument();
      });
      
      // Perform search
      const searchInput = screen.getByLabelText('Search artists');
      fireEvent.change(searchInput, { target: { value: 'Rock' } });
      
      await waitFor(() => {
        expect(searchArtists).toHaveBeenCalledWith('Rock', '');
        expect(screen.getByText('Showing 1 of 4 artists')).toBeInTheDocument();
        expect(screen.getByTestId('artist-card-artist-1')).toBeInTheDocument();
        expect(screen.queryByTestId('artist-card-artist-2')).not.toBeInTheDocument();
      });
    });

    it('performs complete local filtering workflow', async () => {
      renderWithQueryClient(<ArtistBrowseClient />);
      
      await waitFor(() => {
        expect(screen.getByText('Showing all 4 artists')).toBeInTheDocument();
      });
      
      // Filter by location
      const locationFilter = screen.getByLabelText('Filter by location');
      fireEvent.change(locationFilter, { target: { value: 'New York, NY' } });
      
      await waitFor(() => {
        expect(screen.getByText('Showing 2 of 4 artists')).toBeInTheDocument();
        expect(screen.getByTestId('artist-card-artist-1')).toBeInTheDocument(); // Rock Band
        expect(screen.getByTestId('artist-card-artist-3')).toBeInTheDocument(); // Pop Duo
        expect(screen.queryByTestId('artist-card-artist-2')).not.toBeInTheDocument(); // Jazz Solo
        expect(screen.queryByTestId('artist-card-artist-4')).not.toBeInTheDocument(); // Country Solo
      });
      
      // Further filter by artist type
      const typeFilter = screen.getByLabelText('Filter by artist type');
      fireEvent.change(typeFilter, { target: { value: 'band' } });
      
      await waitFor(() => {
        expect(screen.getByText('Showing 1 of 4 artists')).toBeInTheDocument();
        expect(screen.getByTestId('artist-card-artist-1')).toBeInTheDocument(); // Only Rock Band
        expect(screen.queryByTestId('artist-card-artist-3')).not.toBeInTheDocument(); // Pop Duo filtered out
      });
    });

    it('handles combined search and filter operations', async () => {
      const searchResults = [mockArtists[1], mockArtists[3]]; // Both solo artists
      searchArtists.mockResolvedValue(searchResults);
      
      renderWithQueryClient(<ArtistBrowseClient />);
      
      await waitFor(() => {
        expect(screen.getByText('Showing all 4 artists')).toBeInTheDocument();
      });
      
      // Apply search first
      const searchInput = screen.getByLabelText('Search artists');
      fireEvent.change(searchInput, { target: { value: 'Solo' } });
      
      await waitFor(() => {
        expect(searchArtists).toHaveBeenCalledWith('Solo', '');
        expect(screen.getByText('Showing 2 of 4 artists')).toBeInTheDocument();
      });
      
      // Then apply location filter
      const locationFilter = screen.getByLabelText('Filter by location');
      fireEvent.change(locationFilter, { target: { value: 'Los Angeles, CA' } });
      
      await waitFor(() => {
        expect(searchArtists).toHaveBeenCalledWith('Solo', 'Los Angeles, CA');
        expect(screen.getByText('Showing 1 of 4 artists')).toBeInTheDocument();
      });
    });

    it('shows appropriate empty states during filtering', async () => {
      renderWithQueryClient(<ArtistBrowseClient />);
      
      await waitFor(() => {
        expect(screen.getByText('Showing all 4 artists')).toBeInTheDocument();
      });
      
      // Apply filter that matches no artists
      const typeFilter = screen.getByLabelText('Filter by artist type');
      fireEvent.change(typeFilter, { target: { value: 'orchestra' } });
      
      await waitFor(() => {
        expect(screen.getByText('No artists match your search criteria')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /clear all filters/i })).toBeInTheDocument();
      });
      
      // Test clear filters functionality
      const clearButton = screen.getByRole('button', { name: /clear all filters/i });
      fireEvent.click(clearButton);
      
      await waitFor(() => {
        expect(screen.getByText('Showing all 4 artists')).toBeInTheDocument();
        expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('artistBrowseState');
      });
    });

    it('handles search errors with fallback to local filtering', async () => {
      searchArtists.mockRejectedValue(new Error('Search API failed'));
      
      renderWithQueryClient(<ArtistBrowseClient />);
      
      await waitFor(() => {
        expect(screen.getByText('Showing all 4 artists')).toBeInTheDocument();
      });
      
      // Perform search that will fail
      const searchInput = screen.getByLabelText('Search artists');
      fireEvent.change(searchInput, { target: { value: 'Rock' } });
      
      await waitFor(() => {
        expect(screen.getByText('Failed to search artists. Please try again.')).toBeInTheDocument();
        // Should fall back to local filtering
        expect(screen.getByText('Showing all 4 artists')).toBeInTheDocument();
        expect(screen.getByTestId('artist-card-artist-1')).toBeInTheDocument();
      });
    });

    it('provides real-time search feedback with debouncing', async () => {
      jest.useFakeTimers();
      
      renderWithQueryClient(<ArtistBrowseClient />);
      
      await waitFor(() => {
        expect(screen.getByText('Showing all 4 artists')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByLabelText('Search artists');
      
      // Type multiple characters quickly
      fireEvent.change(searchInput, { target: { value: 'R' } });
      fireEvent.change(searchInput, { target: { value: 'Ro' } });
      fireEvent.change(searchInput, { target: { value: 'Roc' } });
      
      // Should not have called search API yet due to debouncing
      expect(searchArtists).not.toHaveBeenCalled();
      
      // Fast forward past debounce delay
      jest.advanceTimersByTime(300);
      
      await waitFor(() => {
        expect(searchArtists).toHaveBeenCalledWith('Roc', '');
      });
      
      jest.useRealTimers();
    });

    it('maintains filter state consistency across operations', async () => {
      renderWithQueryClient(<ArtistBrowseClient />);
      
      await waitFor(() => {
        expect(screen.getByText('Showing all 4 artists')).toBeInTheDocument();
      });
      
      // Apply multiple filters
      const searchInput = screen.getByLabelText('Search artists');
      const locationFilter = screen.getByLabelText('Filter by location');
      const typeFilter = screen.getByLabelText('Filter by artist type');
      
      fireEvent.change(searchInput, { target: { value: 'Solo' } });
      fireEvent.change(locationFilter, { target: { value: 'Nashville, TN' } });
      fireEvent.change(typeFilter, { target: { value: 'solo' } });
      
      // Verify all filters are applied
      expect(searchInput).toHaveValue('Solo');
      expect(locationFilter).toHaveValue('Nashville, TN');
      expect(typeFilter).toHaveValue('solo');
      
      // Clear all filters
      const clearButton = screen.getByLabelText('Clear all filters');
      fireEvent.click(clearButton);
      
      // Verify all filters are cleared
      await waitFor(() => {
        expect(searchInput).toHaveValue('');
        expect(locationFilter).toHaveValue('');
        expect(typeFilter).toHaveValue('');
        expect(screen.getByText('Showing all 4 artists')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility and User Experience Integration', () => {
    it('maintains proper focus management during interactions', async () => {
      renderWithQueryClient(<ArtistBrowseClient />);
      
      await waitFor(() => {
        expect(screen.getByText('Showing all 4 artists')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByLabelText('Search artists');
      const locationFilter = screen.getByLabelText('Filter by location');
      const typeFilter = screen.getByLabelText('Filter by artist type');
      
      // Test tab navigation
      searchInput.focus();
      expect(document.activeElement).toBe(searchInput);
      
      // Simulate tab to next element
      locationFilter.focus();
      expect(document.activeElement).toBe(locationFilter);
      
      typeFilter.focus();
      expect(document.activeElement).toBe(typeFilter);
    });

    it('provides proper ARIA labels and semantic structure', async () => {
      renderWithQueryClient(<ArtistBrowseClient />);
      
      await waitFor(() => {
        expect(screen.getByText('Showing all 4 artists')).toBeInTheDocument();
      });
      
      // Check ARIA labels
      expect(screen.getByLabelText('Search artists')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter by location')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter by artist type')).toBeInTheDocument();
      expect(screen.getByLabelText('Clear all filters')).toBeInTheDocument();
      
      // Check that artist links are properly accessible
      const artistLinks = screen.getAllByRole('link');
      artistLinks.forEach(link => {
        expect(link).toHaveAttribute('href');
        expect(link.getAttribute('href')).toMatch(/^\/artists\//);
      });
    });

    it('handles keyboard navigation for all interactive elements', async () => {
      renderWithQueryClient(<ArtistBrowseClient />);
      
      await waitFor(() => {
        expect(screen.getByText('Showing all 4 artists')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByLabelText('Search artists');
      
      // Test Enter key on search input
      fireEvent.keyDown(searchInput, { key: 'Enter' });
      // Should not cause any errors
      
      const clearButton = screen.getByLabelText('Clear all filters');
      
      // Test Enter key on clear button
      fireEvent.keyDown(clearButton, { key: 'Enter' });
      fireEvent.keyUp(clearButton, { key: 'Enter' });
      
      // Test Space key on clear button
      fireEvent.keyDown(clearButton, { key: ' ' });
      fireEvent.keyUp(clearButton, { key: ' ' });
      
      // Should not cause any errors
      expect(screen.getByText('Showing all 4 artists')).toBeInTheDocument();
    });
  });
});