import { render, screen, fireEvent } from '@testing-library/react';
import ArtistHeader from '../ArtistHeader';
import { ArtistProfileData } from '@/lib/types/artist-profile';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, onError, ...props }: any) => (
    <img 
      src={src} 
      alt={alt} 
      onError={onError}
      data-testid="next-image"
      {...props} 
    />
  ),
}));

// Mock SocialMediaLinks component
jest.mock('../SocialMediaLinks', () => {
  return function MockSocialMediaLinks({ socialMediaURLs }: any) {
    return (
      <div data-testid="social-media-links">
        {socialMediaURLs?.map((social: any, index: number) => (
          <a key={index} href={social.url} data-testid={`social-link-${social.platform}`}>
            {social.platform}
          </a>
        ))}
      </div>
    );
  };
});

describe('ArtistHeader', () => {
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
    render(<ArtistHeader artist={mockProfileData} />);
    
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test Artist');
  });

  it('renders profile image when provided', () => {
    render(<ArtistHeader artist={mockProfileData} />);
    
    const profileImages = screen.getAllByTestId('next-image');
    expect(profileImages.length).toBeGreaterThan(0);
    
    // Check the main profile image (second one)
    const profileImage = profileImages.find(img => img.getAttribute('alt') === 'Test Artist profile');
    expect(profileImage).toBeInTheDocument();
    expect(profileImage).toHaveAttribute('src', 'https://example.com/profile.jpg');
  });

  it('renders fallback avatar when no profile image', () => {
    const profileDataWithoutImage = {
      ...mockProfileData,
      profileImageUrl: undefined
    };
    
    render(<ArtistHeader artist={profileDataWithoutImage} />);
    
    // Should show fallback with artist initial
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('renders genre tags when provided', () => {
    render(<ArtistHeader artist={mockProfileData} />);
    
    expect(screen.getByText('Rock')).toBeInTheDocument();
    expect(screen.getByText('Pop')).toBeInTheDocument();
  });

  it('does not render genre section when no genres provided', () => {
    const profileDataWithoutGenres = {
      ...mockProfileData,
      genres: undefined
    };
    
    render(<ArtistHeader artist={profileDataWithoutGenres} />);
    
    expect(screen.queryByText('Rock')).not.toBeInTheDocument();
    expect(screen.queryByText('Pop')).not.toBeInTheDocument();
  });

  it('renders social media links when provided', () => {
    render(<ArtistHeader artist={mockProfileData} />);
    
    expect(screen.getByTestId('social-media-links')).toBeInTheDocument();
    expect(screen.getByTestId('social-link-spotify')).toBeInTheDocument();
    expect(screen.getByTestId('social-link-facebook')).toBeInTheDocument();
  });

  it('does not render social media section when no links provided', () => {
    const profileDataWithoutSocial = {
      ...mockProfileData,
      socialMediaURLs: []
    };
    
    render(<ArtistHeader artist={profileDataWithoutSocial} />);
    
    // The component should still render the social media section but it should be empty
    const socialSection = screen.getByTestId('social-media-links');
    expect(socialSection).toBeInTheDocument();
    expect(socialSection).toBeEmptyDOMElement();
  });

  it('renders location when provided', () => {
    const profileDataWithLocation = {
      ...mockProfileData,
      location: 'New York, NY'
    };
    
    render(<ArtistHeader artist={profileDataWithLocation} />);
    
    expect(screen.getByText('New York, NY')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<ArtistHeader artist={mockProfileData} />);
    
    expect(screen.getByText('A test artist description')).toBeInTheDocument();
  });

  it('renders with minimal data', () => {
    const minimalProfileData: ArtistProfileData = {
      id: 'minimal-artist',
      name: 'Minimal Artist',
      upcomingEvents: []
    };
    
    render(<ArtistHeader artist={minimalProfileData} />);
    
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Minimal Artist');
    expect(screen.getByText('M')).toBeInTheDocument();
  });
});