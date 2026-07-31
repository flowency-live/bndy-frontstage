import { render, screen, waitFor, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { BuilderProvider, useBuilder } from '../BuilderContext';
import { Builder } from '@/lib/types';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

// Mock fetch globally
global.fetch = jest.fn();

// Factory function for test builders
const createTestBuilder = (overrides?: Partial<Builder>): Builder => ({
  id: 'builder-1',
  user_id: 'user-123',
  name: 'Test Builder',
  slug: 'test-builder',
  description: 'A test builder for unit tests',
  branding: {
    logoUrl: 'https://example.com/logo.png',
    tagline: 'Test tagline',
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

// Wrapper component for testing hooks
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BuilderProvider>{children}</BuilderProvider>
);

describe('BuilderContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('useBuilder hook', () => {
    it('throws error when used outside provider', () => {
      // Suppress console.error for this test
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useBuilder());
      }).toThrow('useBuilder must be used within a BuilderProvider');

      spy.mockRestore();
    });
  });

  describe('initial state', () => {
    it('starts with null current builder', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ builders: [] }),
      });

      const { result } = renderHook(() => useBuilder(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.currentBuilder).toBeNull();
      expect(result.current.builders).toEqual([]);
    });

    it('starts in loading state', () => {
      (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useBuilder(), { wrapper });

      expect(result.current.loading).toBe(true);
    });
  });

  describe('loading builders for authenticated user', () => {
    it('fetches builders on mount', async () => {
      const mockBuilders = [createTestBuilder()];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ builders: mockBuilders }),
      });

      const { result } = renderHook(() => useBuilder(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/builders/me'),
        expect.objectContaining({
          credentials: 'include',
        })
      );
      expect(result.current.builders).toEqual(mockBuilders);
    });

    it('returns empty array for user with no builders', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ builders: [] }),
      });

      const { result } = renderHook(() => useBuilder(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.builders).toEqual([]);
      expect(result.current.hasBuilders).toBe(false);
    });

    it('handles API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Not authenticated' }),
      });

      const { result } = renderHook(() => useBuilder(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.builders).toEqual([]);
      expect(result.current.error).toBe('Not authenticated');
    });

    it('handles network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useBuilder(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.builders).toEqual([]);
      expect(result.current.error).toBe('Network error');
    });
  });

  describe('setCurrentBuilderId', () => {
    it('updates context with selected builder', async () => {
      const mockBuilders = [
        createTestBuilder({ id: 'builder-1', name: 'Builder One' }),
        createTestBuilder({ id: 'builder-2', name: 'Builder Two' }),
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ builders: mockBuilders }),
      });

      const { result } = renderHook(() => useBuilder(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setCurrentBuilderId('builder-2');
      });

      expect(result.current.currentBuilder?.id).toBe('builder-2');
      expect(result.current.currentBuilder?.name).toBe('Builder Two');
    });

    it('sets currentBuilder to null when ID not found', async () => {
      const mockBuilders = [createTestBuilder({ id: 'builder-1' })];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ builders: mockBuilders }),
      });

      const { result } = renderHook(() => useBuilder(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setCurrentBuilderId('nonexistent');
      });

      expect(result.current.currentBuilder).toBeNull();
    });

    it('clears current builder when null is passed', async () => {
      const mockBuilders = [createTestBuilder({ id: 'builder-1' })];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ builders: mockBuilders }),
      });

      const { result } = renderHook(() => useBuilder(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setCurrentBuilderId('builder-1');
      });
      expect(result.current.currentBuilder).not.toBeNull();

      act(() => {
        result.current.setCurrentBuilderId(null);
      });
      expect(result.current.currentBuilder).toBeNull();
    });
  });

  describe('localStorage persistence', () => {
    it('persists selected builder to localStorage', async () => {
      const mockBuilders = [createTestBuilder({ id: 'builder-1' })];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ builders: mockBuilders }),
      });

      const { result } = renderHook(() => useBuilder(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setCurrentBuilderId('builder-1');
      });

      expect(localStorage.getItem('bndy-current-builder-id')).toBe('builder-1');
    });

    it('restores selected builder from localStorage', async () => {
      localStorage.setItem('bndy-current-builder-id', 'builder-2');

      const mockBuilders = [
        createTestBuilder({ id: 'builder-1', name: 'Builder One' }),
        createTestBuilder({ id: 'builder-2', name: 'Builder Two' }),
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ builders: mockBuilders }),
      });

      const { result } = renderHook(() => useBuilder(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.currentBuilder?.id).toBe('builder-2');
    });

    it('ignores invalid localStorage value if builder not found', async () => {
      localStorage.setItem('bndy-current-builder-id', 'nonexistent');

      const mockBuilders = [createTestBuilder({ id: 'builder-1' })];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ builders: mockBuilders }),
      });

      const { result } = renderHook(() => useBuilder(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should not select the nonexistent builder
      expect(result.current.currentBuilder).toBeNull();
    });

    it('removes localStorage key when builder is cleared', async () => {
      localStorage.setItem('bndy-current-builder-id', 'builder-1');

      const mockBuilders = [createTestBuilder({ id: 'builder-1' })];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ builders: mockBuilders }),
      });

      const { result } = renderHook(() => useBuilder(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setCurrentBuilderId(null);
      });

      expect(localStorage.getItem('bndy-current-builder-id')).toBeNull();
    });
  });

  describe('hasBuilders computed property', () => {
    it('returns true when user has builders', async () => {
      const mockBuilders = [createTestBuilder()];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ builders: mockBuilders }),
      });

      const { result } = renderHook(() => useBuilder(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasBuilders).toBe(true);
    });

    it('returns false when user has no builders', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ builders: [] }),
      });

      const { result } = renderHook(() => useBuilder(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasBuilders).toBe(false);
    });
  });

  describe('refresh functionality', () => {
    it('refetches builders when refresh is called', async () => {
      const mockBuilders = [createTestBuilder()];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ builders: mockBuilders }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ builders: [...mockBuilders, createTestBuilder({ id: 'builder-2' })] }),
        });

      const { result } = renderHook(() => useBuilder(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.builders).toHaveLength(1);

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.builders).toHaveLength(2);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
