import { render, screen, fireEvent } from '@testing-library/react';
import ArtistCard from '../ArtistCard';
import { Artist } from '@/lib/types';

// Mock Next.js components
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, onError, onLoad, width, height, fill, sizes, quality, placeholder, blurDataURL, loading, decoding, ...props }: any) => (
    <img 
      src={src} 
      alt={alt} 
      onError={onError}
      onLoad={onLoad}
      width={width}
      height={height}
      sizes={sizes}
      data-testid="next-image"
      {...props} 
    />
  ),
}));

jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

describe('ArtistCard', () => {
  const mockArtist: Artist = {
    id: 'artist-1',
    name: 'Test Artist',
    profileImageUrl: 'https://example.com/profile.jpg',
    location: 'New York, NY',
    artist_type: 'band',
    genres: ['Rock', 'Pop'],
    description: 'A test artist',
    socialMediaURLs: [],
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  };

  it('renders artist name correctly', () => {
    render(<ArtistCard artist={mockArtist} />);
    
    // Artist name should appear twice (in overlay and bottom bar)
    const artistNames = screen.getAllByText('Test Artist');
    expect(artistNames).toHaveLength(2);
  });

  it('renders as a link to artist profile', () => {
    render(<ArtistCard artist={mockArtist} />);
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/artists/artist-1');
  });

  it('renders artist image when provided', () => {
    render(<ArtistCard artist={mockArtist} />);
    
    const image = screen.getByTestId('next-image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/profile.jpg');
    expect(image).toHaveAttribute('alt', 'Test Artist profile picture');
  });

  it('renders fallback initials when no image provided', () => {
    const artistWithoutImage = {
      ...mockArtist,
      profileImageUrl: undefined
    };
    
    render(<ArtistCard artist={artistWithoutImage} />);
    
    expect(screen.getByText('TA')).toBeInTheDocument(); // Test Artist -> TA
    expect(screen.queryByTestId('next-image')).not.toBeInTheDocument();
  });

  it('renders fallback initials when image fails to load', () => {
    render(<ArtistCard artist={mockArtist} />);
    
    const image = screen.getByTestId('next-image');
    
    // Simulate image error
    fireEvent.error(image);
    
    expect(screen.getByText('TA')).toBeInTheDocument();
  });

  it('generates correct initials for single name', () => {
    const artistWithSingleName = {
      ...mockArtist,
      name: 'Madonna',
      profileImageUrl: undefined
    };
    
    render(<ArtistCard artist={artistWithSingleName} />);
    
    expect(screen.getByText('M')).toBeInTheDocument();
  });

  it('generates correct initials for multiple names', () => {
    const artistWithMultipleNames = {
      ...mockArtist,
      name: 'The Rolling Stones Band',
      profileImageUrl: undefined
    };
    
    render(<ArtistCard artist={artistWithMultipleNames} />);
    
    expect(screen.getByText('TR')).toBeInTheDocument(); // Takes first 2 initials
  });

  it('renders location when provided', () => {
    render(<ArtistCard artist={mockArtist} />);
    
    expect(screen.getByText('New York, NY')).toBeInTheDocument();
  });

  it('does not render location when not provided', () => {
    const artistWithoutLocation = {
      ...mockArtist,
      location: undefined
    };
    
    render(<ArtistCard artist={artistWithoutLocation} />);
    
    expect(screen.queryByText('New York, NY')).not.toBeInTheDocument();
  });

  it('renders artist type when provided', () => {
    render(<ArtistCard artist={mockArtist} />);
    
    expect(screen.getByText('band')).toBeInTheDocument();
  });

  it('capitalizes artist type correctly', () => {
    const artistWithSoloType = {
      ...mockArtist,
      artist_type: 'solo' as const
    };
    
    render(<ArtistCard artist={artistWithSoloType} />);
    
    // Should be capitalized via CSS class
    const typeElement = screen.getByText('solo');
    expect(typeElement).toHaveClass('capitalize');
  });

  it('does not render artist type when not provided', () => {
    const artistWithoutType = {
      ...mockArtist,
      artist_type: undefined
    };
    
    render(<ArtistCard artist={artistWithoutType} />);
    
    expect(screen.queryByText('band')).not.toBeInTheDocument();
  });

  it('applies consistent background color based on name', () => {
    const artistWithoutImage = {
      ...mockArtist,
      profileImageUrl: undefined
    };
    
    const { rerender } = render(<ArtistCard artist={artistWithoutImage} />);
    
    const fallbackElement = screen.getByText('TA').parentElement;
    const firstColor = fallbackElement?.className;
    
    // Re-render with same artist should have same color
    rerender(<ArtistCard artist={artistWithoutImage} />);
    
    const fallbackElement2 = screen.getByText('TA').parentElement;
    expect(fallbackElement2?.className).toBe(firstColor);
  });

  it('applies different background colors for different names', () => {
    const artist1 = { ...mockArtist, name: 'A', profileImageUrl: undefined };
    const artist2 = { ...mockArtist, name: 'AAAAAAAA', profileImageUrl: undefined }; // Different length
    
    const { rerender } = render(<ArtistCard artist={artist1} />);
    const fallback1 = screen.getAllByText('A')[0].parentElement; // Get first occurrence
    const color1 = fallback1?.className;
    
    rerender(<ArtistCard artist={artist2} />);
    const fallback2 = screen.getAllByText('A')[0].parentElement; // Both will show 'A' but different colors
    const color2 = fallback2?.className;
    
    expect(color1).not.toBe(color2);
  });

  it('handles minimal artist data', () => {
    const minimalArtist: Artist = {
      id: 'minimal-artist',
      name: 'Minimal Artist',
      socialMediaURLs: [],
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    };
    
    render(<ArtistCard artist={minimalArtist} />);
    
    expect(screen.getAllByText('Minimal Artist')).toHaveLength(2);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/artists/minimal-artist');
    expect(screen.getByText('MA')).toBeInTheDocument(); // Fallback initials
  });

  it('applies correct CSS classes for hover effects', () => {
    render(<ArtistCard artist={mockArtist} />);
    
    const link = screen.getByRole('link');
    expect(link).toHaveClass('group', 'block');
    
    const cardContainer = link.firstChild;
    expect(cardContainer).toHaveClass('group-hover:scale-105');
  });

  it('applies correct aspect ratio', () => {
    render(<ArtistCard artist={mockArtist} />);
    
    const cardContainer = screen.getByRole('link').firstChild;
    expect(cardContainer).toHaveClass('aspect-square');
  });

  it('has proper accessibility attributes', () => {
    render(<ArtistCard artist={mockArtist} />);
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/artists/artist-1');
    
    // Image should have proper alt text
    const image = screen.getByTestId('next-image');
    expect(image).toHaveAttribute('alt', 'Test Artist profile picture');
  });

  it('handles long artist names gracefully', () => {
    const artistWithLongName = {
      ...mockArtist,
      name: 'This Is A Very Long Artist Name That Should Be Handled Properly'
    };
    
    render(<ArtistCard artist={artistWithLongName} />);
    
    const artistNames = screen.getAllByText('This Is A Very Long Artist Name That Should Be Handled Properly');
    expect(artistNames).toHaveLength(2);
    
    // Check that text has proper line height classes
    artistNames.forEach(nameElement => {
      expect(nameElement).toHaveClass('leading-tight');
    });
  });

  it('handles special characters in artist names', () => {
    const artistWithSpecialChars = {
      ...mockArtist,
      name: 'Björk & The Ñoños',
      profileImageUrl: undefined
    };
    
    render(<ArtistCard artist={artistWithSpecialChars} />);
    
    expect(screen.getAllByText('Björk & The Ñoños')).toHaveLength(2);
    expect(screen.getByText('B&')).toBeInTheDocument(); // First letters of first two words (B from Björk, & from &)
  });

  it('maintains proper image sizing attributes', () => {
    render(<ArtistCard artist={mockArtist} />);
    
    const image = screen.getByTestId('next-image');
    expect(image).toHaveAttribute('sizes', '(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw');
  });
});