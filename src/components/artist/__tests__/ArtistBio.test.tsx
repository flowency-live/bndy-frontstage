import { render, screen, fireEvent } from '@testing-library/react';
import ArtistBio from '../ArtistBio';

describe('ArtistBio', () => {
  it('renders nothing when no description provided', () => {
    const { container } = render(<ArtistBio />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when empty description provided', () => {
    const { container } = render(<ArtistBio description="" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when whitespace-only description provided', () => {
    const { container } = render(<ArtistBio description="   " />);
    expect(container.firstChild).toBeNull();
  });

  it('renders short bio without expand/collapse functionality', () => {
    const shortBio = 'This is a short artist bio.';
    render(<ArtistBio description={shortBio} />);
    
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('About');
    expect(screen.getByText(shortBio)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /show more/i })).not.toBeInTheDocument();
  });

  it('renders long bio with expand/collapse functionality', () => {
    const longBio = 'This is a very long artist bio that should be collapsed by default. '.repeat(10);
    render(<ArtistBio description={longBio} />);
    
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('About');
    expect(screen.getByRole('button', { name: /show more/i })).toBeInTheDocument();
    
    // Should show truncated text initially
    const displayedText = screen.getByText(/This is a very long artist bio/);
    expect(displayedText.textContent).toMatch(/\.\.\.$/);
  });

  it('expands bio when show more button is clicked', () => {
    const longBio = 'This is a very long artist bio that should be collapsed by default. '.repeat(10);
    render(<ArtistBio description={longBio} />);
    
    const showMoreButton = screen.getByRole('button', { name: /show more/i });
    fireEvent.click(showMoreButton);
    
    expect(screen.getByRole('button', { name: /show less/i })).toBeInTheDocument();
    expect(screen.getByText(longBio.trim())).toBeInTheDocument();
  });

  it('collapses bio when show less button is clicked', () => {
    const longBio = 'This is a very long artist bio that should be collapsed by default. '.repeat(10);
    render(<ArtistBio description={longBio} />);
    
    const showMoreButton = screen.getByRole('button', { name: /show more/i });
    fireEvent.click(showMoreButton);
    
    const showLessButton = screen.getByRole('button', { name: /show less/i });
    fireEvent.click(showLessButton);
    
    expect(screen.getByRole('button', { name: /show more/i })).toBeInTheDocument();
    const displayedText = screen.getByText(/This is a very long artist bio/);
    expect(displayedText.textContent).toMatch(/\.\.\.$/);
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <ArtistBio description="Test bio" className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('preserves line breaks in bio text', () => {
    const bioWithLineBreaks = 'First line\n\nSecond line\nThird line';
    render(<ArtistBio description={bioWithLineBreaks} />);
    
    const bioText = screen.getByText((content, element) => {
      return element?.tagName === 'P' && element?.textContent === bioWithLineBreaks;
    });
    expect(bioText).toHaveClass('whitespace-pre-line');
  });

  it('has proper accessibility attributes for expand/collapse button', () => {
    const longBio = 'This is a very long artist bio that should be collapsed by default. '.repeat(10);
    render(<ArtistBio description={longBio} />);
    
    const button = screen.getByRole('button', { name: /show more/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-label', 'Show more');
    
    fireEvent.click(button);
    
    const expandedButton = screen.getByRole('button', { name: /show less/i });
    expect(expandedButton).toHaveAttribute('aria-expanded', 'true');
    expect(expandedButton).toHaveAttribute('aria-label', 'Show less');
  });

  it('rotates chevron icon when expanding/collapsing', () => {
    const longBio = 'This is a very long artist bio that should be collapsed by default. '.repeat(10);
    render(<ArtistBio description={longBio} />);
    
    const button = screen.getByRole('button', { name: /show more/i });
    const icon = button.querySelector('svg');
    
    expect(icon).toHaveClass('rotate-0');
    
    fireEvent.click(button);
    
    expect(icon).toHaveClass('rotate-180');
  });

  it('handles bio exactly at 200 character threshold', () => {
    const exactBio = 'a'.repeat(200);
    render(<ArtistBio description={exactBio} />);
    
    // Should not show toggle for exactly 200 characters
    expect(screen.queryByRole('button', { name: /show more/i })).not.toBeInTheDocument();
    expect(screen.getByText(exactBio)).toBeInTheDocument();
  });

  it('handles bio just over 200 character threshold', () => {
    const longBio = 'a'.repeat(201);
    render(<ArtistBio description={longBio} />);
    
    // Should show toggle for 201 characters
    expect(screen.getByRole('button', { name: /show more/i })).toBeInTheDocument();
  });
});