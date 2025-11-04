/**
 * Test file for SocialShareSection component
 * Note: This project doesn't have a testing framework configured yet.
 * This file serves as a reference for future testing implementation.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SocialShareSection from '../SocialShareSection';

// Mock navigator.share and navigator.clipboard for testing
const mockShare = jest.fn();
const mockWriteText = jest.fn();

Object.defineProperty(navigator, 'share', {
  writable: true,
  value: mockShare,
});

Object.defineProperty(navigator, 'canShare', {
  writable: true,
  value: jest.fn(() => true),
});

Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  value: {
    writeText: mockWriteText,
  },
});

// Mock window.open for social platform sharing
const mockOpen = jest.fn();
Object.defineProperty(window, 'open', {
  writable: true,
  value: mockOpen,
});

describe('SocialShareSection', () => {
  const defaultProps = {
    artistName: 'Test Artist',
    artistId: 'test-artist-123',
    description: 'A test artist description',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockShare.mockResolvedValue(undefined);
    mockWriteText.mockResolvedValue(undefined);
  });

  it('renders the share section with correct title', () => {
    render(<SocialShareSection {...defaultProps} />);
    expect(screen.getByText('Share Artist')).toBeInTheDocument();
  });

  it('calls native share API when share button is clicked', async () => {
    render(<SocialShareSection {...defaultProps} />);
    
    const shareButton = screen.getByRole('button', { name: /share artist/i });
    fireEvent.click(shareButton);

    await waitFor(() => {
      expect(mockShare).toHaveBeenCalledWith({
        title: 'Test Artist | bndy',
        text: expect.stringContaining('Check out Test Artist on bndy!'),
        url: expect.stringContaining('/artists/test-artist-123'),
      });
    });
  });

  it('copies link to clipboard when copy button is clicked', async () => {
    render(<SocialShareSection {...defaultProps} />);
    
    const copyButton = screen.getByRole('button', { name: /copy link/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(
        expect.stringContaining('/artists/test-artist-123')
      );
    });

    // Check for success feedback
    expect(screen.getByText('Link Copied!')).toBeInTheDocument();
  });

  it('opens Facebook share dialog when Facebook button is clicked', () => {
    // Mock navigator.share to not be available to show platform buttons
    Object.defineProperty(navigator, 'share', {
      writable: true,
      value: undefined,
    });

    render(<SocialShareSection {...defaultProps} />);
    
    const facebookButton = screen.getByTitle('Share on Facebook');
    fireEvent.click(facebookButton);

    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining('facebook.com/sharer'),
      '_blank',
      expect.any(String)
    );
  });

  it('opens Twitter share dialog when Twitter button is clicked', () => {
    // Mock navigator.share to not be available to show platform buttons
    Object.defineProperty(navigator, 'share', {
      writable: true,
      value: undefined,
    });

    render(<SocialShareSection {...defaultProps} />);
    
    const twitterButton = screen.getByTitle('Share on Twitter');
    fireEvent.click(twitterButton);

    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining('twitter.com/intent/tweet'),
      '_blank',
      expect.any(String)
    );
  });

  it('opens WhatsApp share when WhatsApp button is clicked', () => {
    // Mock navigator.share to not be available to show platform buttons
    Object.defineProperty(navigator, 'share', {
      writable: true,
      value: undefined,
    });

    render(<SocialShareSection {...defaultProps} />);
    
    const whatsappButton = screen.getByTitle('Share on WhatsApp');
    fireEvent.click(whatsappButton);

    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining('wa.me'),
      '_blank'
    );
  });

  it('shows platform-specific buttons when native share is not available', () => {
    // Mock navigator.share to not be available
    Object.defineProperty(navigator, 'share', {
      writable: true,
      value: undefined,
    });

    render(<SocialShareSection {...defaultProps} />);
    
    expect(screen.getByTitle('Share on Facebook')).toBeInTheDocument();
    expect(screen.getByTitle('Share on Twitter')).toBeInTheDocument();
    expect(screen.getByTitle('Share on WhatsApp')).toBeInTheDocument();
    expect(screen.getByTitle('Share on LinkedIn')).toBeInTheDocument();
  });

  it('handles share cancellation gracefully', async () => {
    mockShare.mockRejectedValue(new Error('AbortError'));

    render(<SocialShareSection {...defaultProps} />);
    
    const shareButton = screen.getByRole('button', { name: /share artist/i });
    fireEvent.click(shareButton);

    // Should not throw error and should handle cancellation gracefully
    await waitFor(() => {
      expect(mockShare).toHaveBeenCalled();
    });
  });

  it('falls back to manual copy when clipboard API fails', async () => {
    mockWriteText.mockRejectedValue(new Error('Clipboard not available'));
    
    // Mock document.execCommand
    const mockExecCommand = jest.fn(() => true);
    Object.defineProperty(document, 'execCommand', {
      writable: true,
      value: mockExecCommand,
    });

    render(<SocialShareSection {...defaultProps} />);
    
    const copyButton = screen.getByRole('button', { name: /copy link/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockExecCommand).toHaveBeenCalledWith('copy');
    });
  });
});