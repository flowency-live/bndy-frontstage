import { renderHook, act, waitFor } from '@testing-library/react';
import { useChatSession } from '../useChatSession';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('useChatSession', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('initial state', () => {
    it('starts with empty messages array', () => {
      const { result } = renderHook(() => useChatSession());

      expect(result.current.messages).toEqual([]);
    });

    it('starts with isLoading false', () => {
      const { result } = renderHook(() => useChatSession());

      expect(result.current.isLoading).toBe(false);
    });

    it('starts with no error', () => {
      const { result } = renderHook(() => useChatSession());

      expect(result.current.error).toBeNull();
    });

    it('starts with no sessionId', () => {
      const { result } = renderHook(() => useChatSession());

      expect(result.current.sessionId).toBeNull();
    });
  });

  describe('sendMessage', () => {
    it('adds user message to messages array immediately', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ signalId: 'signal-123' }),
      });

      const { result } = renderHook(() => useChatSession());

      await act(async () => {
        result.current.sendMessage('Hello, I have a gig');
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0]).toMatchObject({
        role: 'user',
        content: 'Hello, I have a gig',
      });
    });

    it('sets isLoading to true while waiting for response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ signalId: 'signal-123' }),
      });

      const { result } = renderHook(() => useChatSession());

      act(() => {
        result.current.sendMessage('Test message');
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('calls API with correct payload for first message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ signalId: 'signal-123' }),
      });

      const { result } = renderHook(() => useChatSession());

      await act(async () => {
        result.current.sendMessage('Jazz gig at The Blue Note');
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/signals'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Jazz gig at The Blue Note'),
        })
      );
    });

    it('includes sessionId in subsequent messages', async () => {
      // First message creates session
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ signalId: 'signal-123', sessionId: 'session-abc' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              signal: { signalId: 'signal-123', status: 'pending_review' },
              interpretation: { llmInterpretation: { response: 'Got it!' } },
              claims: [],
            }),
        })
        // Second message
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ signalId: 'signal-456' }),
        });

      const { result } = renderHook(() => useChatSession());

      await act(async () => {
        result.current.sendMessage('First message');
      });

      // Advance timers to trigger poll
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await act(async () => {
        result.current.sendMessage('Second message');
      });

      // Check second API call includes sessionId
      const secondCall = mockFetch.mock.calls[2];
      expect(secondCall[1].body).toContain('session-abc');
    });
  });

  describe('polling for responses', () => {
    it('polls for response after sending message', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ signalId: 'signal-123' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              signal: { signalId: 'signal-123', status: 'pending_review' },
              interpretation: {
                llmInterpretation: { response: 'What date is the gig?' },
              },
              claims: [],
            }),
        });

      const { result } = renderHook(() => useChatSession());

      await act(async () => {
        result.current.sendMessage('I have a gig');
      });

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(result.current.messages).toHaveLength(2);
      });

      expect(result.current.messages[1]).toMatchObject({
        role: 'assistant',
        content: 'What date is the gig?',
      });
    });

    it('sets isLoading to false after receiving response', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ signalId: 'signal-123' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              signal: { signalId: 'signal-123', status: 'pending_review' },
              interpretation: {
                llmInterpretation: { response: 'Response received' },
              },
              claims: [],
            }),
        });

      const { result } = renderHook(() => useChatSession());

      await act(async () => {
        result.current.sendMessage('Test');
      });

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('continues polling while status is processing', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ signalId: 'signal-123' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              signal: { signalId: 'signal-123', status: 'processing' },
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              signal: { signalId: 'signal-123', status: 'pending_review' },
              interpretation: {
                llmInterpretation: { response: 'Done!' },
              },
              claims: [],
            }),
        });

      const { result } = renderHook(() => useChatSession());

      await act(async () => {
        result.current.sendMessage('Test');
      });

      // First poll - still processing
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.isLoading).toBe(true);

      // Second poll - done
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('error handling', () => {
    it('sets error when API call fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useChatSession());

      await act(async () => {
        result.current.sendMessage('Test');
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.isLoading).toBe(false);
    });

    it('sets error when API returns non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Bad request' }),
      });

      const { result } = renderHook(() => useChatSession());

      await act(async () => {
        result.current.sendMessage('Test');
      });

      expect(result.current.error).toBe('Bad request');
    });

    it('clears error when sending new message', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ signalId: 'signal-123' }),
        });

      const { result } = renderHook(() => useChatSession());

      await act(async () => {
        result.current.sendMessage('First');
      });

      expect(result.current.error).toBe('First error');

      await act(async () => {
        result.current.sendMessage('Second');
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('clearSession', () => {
    it('resets all state', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ signalId: 'signal-123', sessionId: 'session-abc' }),
      });

      const { result } = renderHook(() => useChatSession());

      await act(async () => {
        result.current.sendMessage('Test');
      });

      act(() => {
        result.current.clearSession();
      });

      expect(result.current.messages).toEqual([]);
      expect(result.current.sessionId).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });
});