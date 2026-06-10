// src/components/shared/__tests__/EventDisclaimer.test.tsx
// TDD: Tests for event accuracy disclaimer component (FS-10)

import { render, screen, fireEvent } from '@testing-library/react';
import EventDisclaimer from '../EventDisclaimer';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  X: ({ className }: { className?: string }) => <span data-testid="x-icon" className={className}>X</span>,
  Info: ({ className }: { className?: string }) => <span data-testid="info-icon" className={className}>i</span>,
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('EventDisclaimer', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('rendering', () => {
    it('renders the disclaimer message', () => {
      render(<EventDisclaimer />);
      expect(screen.getByText(/events subject to change/i)).toBeInTheDocument();
    });

    it('includes accuracy hint about checking venue/artist', () => {
      render(<EventDisclaimer />);
      expect(screen.getByText(/check venue\/artist for accuracy/i)).toBeInTheDocument();
    });

    it('includes hint about social profiles', () => {
      render(<EventDisclaimer />);
      expect(screen.getByText(/click.*profiles/i)).toBeInTheDocument();
    });

    it('renders with default inline variant', () => {
      const { container } = render(<EventDisclaimer />);
      expect(container.firstChild).not.toHaveClass('fixed');
    });

    it('renders with banner variant when specified', () => {
      const { container } = render(<EventDisclaimer variant="banner" />);
      expect(container.firstChild).toHaveClass('fixed');
    });
  });

  describe('dismissal', () => {
    it('renders dismiss button', () => {
      render(<EventDisclaimer />);
      expect(screen.getByRole('button', { name: /dismiss|close|got it/i })).toBeInTheDocument();
    });

    it('hides disclaimer when dismissed', () => {
      render(<EventDisclaimer />);
      const dismissButton = screen.getByRole('button', { name: /dismiss|close|got it/i });
      fireEvent.click(dismissButton);
      expect(screen.queryByText(/events subject to change/i)).not.toBeInTheDocument();
    });

    it('saves dismissal preference to localStorage', () => {
      render(<EventDisclaimer />);
      const dismissButton = screen.getByRole('button', { name: /dismiss|close|got it/i });
      fireEvent.click(dismissButton);
      expect(localStorageMock.getItem('bndy-disclaimer-dismissed')).toBe('true');
    });

    it('does not render if previously dismissed', () => {
      localStorageMock.setItem('bndy-disclaimer-dismissed', 'true');
      render(<EventDisclaimer />);
      expect(screen.queryByText(/events subject to change/i)).not.toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it('inline variant has appropriate styling', () => {
      const { container } = render(<EventDisclaimer variant="inline" />);
      const disclaimer = container.firstChild as HTMLElement;
      expect(disclaimer).toHaveClass('rounded-lg');
    });

    it('banner variant is fixed positioned', () => {
      const { container } = render(<EventDisclaimer variant="banner" />);
      const disclaimer = container.firstChild as HTMLElement;
      expect(disclaimer).toHaveClass('fixed');
      expect(disclaimer).toHaveClass('bottom-0');
    });

    it('compact variant shows shorter message', () => {
      render(<EventDisclaimer variant="compact" />);
      // Compact should still have core message but may be abbreviated
      expect(screen.getByText(/subject to change/i)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has appropriate ARIA role', () => {
      render(<EventDisclaimer />);
      expect(screen.getByRole('note')).toBeInTheDocument();
    });

    it('dismiss button is keyboard accessible', () => {
      render(<EventDisclaimer />);
      const dismissButton = screen.getByRole('button', { name: /dismiss|close|got it/i });
      expect(dismissButton).toHaveAttribute('type', 'button');
    });
  });

  describe('theming', () => {
    it('applies dark mode classes', () => {
      const { container } = render(<EventDisclaimer />);
      const disclaimer = container.firstChild as HTMLElement;
      // Should have both light and dark mode classes
      expect(disclaimer.className).toMatch(/dark:/);
    });
  });
});
