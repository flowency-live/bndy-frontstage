import { render, screen, fireEvent } from '@testing-library/react';
import SearchAndFilters from '../SearchAndFilters';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Search: () => <div data-testid="search-icon" />,
  X: () => <div data-testid="x-icon" />,
}));

describe('SearchAndFilters', () => {
  const defaultProps = {
    searchQuery: '',
    onSearchChange: jest.fn(),
    locationFilter: '',
    onLocationChange: jest.fn(),
    artistTypeFilter: '',
    onArtistTypeChange: jest.fn(),
    availableLocations: ['New York', 'Los Angeles', 'Chicago'],
    availableArtistTypes: ['band', 'solo', 'duo'],
    onClearFilters: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders search input with placeholder', () => {
    render(<SearchAndFilters {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search artists by name...');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveValue('');
  });

  it('displays current search query in input', () => {
    render(<SearchAndFilters {...defaultProps} searchQuery="test query" />);
    
    const searchInput = screen.getByDisplayValue('test query');
    expect(searchInput).toBeInTheDocument();
  });

  it('calls onSearchChange when typing in search input', () => {
    render(<SearchAndFilters {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search artists by name...');
    fireEvent.change(searchInput, { target: { value: 'new search' } });
    
    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('new search');
  });

  it('shows clear search button when search query exists', () => {
    render(<SearchAndFilters {...defaultProps} searchQuery="test" />);
    
    const clearButton = screen.getByLabelText('Clear search');
    expect(clearButton).toBeInTheDocument();
    
    fireEvent.click(clearButton);
    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('');
  });

  it('does not show clear search button when search query is empty', () => {
    render(<SearchAndFilters {...defaultProps} />);
    
    // Should only have the "Show Filters" button
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveTextContent('Show Filters');
  });

  it('toggles filter visibility when clicking show/hide filters button', () => {
    render(<SearchAndFilters {...defaultProps} />);
    
    const toggleButton = screen.getByRole('button', { name: /show filters/i });
    expect(toggleButton).toHaveTextContent('Show Filters');
    
    // Filters should not be visible initially
    expect(screen.queryByLabelText('Location')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Artist Type')).not.toBeInTheDocument();
    
    // Click to show filters
    fireEvent.click(toggleButton);
    
    expect(screen.getByRole('button', { name: /hide filters/i })).toHaveTextContent('Hide Filters');
    expect(screen.getByLabelText('Location')).toBeInTheDocument();
    expect(screen.getByLabelText('Artist Type')).toBeInTheDocument();
    
    // Click to hide filters
    fireEvent.click(screen.getByRole('button', { name: /hide filters/i }));
    
    expect(screen.getByRole('button', { name: /show filters/i })).toHaveTextContent('Show Filters');
    expect(screen.queryByLabelText('Location')).not.toBeInTheDocument();
  });

  it('shows active filter indicator when filters are applied', () => {
    render(<SearchAndFilters {...defaultProps} searchQuery="test" />);
    
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('shows active filter indicator for location filter', () => {
    render(<SearchAndFilters {...defaultProps} locationFilter="New York" />);
    
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('shows active filter indicator for artist type filter', () => {
    render(<SearchAndFilters {...defaultProps} artistTypeFilter="band" />);
    
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('shows clear all button when filters are active', () => {
    render(<SearchAndFilters {...defaultProps} searchQuery="test" />);
    
    const clearAllButton = screen.getByRole('button', { name: /clear all/i });
    expect(clearAllButton).toBeInTheDocument();
    
    fireEvent.click(clearAllButton);
    expect(defaultProps.onClearFilters).toHaveBeenCalled();
  });

  it('does not show clear all button when no filters are active', () => {
    render(<SearchAndFilters {...defaultProps} />);
    
    expect(screen.queryByRole('button', { name: /clear all/i })).not.toBeInTheDocument();
  });

  it('renders location filter options correctly', () => {
    render(<SearchAndFilters {...defaultProps} />);
    
    // Show filters first
    fireEvent.click(screen.getByRole('button', { name: /show filters/i }));
    
    const locationSelect = screen.getByLabelText('Location');
    expect(locationSelect).toBeInTheDocument();
    
    // Check default option
    expect(screen.getByRole('option', { name: 'All locations' })).toBeInTheDocument();
    
    // Check available location options
    expect(screen.getByRole('option', { name: 'New York' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Los Angeles' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Chicago' })).toBeInTheDocument();
  });

  it('renders artist type filter options correctly', () => {
    render(<SearchAndFilters {...defaultProps} />);
    
    // Show filters first
    fireEvent.click(screen.getByRole('button', { name: /show filters/i }));
    
    const typeSelect = screen.getByLabelText('Artist Type');
    expect(typeSelect).toBeInTheDocument();
    
    // Check default option
    expect(screen.getByRole('option', { name: 'All types' })).toBeInTheDocument();
    
    // Check available type options (should be capitalized)
    expect(screen.getByRole('option', { name: 'Band' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Solo' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Duo' })).toBeInTheDocument();
  });

  it('calls onLocationChange when location filter changes', () => {
    render(<SearchAndFilters {...defaultProps} />);
    
    // Show filters first
    fireEvent.click(screen.getByRole('button', { name: /show filters/i }));
    
    const locationSelect = screen.getByLabelText('Location');
    fireEvent.change(locationSelect, { target: { value: 'New York' } });
    
    expect(defaultProps.onLocationChange).toHaveBeenCalledWith('New York');
  });

  it('calls onArtistTypeChange when artist type filter changes', () => {
    render(<SearchAndFilters {...defaultProps} />);
    
    // Show filters first
    fireEvent.click(screen.getByRole('button', { name: /show filters/i }));
    
    const typeSelect = screen.getByLabelText('Artist Type');
    fireEvent.change(typeSelect, { target: { value: 'band' } });
    
    expect(defaultProps.onArtistTypeChange).toHaveBeenCalledWith('band');
  });

  it('displays current filter values correctly', () => {
    render(
      <SearchAndFilters 
        {...defaultProps} 
        locationFilter="New York" 
        artistTypeFilter="band" 
      />
    );
    
    // Show filters first
    fireEvent.click(screen.getByRole('button', { name: /show filters/i }));
    
    const locationSelect = screen.getByLabelText('Location') as HTMLSelectElement;
    const typeSelect = screen.getByLabelText('Artist Type') as HTMLSelectElement;
    
    expect(locationSelect.value).toBe('New York');
    expect(typeSelect.value).toBe('band');
  });

  it('handles empty available options arrays', () => {
    render(
      <SearchAndFilters 
        {...defaultProps} 
        availableLocations={[]} 
        availableArtistTypes={[]} 
      />
    );
    
    // Show filters first
    fireEvent.click(screen.getByRole('button', { name: /show filters/i }));
    
    // Should still show default options
    expect(screen.getByRole('option', { name: 'All locations' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'All types' })).toBeInTheDocument();
    
    // Should not have any other options
    const locationOptions = screen.getByLabelText('Location').querySelectorAll('option');
    const typeOptions = screen.getByLabelText('Artist Type').querySelectorAll('option');
    
    expect(locationOptions).toHaveLength(1);
    expect(typeOptions).toHaveLength(1);
  });

  it('applies correct CSS classes for responsive design', () => {
    render(<SearchAndFilters {...defaultProps} />);
    
    // Show filters to check grid layout
    fireEvent.click(screen.getByRole('button', { name: /show filters/i }));
    
    const filtersContainer = screen.getByLabelText('Location').closest('.grid');
    expect(filtersContainer).toHaveClass('grid-cols-1', 'sm:grid-cols-2');
  });

  it('maintains proper accessibility attributes', () => {
    render(<SearchAndFilters {...defaultProps} />);
    
    // Search input should have proper attributes
    const searchInput = screen.getByPlaceholderText('Search artists by name...');
    expect(searchInput).toHaveAttribute('type', 'text');
    
    // Show filters to check form elements
    fireEvent.click(screen.getByRole('button', { name: /show filters/i }));
    
    // Labels should be associated with their inputs
    const locationLabel = screen.getByText('Location');
    const locationSelect = screen.getByLabelText('Location');
    expect(locationLabel).toHaveAttribute('for', 'location-filter');
    expect(locationSelect).toHaveAttribute('id', 'location-filter');
    
    const typeLabel = screen.getByText('Artist Type');
    const typeSelect = screen.getByLabelText('Artist Type');
    expect(typeLabel).toHaveAttribute('for', 'type-filter');
    expect(typeSelect).toHaveAttribute('id', 'type-filter');
  });
});