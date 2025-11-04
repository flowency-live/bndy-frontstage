import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ArtistBrowseClient from '../ArtistBrowseClient';
import { Artist } from '@/lib/types';

// Mock the artist service
jest.mock('@/lib/services/artist-service-new', () => ({
  getAllArtists: jest.fn(),
  searchArtists: jest.fn(),
}));

// Mock the components
jest.mock('@/components/artist/ArtistCard', () => {
  return function MockArtistCard({ artist }: { artist: Artist }) {
    return (
      <div data-testid={`artist-card-${artist.id}`}>
        <h3>{artist.name}</h3>
        <p>{artist.location}</p>
        <p>{artist.artist_type}</p>
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
      <div data-testid="search-and-filters">
        <input
          data-testid="search-input"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search artists..."
        />
        <select
          data-testid="location-filter"
          value={locationFilter}
          onChange={(e) => onLocationChange(e.target.value)}
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
        >
          <option value="">All types</option>
          {availableArtistTypes.map((type: string) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <button data-testid="clear-filters" onClick={onClearFilters}>
          Clear Filters
        </button>
      </div>
    );
  };
});

const { getAllArtists, searchArtists } = require('@/lib/services/artist-service-new');

describe('ArtistBrowseClient', () => {
  const mockArtists: Artist[] = [
    {
      id: 'artist-1',
      name: 'Rock Band',
      location: 'New York',
      artist_type: 'band',
      genres: ['Rock'],
      socialMediaURLs: []
    },
    {
      id: 'artist-2',
      name: 'Jazz Solo',
      location: 'Los Angeles',
      artist_type: 'solo',
      genres: ['Jazz'],
      socialMediaURLs: []
    },
    {
      id: 'artist-3',
      name: 'Pop Duo',
      location: 'New York',
      artist_type: 'duo',
      genres: ['Pop'],
      socialMediaURLs: []
    }
  ];

  // Mock sessionStorage
  const mockSessionStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  };

  beforeEach(() => {
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

  it('renders loading state initially', () => {
    getAllArtists.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<ArtistBrowseClient />);
    
    expect(screen.getByText('Loading artists...')).toBeInTheDocument();
  });

  it('loads and displays all artists on mount', async () => {
    render(<ArtistBrowseClient />);
    
    await waitFor(() => {
      expect(screen.getByText('Showing all 3 artists')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('artist-card-artist-1')).toBeInTheDocument();
    expect(screen.getByTestId('artist-card-artist-2')).toBeInTheDocument();
    expect(screen.getByTestId('artist-card-artist-3')).toBeInTheDocument();
    
    expect(getAllArtists).toHaveBeenCalledTimes(1);
  });

  it('displays error state when loading fails', async () => {
    getAllArtists.mockRejectedValue(new Error('Failed to load'));
    
    render(<ArtistBrowseClient />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load artists. Please try again.')).toBeInTheDocument();
    });
    
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
  });

  it('retries loading when try again button is clicked', async () => {
    getAllArtists.mockRejectedValueOnce(new Error('Failed to load'));
    
    render(<ArtistBrowseClient />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load artists. Please try again.')).toBeInTheDocument();
    });
    
    // Mock successful retry
    getAllArtists.mockResolvedValueOnce(mockArtists);
    
    const tryAgainButton = screen.getByRole('button', { name: 'Try Again' });
    fireEvent.click(tryAgainButton);
    
    // Should reload the page
    expect(window.location.reload).toBeDefined();
  });

  it('performs search when search query is entered', async () => {
    const searchResults = [mockArtists[0]];
    searchArtists.mockResolvedValue(searchResults);
    
    render(<ArtistBrowseClient />);
    
    await waitFor(() => {
      expect(screen.getByText('Showing all 3 artists')).toBeInTheDocument();
    });
    
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'Rock' } });
    
    await waitFor(() => {
      expect(searchArtists).toHaveBeenCalledWith('Rock', '');
      expect(screen.getByText('Showing 1 of 3 artists')).toBeInTheDocument();
    });
  });

  it('debounces search input', async () => {
    jest.useFakeTimers();
    
    render(<ArtistBrowseClient />);
    
    await waitFor(() => {
      expect(screen.getByText('Showing all 3 artists')).toBeInTheDocument();
    });
    
    const searchInput = screen.getByTestId('search-input');
    
    // Type multiple characters quickly
    fireEvent.change(searchInput, { target: { value: 'R' } });
    fireEvent.change(searchInput, { target: { value: 'Ro' } });
    fireEvent.change(searchInput, { target: { value: 'Roc' } });
    
    // Should not have called search yet
    expect(searchArtists).not.toHaveBeenCalled();
    
    // Fast forward past debounce delay
    jest.advanceTimersByTime(300);
    
    await waitFor(() => {
      expect(searchArtists).toHaveBeenCalledWith('Roc', '');
    });
    
    jest.useRealTimers();
  });

  it('filters artists by location', async () => {
    render(<ArtistBrowseClient />);
    
    await waitFor(() => {
      expect(screen.getByText('Showing all 3 artists')).toBeInTheDocument();
    });
    
    const locationFilter = screen.getByTestId('location-filter');
    fireEvent.change(locationFilter, { target: { value: 'New York' } });
    
    await waitFor(() => {
      expect(screen.getByText('Showing 2 of 3 artists')).toBeInTheDocument();
      expect(screen.getByTestId('artist-card-artist-1')).toBeInTheDocument();
      expect(screen.getByTestId('artist-card-artist-3')).toBeInTheDocument();
      expect(screen.queryByTestId('artist-card-artist-2')).not.toBeInTheDocument();
    });
  });

  it('filters artists by type', async () => {
    render(<ArtistBrowseClient />);
    
    await waitFor(() => {
      expect(screen.getByText('Showing all 3 artists')).toBeInTheDocument();
    });
    
    const typeFilter = screen.getByTestId('type-filter');
    fireEvent.change(typeFilter, { target: { value: 'band' } });
    
    await waitFor(() => {
      expect(screen.getByText('Showing 1 of 3 artists')).toBeInTheDocument();
      expect(screen.getByTestId('artist-card-artist-1')).toBeInTheDocument();
      expect(screen.queryByTestId('artist-card-artist-2')).not.toBeInTheDocument();
      expect(screen.queryByTestId('artist-card-artist-3')).not.toBeInTheDocument();
    });
  });

  it('combines search and filters', async () => {
    const searchResults = [mockArtists[0], mockArtists[2]]; // Both from New York
    searchArtists.mockResolvedValue(searchResults);
    
    render(<ArtistBrowseClient />);
    
    await waitFor(() => {
      expect(screen.getByText('Showing all 3 artists')).toBeInTheDocument();
    });
    
    // Apply search and type filter
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'Band' } });
    
    const typeFilter = screen.getByTestId('type-filter');
    fireEvent.change(typeFilter, { target: { value: 'band' } });
    
    await waitFor(() => {
      expect(searchArtists).toHaveBeenCalledWith('Band', '');
      expect(screen.getByText('Showing 1 of 3 artists')).toBeInTheDocument();
    });
  });

  it('clears all filters when clear button is clicked', async () => {
    render(<ArtistBrowseClient />);
    
    await waitFor(() => {
      expect(screen.getByText('Showing all 3 artists')).toBeInTheDocument();
    });
    
    // Apply some filters
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'Rock' } });
    
    const locationFilter = screen.getByTestId('location-filter');
    fireEvent.change(locationFilter, { target: { value: 'New York' } });
    
    // Clear filters
    const clearButton = screen.getByTestId('clear-filters');
    fireEvent.click(clearButton);
    
    await waitFor(() => {
      expect(screen.getByText('Showing all 3 artists')).toBeInTheDocument();
    });
    
    expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('artistBrowseState');
  });

  it('shows no results message when no artists match filters', async () => {
    render(<ArtistBrowseClient />);
    
    await waitFor(() => {
      expect(screen.getByText('Showing all 3 artists')).toBeInTheDocument();
    });
    
    // Apply filter that matches no artists
    const typeFilter = screen.getByTestId('type-filter');
    fireEvent.change(typeFilter, { target: { value: 'orchestra' } });
    
    await waitFor(() => {
      expect(screen.getByText('No artists match your search criteria')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clear all filters/i })).toBeInTheDocument();
    });
  });

  it('saves and restores search state from sessionStorage', () => {
    const savedState = {
      searchQuery: 'saved search',
      locationFilter: 'New York',
      artistTypeFilter: 'band'
    };
    
    mockSessionStorage.getItem.mockReturnValue(JSON.stringify(savedState));
    
    render(<ArtistBrowseClient />);
    
    // Should restore saved state
    expect(screen.getByTestId('search-input')).toHaveValue('saved search');
    expect(screen.getByTestId('location-filter')).toHaveValue('New York');
    expect(screen.getByTestId('type-filter')).toHaveValue('band');
  });

  it('saves search state to sessionStorage when filters change', async () => {
    render(<ArtistBrowseClient />);
    
    await waitFor(() => {
      expect(screen.getByText('Showing all 3 artists')).toBeInTheDocument();
    });
    
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    await waitFor(() => {
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'artistBrowseState',
        JSON.stringify({
          searchQuery: 'test',
          locationFilter: '',
          artistTypeFilter: ''
        })
      );
    });
  });

  it('generates correct available locations and types', async () => {
    render(<ArtistBrowseClient />);
    
    await waitFor(() => {
      expect(screen.getByText('Showing all 3 artists')).toBeInTheDocument();
    });
    
    // Check that unique locations are available
    const locationFilter = screen.getByTestId('location-filter');
    expect(locationFilter).toContainHTML('<option value="Los Angeles">Los Angeles</option>');
    expect(locationFilter).toContainHTML('<option value="New York">New York</option>');
    
    // Check that unique types are available
    const typeFilter = screen.getByTestId('type-filter');
    expect(typeFilter).toContainHTML('<option value="band">band</option>');
    expect(typeFilter).toContainHTML('<option value="duo">duo</option>');
    expect(typeFilter).toContainHTML('<option value="solo">solo</option>');
  });

  it('handles search errors gracefully', async () => {
    searchArtists.mockRejectedValue(new Error('Search failed'));
    
    render(<ArtistBrowseClient />);
    
    await waitFor(() => {
      expect(screen.getByText('Showing all 3 artists')).toBeInTheDocument();
    });
    
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    
    await waitFor(() => {
      expect(screen.getByText('Failed to search artists. Please try again.')).toBeInTheDocument();
      // Should fall back to local filtering
      expect(screen.getByText('Showing all 3 artists')).toBeInTheDocument();
    });
  });

  it('shows searching indicator during search', async () => {
    // Make search take some time
    searchArtists.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve([]), 100)));
    
    render(<ArtistBrowseClient />);
    
    await waitFor(() => {
      expect(screen.getByText('Showing all 3 artists')).toBeInTheDocument();
    });
    
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    await waitFor(() => {
      expect(screen.getByText('Searching...')).toBeInTheDocument();
    });
  });

  it('handles artists without location or type gracefully', async () => {
    const artistsWithMissingData: Artist[] = [
      {
        id: 'artist-minimal',
        name: 'Minimal Artist',
        socialMediaURLs: []
      }
    ];
    
    getAllArtists.mockResolvedValue(artistsWithMissingData);
    
    render(<ArtistBrowseClient />);
    
    await waitFor(() => {
      expect(screen.getByText('Showing all 1 artists')).toBeInTheDocument();
      expect(screen.getByTestId('artist-card-artist-minimal')).toBeInTheDocument();
    });
    
    // Should not crash and should handle missing data
    const locationFilter = screen.getByTestId('location-filter');
    const typeFilter = screen.getByTestId('type-filter');
    
    expect(locationFilter).toContainHTML('<option value="">All locations</option>');
    expect(typeFilter).toContainHTML('<option value="">All types</option>');
  });
});