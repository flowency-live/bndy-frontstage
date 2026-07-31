import { render, screen, waitFor, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { TenantProvider, useTenant } from '../TenantContext';
import { Builder, BuilderTheme } from '@/lib/types';

// Mock fetch globally
global.fetch = jest.fn();

// Factory function for test builders
const createTestBuilder = (overrides?: Partial<Builder>): Builder => ({
  id: 'builder-1',
  user_id: 'user-123',
  name: 'Congleton Live',
  slug: 'congleton',
  description: 'Live music in Congleton',
  branding: {
    logoUrl: 'https://example.com/logo.png',
    tagline: 'Music in the heart of Cheshire',
  },
  theme: {
    primaryColor: '#ff00ff',
    secondaryColor: '#00ffff',
    backgroundColor: '#0a0a0a',
    foregroundColor: '#ffffff',
    defaultMode: 'dark',
  },
  coverage: {
    type: 'postcode_radius',
    postcode: 'CW12 1AB',
    radius: 10,
  },
  status: 'published',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

// Wrapper with subdomain
const createWrapper = (subdomain: string | null) => {
  return ({ children }: { children: React.ReactNode }) => (
    <TenantProvider subdomain={subdomain}>{children}</TenantProvider>
  );
};

describe('TenantContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    (global.fetch as jest.Mock).mockReset();

    // Reset CSS variables on document root
    const root = document.documentElement;
    root.style.removeProperty('--primary');
    root.style.removeProperty('--secondary');
    root.style.removeProperty('--background');
    root.style.removeProperty('--foreground');
    root.classList.remove('dark', 'light');
  });

  describe('useTenant hook', () => {
    it('throws error when used outside provider', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useTenant());
      }).toThrow('useTenant must be used within a TenantProvider');

      spy.mockRestore();
    });
  });

  describe('no subdomain (main site)', () => {
    it('returns null tenant when no subdomain', async () => {
      const { result } = renderHook(() => useTenant(), {
        wrapper: createWrapper(null),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.tenant).toBeNull();
      expect(result.current.subdomain).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('isWhiteLabel returns false when no subdomain', async () => {
      const { result } = renderHook(() => useTenant(), {
        wrapper: createWrapper(null),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isWhiteLabel).toBe(false);
    });
  });

  describe('with subdomain', () => {
    it('fetches tenant config when subdomain provided', async () => {
      const mockBuilder = createTestBuilder();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ builder: mockBuilder }),
      });

      const { result } = renderHook(() => useTenant(), {
        wrapper: createWrapper('congleton'),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/builders/by-subdomain/congleton'),
        expect.any(Object)
      );
      expect(result.current.tenant).toEqual(mockBuilder);
      expect(result.current.subdomain).toBe('congleton');
    });

    it('isWhiteLabel returns true when tenant loaded', async () => {
      const mockBuilder = createTestBuilder();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ builder: mockBuilder }),
      });

      const { result } = renderHook(() => useTenant(), {
        wrapper: createWrapper('congleton'),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isWhiteLabel).toBe(true);
    });

    it('handles 404 for unknown subdomain gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Builder not found' }),
      });

      const { result } = renderHook(() => useTenant(), {
        wrapper: createWrapper('unknown-slug'),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.tenant).toBeNull();
      expect(result.current.error).toBe('Builder not found');
      expect(result.current.isWhiteLabel).toBe(false);
    });

    it('handles network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useTenant(), {
        wrapper: createWrapper('congleton'),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.tenant).toBeNull();
      expect(result.current.error).toBe('Network error');
    });
  });

  describe('theme injection', () => {
    it('applies theme CSS variables on load', async () => {
      const mockBuilder = createTestBuilder({
        theme: {
          primaryColor: '#ff00ff',
          secondaryColor: '#00ffff',
          backgroundColor: '#0a0a0a',
          foregroundColor: '#ffffff',
          defaultMode: 'dark',
        },
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ builder: mockBuilder }),
      });

      const { result } = renderHook(() => useTenant(), {
        wrapper: createWrapper('congleton'),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const root = document.documentElement;
      expect(root.style.getPropertyValue('--primary')).toBe('#ff00ff');
      expect(root.style.getPropertyValue('--secondary')).toBe('#00ffff');
      expect(root.style.getPropertyValue('--background')).toBe('#0a0a0a');
      expect(root.style.getPropertyValue('--foreground')).toBe('#ffffff');
    });

    it('applies dark mode class when defaultMode is dark', async () => {
      const mockBuilder = createTestBuilder({
        theme: {
          primaryColor: '#ff00ff',
          secondaryColor: '#00ffff',
          backgroundColor: '#0a0a0a',
          foregroundColor: '#ffffff',
          defaultMode: 'dark',
        },
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ builder: mockBuilder }),
      });

      const { result } = renderHook(() => useTenant(), {
        wrapper: createWrapper('congleton'),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('applies light mode class when defaultMode is light', async () => {
      const mockBuilder = createTestBuilder({
        theme: {
          primaryColor: '#ffffff',
          secondaryColor: '#000000',
          backgroundColor: '#f5f5f5',
          foregroundColor: '#333333',
          defaultMode: 'light',
        },
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ builder: mockBuilder }),
      });

      const { result } = renderHook(() => useTenant(), {
        wrapper: createWrapper('light-builder'),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('does not apply theme when no tenant', async () => {
      const { result } = renderHook(() => useTenant(), {
        wrapper: createWrapper(null),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const root = document.documentElement;
      expect(root.style.getPropertyValue('--primary')).toBe('');
    });
  });

  describe('branding', () => {
    it('provides branding info from tenant', async () => {
      const mockBuilder = createTestBuilder({
        branding: {
          logoUrl: 'https://example.com/custom-logo.png',
          tagline: 'Custom tagline here',
        },
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ builder: mockBuilder }),
      });

      const { result } = renderHook(() => useTenant(), {
        wrapper: createWrapper('congleton'),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.tenant?.branding.logoUrl).toBe('https://example.com/custom-logo.png');
      expect(result.current.tenant?.branding.tagline).toBe('Custom tagline here');
    });
  });

  describe('loading state', () => {
    it('starts in loading state when subdomain provided', () => {
      (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useTenant(), {
        wrapper: createWrapper('congleton'),
      });

      expect(result.current.loading).toBe(true);
    });

    it('starts not loading when no subdomain', () => {
      const { result } = renderHook(() => useTenant(), {
        wrapper: createWrapper(null),
      });

      expect(result.current.loading).toBe(false);
    });
  });
});
