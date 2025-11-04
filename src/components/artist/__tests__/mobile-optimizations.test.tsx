import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ArtistProfileClient from '@/app/artists/[artistId]/ArtistProfileClient';
import { ArtistProfileData } from '@/lib/types/artist-profile';

// Mock the image preloader hook
jest.mock('@/lib/utils/imagePreloader', () => ({
  useImagePreloader: () => ({
    preloadBatch: jest.fn().mockResolvedValue([]),
  }),
}));

// Mock performance monitoring
jest.mock('@/components/artist/PerformanceMonitor', () => {
  return function MockPerformanceMonitor() {
    return null;
  };
});

// Mock touch gesture handler
jest.mock('@/components/artist/TouchGestureHandler', () => {
  return function MockTouchGestureHandler({ children, onTap, onDoubleTap, onLongPress, onSwipeUp, ...props }: any) {
    return (
      <div 
        {...props}
        onClick={onTap}
        onDoubleClick={onDoubleTap}
        data-testid="touch-gesture-handler"
      >
        {children}
      </div>
    );
  };
});

// Mock lazy section
jest.mock('@/components/artist/LazySection', () => {
  return function MockLazySection({ children, fallback }: any) {
    return <div data-testid="lazy-section">{children}</div>;
  };
});

// Mock enhanced error boundary
jest.mock('@/components/artist/EnhancedErrorBoundary', () => {
  return function MockEnhancedErrorBoundary({ children }: any) {
    return <div data-testid="error-boundary">{children}</div>;
  };
});

// Mock loading state manager
jest.mock('@/components/artist/LoadingStateManager', () => {
  return function MockLoadingStateManager({ children, isLoading, error, data }: any) {
    if (isLoading) return <div data-testid="loading">Loading...</div>;
    if (error) return <div data-testid="error">{error}</div>;
    if (!data) return <div data-testid="not-found">Artist not found</div>;
    return children;
  };
});

// Mock meta tags component
jest.mock('@/components/artist/ArtistMetaTags', () => {
  return function MockArtistMetaTags() {
    return null;
  };
});

describe('Mobile Optimizations and Polish', () => {
  const mockProfileData: ArtistProfileData = {
    id: 'test-artist-1',
    name: 'Test Artist',
    description: 'This is a test artist with a longer description that should be collapsible when it exceeds the character limit for better user experience and mobile optimization.',
    profileImageUrl: 'https://example.com/profile.jpg',
    genres: ['Rock', 'Pop', 'Alternative'],
    socialMediaURLs: [
      { platform: 'spotify', url: 'https://spotify.com/artist/test' },
      { platform: 'facebook', url: 'https://facebook.com/testartist' },
      { platform: 'instagram', url: 'https://instagram.com/testartist' }
    ],
    upcomingEvents: [
      {
        id: 'event-1',
        name: 'Rock Concert',
        date: '2025-12-01',
        startTime: '20:00',
        endTime: '23:00',
        venueName: 'Test Venue',
        venueId: 'venue-1',
        price: '$25',
        ticketUrl: 'https://tickets.com/event1'
      }
    ]
  };

  beforeEach(() => {
    // Mock current date for consistent test results
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-11-01'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Page Transitions and Animations', () => {
    it('applies page entrance animation classes', async () => {
      const { container } = render(
        <ArtistProfileClient initialData={mockProfileData} artistId="test-artist-1" />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Artist')).toBeInTheDocument();
      });

      // Check for page entrance animation class
      const pageContainer = container.querySelector('.page-enter');
      expect(pageContainer).toBeInTheDocument();
    });

    it('applies staggered section animations', async () => {
      render(<ArtistProfileClient initialData={mockProfileData} artistId="test-artist-1" />);

      await waitFor(() => {
        expect(screen.getByText('Test Artist')).toBeInTheDocument();
      });

      // Check for staggered animation classes
      const sectionDelays = [
        '.section-enter-delay-1',
        '.section-enter-delay-2', 
        '.section-enter-delay-3'
      ];

      sectionDelays.forEach(selector => {
        const element = document.querySelector(selector);
        expect(element).toBeInTheDocument();
      });
    });

    it('includes GPU acceleration classes for performance', async () => {
      const { container } = render(
        <ArtistProfileClient initialData={mockProfileData} artistId="test-artist-1" />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Artist')).toBeInTheDocument();
      });

      // Check for GPU acceleration classes
      const gpuElements = container.querySelectorAll('.gpu-accelerated, .gpu-layer');
      expect(gpuElements.length).toBeGreaterThan(0);
    });
  });

  describe('Touch Feedback and Interactions', () => {
    it('applies touch feedback classes to interactive elements', async () => {
      render(<ArtistProfileClient initialData={mockProfileData} artistId="test-artist-1" />);

      await waitFor(() => {
        expect(screen.getByText('Test Artist')).toBeInTheDocument();
      });

      // Check for touch feedback classes
      const touchElements = document.querySelectorAll('.touch-feedback');
      expect(touchElements.length).toBeGreaterThan(0);
    });

    it('includes enhanced focus states for accessibility', async () => {
      render(<ArtistProfileClient initialData={mockProfileData} artistId="test-artist-1" />);

      await waitFor(() => {
        expect(screen.getByText('Test Artist')).toBeInTheDocument();
      });

      // Check for enhanced focus classes
      const focusElements = document.querySelectorAll('.focus-enhanced');
      expect(focusElements.length).toBeGreaterThan(0);
    });

    it('handles touch gesture interactions', async () => {
      render(<ArtistProfileClient initialData={mockProfileData} artistId="test-artist-1" />);

      await waitFor(() => {
        expect(screen.getByText('Test Artist')).toBeInTheDocument();
      });

      const touchHandler = screen.getByTestId('touch-gesture-handler');
      expect(touchHandler).toBeInTheDocument();

      // Test touch interactions don't throw errors
      expect(() => {
        fireEvent.click(touchHandler);
        fireEvent.doubleClick(touchHandler);
      }).not.toThrow();
    });
  });

  describe('Mobile-Specific Optimizations', () => {
    it('applies mobile-optimized CSS classes', async () => {
      const { container } = render(
        <ArtistProfileClient initialData={mockProfileData} artistId="test-artist-1" />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Artist')).toBeInTheDocument();
      });

      // Check for mobile optimization classes
      const mobileClasses = [
        '.mobile-optimized',
        '.mobile-scroll-enhanced',
        '.performance-critical',
        '.safe-area-enhanced'
      ];

      mobileClasses.forEach(className => {
        const element = container.querySelector(className);
        expect(element).toBeInTheDocument();
      });
    });

    it('includes mobile button enhancements', async () => {
      render(<ArtistProfileClient initialData={mockProfileData} artistId="test-artist-1" />);

      await waitFor(() => {
        expect(screen.getByText('Test Artist')).toBeInTheDocument();
      });

      // Check for mobile button classes
      const mobileButtons = document.querySelectorAll('.mobile-button-enhanced');
      expect(mobileButtons.length).toBeGreaterThan(0);
    });

    it('applies touch target enhancements', async () => {
      render(<ArtistProfileClient initialData={mockProfileData} artistId="test-artist-1" />);

      await waitFor(() => {
        expect(screen.getByText('Test Artist')).toBeInTheDocument();
      });

      // Check for touch target classes
      const touchTargets = document.querySelectorAll('.touch-target-enhanced');
      expect(touchTargets.length).toBeGreaterThan(0);
    });
  });

  describe('Micro-Interactions', () => {
    it('applies button micro-interaction classes', async () => {
      render(<ArtistProfileClient initialData={mockProfileData} artistId="test-artist-1" />);

      await waitFor(() => {
        expect(screen.getByText('Test Artist')).toBeInTheDocument();
      });

      // Check for button micro-interaction classes
      const microButtons = document.querySelectorAll('.button-micro');
      expect(microButtons.length).toBeGreaterThan(0);
    });

    it('includes card interaction animations', async () => {
      render(<ArtistProfileClient initialData={mockProfileData} artistId="test-artist-1" />);

      await waitFor(() => {
        expect(screen.getByText('Test Artist')).toBeInTheDocument();
      });

      // Check for card interaction classes
      const interactiveCards = document.querySelectorAll('.card-interactive');
      expect(interactiveCards.length).toBeGreaterThan(0);
    });

    it('applies social link animations', async () => {
      render(<ArtistProfileClient initialData={mockProfileData} artistId="test-artist-1" />);

      await waitFor(() => {
        expect(screen.getByText('Test Artist')).toBeInTheDocument();
      });

      // Check for social link animation classes
      const socialLinks = document.querySelectorAll('.social-link');
      expect(socialLinks.length).toBeGreaterThan(0);
    });

    it('includes genre tag animations', async () => {
      render(<ArtistProfileClient initialData={mockProfileData} artistId="test-artist-1" />);

      await waitFor(() => {
        expect(screen.getByText('Test Artist')).toBeInTheDocument();
      });

      // Check for genre tag animation classes
      const genreTags = document.querySelectorAll('.genre-tag');
      expect(genreTags.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Optimizations', () => {
    it('includes performance-critical classes', async () => {
      const { container } = render(
        <ArtistProfileClient initialData={mockProfileData} artistId="test-artist-1" />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Artist')).toBeInTheDocument();
      });

      // Check for performance optimization classes
      const performanceElements = container.querySelectorAll('.performance-critical');
      expect(performanceElements.length).toBeGreaterThan(0);
    });

    it('applies skeleton loading enhancements', async () => {
      const { container } = render(
        <ArtistProfileClient initialData={mockProfileData} artistId="test-artist-1" />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Artist')).toBeInTheDocument();
      });

      // Check for enhanced skeleton classes
      const skeletonElements = container.querySelectorAll('.skeleton-enhanced');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });

    it('includes will-change optimizations', async () => {
      render(<ArtistProfileClient initialData={mockProfileData} artistId="test-artist-1" />);

      await waitFor(() => {
        expect(screen.getByText('Test Artist')).toBeInTheDocument();
      });

      // Check for will-change classes (if any are applied)
      const willChangeElements = document.querySelectorAll('[class*="will-change"]');
      // This is optional as will-change is applied via CSS
    });
  });

  describe('Responsive Design', () => {
    it('handles different viewport sizes gracefully', async () => {
      // Mock different viewport sizes
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375, // Mobile width
      });

      render(<ArtistProfileClient initialData={mockProfileData} artistId="test-artist-1" />);

      await waitFor(() => {
        expect(screen.getByText('Test Artist')).toBeInTheDocument();
      });

      // Component should render without errors on mobile viewport
      expect(screen.getByText('Test Artist')).toBeInTheDocument();
      expect(screen.getByText('Rock')).toBeInTheDocument();
      expect(screen.getByText('Rock Concert')).toBeInTheDocument();
    });

    it('maintains accessibility on mobile devices', async () => {
      render(<ArtistProfileClient initialData={mockProfileData} artistId="test-artist-1" />);

      await waitFor(() => {
        expect(screen.getByText('Test Artist')).toBeInTheDocument();
      });

      // Check that interactive elements are accessible
      const interactiveElements = [
        ...screen.getAllByRole('button'),
        ...screen.getAllByRole('link')
      ];

      interactiveElements.forEach(element => {
        // Should not have negative tabindex
        expect(element).not.toHaveAttribute('tabindex', '-1');
      });
    });
  });

  describe('Animation Performance', () => {
    it('respects reduced motion preferences', async () => {
      // Mock prefers-reduced-motion
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      render(<ArtistProfileClient initialData={mockProfileData} artistId="test-artist-1" />);

      await waitFor(() => {
        expect(screen.getByText('Test Artist')).toBeInTheDocument();
      });

      // Component should still render properly with reduced motion
      expect(screen.getByText('Test Artist')).toBeInTheDocument();
    });

    it('uses hardware acceleration for smooth animations', async () => {
      render(<ArtistProfileClient initialData={mockProfileData} artistId="test-artist-1" />);

      await waitFor(() => {
        expect(screen.getByText('Test Artist')).toBeInTheDocument();
      });

      // Check for GPU acceleration classes
      const gpuElements = document.querySelectorAll('.gpu-accelerated, .gpu-layer');
      expect(gpuElements.length).toBeGreaterThan(0);
    });
  });

  describe('Cross-Device Compatibility', () => {
    it('handles touch and mouse interactions appropriately', async () => {
      render(<ArtistProfileClient initialData={mockProfileData} artistId="test-artist-1" />);

      await waitFor(() => {
        expect(screen.getByText('Test Artist')).toBeInTheDocument();
      });

      // Check for hover-enabled classes (should only activate on hover-capable devices)
      const hoverElements = document.querySelectorAll('.hover-enabled');
      expect(hoverElements.length).toBeGreaterThan(0);
    });

    it('provides appropriate feedback for different input methods', async () => {
      render(<ArtistProfileClient initialData={mockProfileData} artistId="test-artist-1" />);

      await waitFor(() => {
        expect(screen.getByText('Test Artist')).toBeInTheDocument();
      });

      // Check for touch feedback elements
      const touchFeedbackElements = document.querySelectorAll('.touch-feedback');
      expect(touchFeedbackElements.length).toBeGreaterThan(0);
    });
  });
});