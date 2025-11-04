import { render, screen } from '@testing-library/react';
import ArtistProfileHeader from '../ArtistProfileHeader';
import { ArtistProfileData } from '@/lib/types/artist-profile';

// Mock the OptimizedImage component
jest.mock('../OptimizedImage', () => {
  return function MockOptimizedImage({ src, alt, fallback, onError, ...props }: any) {
    return (
      <img 
        src={src} 
        alt={alt} 
        onError={onError}
        data-testid="optimized-image"
        {...props} 
      />
    );
  };
});

// Mock SocialMediaLinks component
jest.mock('../SocialMediaLinks', () => {
  return function MockSocialMediaLinks({ socialMediaURLs }: any) {
    return (
      <div data-testid="social-media-links">
        {socialMediaURLs.map((social: any, index: number) => (
          <a key={index} href={social.url} data-testid={`social-link-${social.platform}`}>
            {social.platform}
          </a>
        ))}
      </div>
    );
  };
});

describe('ArtistProfileHeader', () => {
  const mockProfileData: ArtistProfileData = {
    id: 'test-artist-1',
    name: 'Test Artist',
    description: 'A test artist description',
    profileImageUrl: 'https://example.com/profile.jpg',
    genres: ['Rock', 'Pop'],
    socialMediaURLs: [
      { platform: 'spotify', url: 'https://spotify.com/artist/test' },
      { platform: 'facebook', url: 'https://facebook.com/testartist' }
    ],
    upcomingEvents: []
  };

  it('renders artist name correctly', () => {
    render(<ArtistProfileHeader profileData={mockProfileData} />);
    
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test Artist');
  });

  it('renders profile image when provided', () => {
    render(<ArtistProfileHeader profileData={mockProfileData} />);
    
    const image = screen.getByTestId('optimized-image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/profile.jpg');
    expect(image).toHaveAttribute('alt', 'Test Artist profile picture');
  });

  it('renders fallback avatar when no profile image', () => {
    const profileDataWithoutImage = {
      ...mockProfileData,
      profileImageUrl: undefined
    };
    
    render(<ArtistProfileHeader profileData={profileDataWithoutImage} />);
    
    // Should show fallback with artist initial
    expect(screen.getByLabelText('Test Artist initial')).toBeInTheDocument();
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('renders genre tags when provided', () => {
    render(<ArtistProfileHeader profileData={mockProfileData} />);
    
    expect(screen.getByText('Rock')).toBeInTheDocument();
    expect(screen.getByText('Pop')).toBeInTheDocument();
  });

  it('does not render genre section when no genres provided', () => {
    const profileDataWithoutGenres = {
      ...mockProfileData,
      genres: undefined
    };
    
    render(<ArtistProfileHeader profileData={profileDataWithoutGenres} />);
    
    expect(screen.queryByText('Rock')).not.toBeInTheDocument();
    expect(screen.queryByText('Pop')).not.toBeInTheDocument();
  });

  it('renders social media links when provided', () => {
    render(<ArtistProfileHeader profileData={mockProfileData} />);
    
    expect(screen.getByTestId('social-media-links')).toBeInTheDocument();
    expect(screen.getByTestId('social-link-spotify')).toBeInTheDocument();
    expect(screen.getByTestId('social-link-facebook')).toBeInTheDocument();
  });

  it('does not render social media section when no links provided', () => {
    const profileDataWithoutSocial = {
      ...mockProfileData,
      socialMediaURLs: undefined
    };
    
    render(<ArtistProfileHeader profileData={profileDataWithoutSocial} />);
    
    expect(screen.queryByTestId('social-media-links')).not.toBeInTheDocument();
  });

  it('handles image error by showing fallback', () => {
    render(<ArtistProfileHeader profileData={mockProfileData} />);
    
    const image = screen.getByTestId('optimized-image');
    
    // Simulate image error
    if (image.onError) {
      image.onError({} as any);
    }
    
    // After error, should show fallback avatar
    expect(screen.getByLabelText('Test Artist initial')).toBeInTheDocument();
  });

  it('applies correct CSS classes for responsive design', () => {
    render(<ArtistProfileHeader profileData={mockProfileData} />);
    
    const container = screen.getByRole('heading', { level: 1 }).closest('div');
    expect(container).toHaveClass('container', 'mx-auto');
  });

  it('renders with minimal data', () => {
    const minimalProfileData: ArtistProfileData = {
      id: 'minimal-artist',
      name: 'Minimal Artist',
      upcomingEvents: []
    };
    
    render(<ArtistProfileHeader profileData={minimalProfileData} />);
    
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Minimal Artist');
    expect(screen.getByLabelText('Minimal Artist initial')).toBeInTheDocument();
    expect(screen.getByText('M')).toBeInTheDocument();
  });
});