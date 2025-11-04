import { render, screen, fireEvent } from '@testing-library/react';
import SocialMediaLinks from '../SocialMediaLinks';
import { SocialMediaURL } from '@/lib/types';

describe('SocialMediaLinks', () => {
  const mockSocialMediaURLs: SocialMediaURL[] = [
    { platform: 'spotify', url: 'https://spotify.com/artist/test' },
    { platform: 'facebook', url: 'https://facebook.com/testartist' },
    { platform: 'instagram', url: 'https://instagram.com/testartist' },
    { platform: 'youtube', url: 'https://youtube.com/testartist' },
    { platform: 'x', url: 'https://x.com/testartist' },
    { platform: 'website', url: 'https://testartist.com' }
  ];

  it('renders all social media links correctly', () => {
    render(<SocialMediaLinks socialMediaURLs={mockSocialMediaURLs} />);
    
    expect(screen.getByLabelText('Visit Spotify')).toBeInTheDocument();
    expect(screen.getByLabelText('Visit Facebook')).toBeInTheDocument();
    expect(screen.getByLabelText('Visit Instagram')).toBeInTheDocument();
    expect(screen.getByLabelText('Visit YouTube')).toBeInTheDocument();
    expect(screen.getByLabelText('Visit X (Twitter)')).toBeInTheDocument();
    expect(screen.getByLabelText('Visit Website')).toBeInTheDocument();
  });

  it('renders correct URLs for each platform', () => {
    render(<SocialMediaLinks socialMediaURLs={mockSocialMediaURLs} />);
    
    expect(screen.getByLabelText('Visit Spotify')).toHaveAttribute('href', 'https://spotify.com/artist/test');
    expect(screen.getByLabelText('Visit Facebook')).toHaveAttribute('href', 'https://facebook.com/testartist');
    expect(screen.getByLabelText('Visit Instagram')).toHaveAttribute('href', 'https://instagram.com/testartist');
    expect(screen.getByLabelText('Visit YouTube')).toHaveAttribute('href', 'https://youtube.com/testartist');
    expect(screen.getByLabelText('Visit X (Twitter)')).toHaveAttribute('href', 'https://x.com/testartist');
    expect(screen.getByLabelText('Visit Website')).toHaveAttribute('href', 'https://testartist.com');
  });

  it('opens links in new tab with proper security attributes', () => {
    render(<SocialMediaLinks socialMediaURLs={mockSocialMediaURLs} />);
    
    const spotifyLink = screen.getByLabelText('Visit Spotify');
    expect(spotifyLink).toHaveAttribute('target', '_blank');
    expect(spotifyLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders nothing when no social media URLs provided', () => {
    const { container } = render(<SocialMediaLinks socialMediaURLs={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when socialMediaURLs is undefined', () => {
    const { container } = render(<SocialMediaLinks socialMediaURLs={undefined as any} />);
    expect(container.firstChild).toBeNull();
  });

  it('filters out unsupported platforms', () => {
    const socialMediaWithUnsupported: SocialMediaURL[] = [
      { platform: 'spotify', url: 'https://spotify.com/artist/test' },
      { platform: 'unsupported' as any, url: 'https://unsupported.com' }
    ];
    
    render(<SocialMediaLinks socialMediaURLs={socialMediaWithUnsupported} />);
    
    expect(screen.getByLabelText('Visit Spotify')).toBeInTheDocument();
    expect(screen.queryByText('unsupported')).not.toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <SocialMediaLinks 
        socialMediaURLs={[{ platform: 'spotify', url: 'https://spotify.com/test' }]} 
        className="custom-class" 
      />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('shows tooltip on hover', () => {
    render(<SocialMediaLinks socialMediaURLs={[{ platform: 'spotify', url: 'https://spotify.com/test' }]} />);
    
    const spotifyLink = screen.getByLabelText('Visit Spotify');
    
    // Check that tooltip exists (even if not visible initially)
    const tooltip = spotifyLink.querySelector('.absolute.-top-10');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent('Spotify');
  });

  it('handles mouse events for hover effects', () => {
    render(<SocialMediaLinks socialMediaURLs={[{ platform: 'spotify', url: 'https://spotify.com/test' }]} />);
    
    const spotifyLink = screen.getByLabelText('Visit Spotify');
    
    // Test mouse enter and leave events don't throw errors
    expect(() => {
      fireEvent.mouseEnter(spotifyLink);
      fireEvent.mouseLeave(spotifyLink);
    }).not.toThrow();
  });

  it('renders platform icons correctly', () => {
    render(<SocialMediaLinks socialMediaURLs={mockSocialMediaURLs} />);
    
    // Check that each platform has its specific icon
    const spotifyLink = screen.getByLabelText('Visit Spotify');
    expect(spotifyLink.querySelector('span')).toHaveTextContent('🎵');
    
    const facebookLink = screen.getByLabelText('Visit Facebook');
    expect(facebookLink.querySelector('span')).toHaveTextContent('📘');
    
    const instagramLink = screen.getByLabelText('Visit Instagram');
    expect(instagramLink.querySelector('span')).toHaveTextContent('📷');
    
    const youtubeLink = screen.getByLabelText('Visit YouTube');
    expect(youtubeLink.querySelector('span')).toHaveTextContent('📺');
    
    const xLink = screen.getByLabelText('Visit X (Twitter)');
    expect(xLink.querySelector('span')).toHaveTextContent('🐦');
    
    const websiteLink = screen.getByLabelText('Visit Website');
    expect(websiteLink.querySelector('span')).toHaveTextContent('🌐');
  });

  it('maintains proper accessibility attributes', () => {
    render(<SocialMediaLinks socialMediaURLs={mockSocialMediaURLs} />);
    
    mockSocialMediaURLs.forEach(social => {
      const link = screen.getByRole('link', { name: new RegExp(`Visit.*${social.platform === 'x' ? 'X \\(Twitter\\)' : social.platform}`, 'i') });
      expect(link).toHaveAttribute('aria-label');
    });
  });
});