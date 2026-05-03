import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatPage from '../page';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock scrollIntoView (not available in JSDOM)
Element.prototype.scrollIntoView = jest.fn();

describe('ChatPage', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('rendering', () => {
    it('renders the page header', () => {
      render(<ChatPage />);

      expect(screen.getByRole('heading', { name: /chat/i })).toBeInTheDocument();
    });

    it('renders the chat input', () => {
      render(<ChatPage />);

      expect(screen.getByPlaceholderText(/tell me about your gig/i)).toBeInTheDocument();
    });

    it('renders welcome message from assistant', () => {
      render(<ChatPage />);

      expect(screen.getByText(/help you submit a gig/i)).toBeInTheDocument();
    });

    it('renders messages container with appropriate ARIA role', () => {
      render(<ChatPage />);

      expect(screen.getByRole('list')).toBeInTheDocument();
    });
  });

  describe('sending messages', () => {
    it('displays user message after sending', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ signalId: 'signal-123' }),
      });

      render(<ChatPage />);

      const input = screen.getByPlaceholderText(/tell me about your gig/i);
      await user.type(input, 'I have a jazz gig');
      await user.click(screen.getByRole('button', { name: /send/i }));

      expect(screen.getByText('I have a jazz gig')).toBeInTheDocument();
    });

    it('clears input after sending message', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ signalId: 'signal-123' }),
      });

      render(<ChatPage />);

      const input = screen.getByPlaceholderText(/tell me about your gig/i);
      await user.type(input, 'Test message');
      await user.click(screen.getByRole('button', { name: /send/i }));

      expect(input).toHaveValue('');
    });

    it('shows loading indicator while waiting for response', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ signalId: 'signal-123' }),
      });

      render(<ChatPage />);

      await user.type(screen.getByPlaceholderText(/tell me about your gig/i), 'Test');
      await user.click(screen.getByRole('button', { name: /send/i }));

      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });

    it('displays assistant response after polling completes', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

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
                llmInterpretation: { reasoning: 'What date is your gig?' },
              },
              claims: [],
            }),
        });

      render(<ChatPage />);

      await user.type(screen.getByPlaceholderText(/tell me about your gig/i), 'I have a gig');
      await user.click(screen.getByRole('button', { name: /send/i }));

      // Advance timer to trigger poll
      await jest.advanceTimersByTimeAsync(2000);

      await waitFor(() => {
        expect(screen.getByText('What date is your gig?')).toBeInTheDocument();
      });
    });
  });

  describe('error handling', () => {
    it('displays error message when API fails', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      mockFetch.mockRejectedValueOnce(new Error('Connection failed'));

      render(<ChatPage />);

      await user.type(screen.getByPlaceholderText(/tell me about your gig/i), 'Test');
      await user.click(screen.getByRole('button', { name: /send/i }));

      await waitFor(() => {
        expect(screen.getByText(/connection failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('clear chat', () => {
    it('renders a clear/new chat button', () => {
      render(<ChatPage />);

      expect(screen.getByRole('button', { name: /new chat/i })).toBeInTheDocument();
    });

    it('clears messages when new chat button clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ signalId: 'signal-123' }),
      });

      render(<ChatPage />);

      await user.type(screen.getByPlaceholderText(/tell me about your gig/i), 'Test message');
      await user.click(screen.getByRole('button', { name: /send/i }));

      expect(screen.getByText('Test message')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /new chat/i }));

      // User message should be gone, welcome message should return
      expect(screen.queryByText('Test message')).not.toBeInTheDocument();
      expect(screen.getByText(/help you submit a gig/i)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has main landmark', () => {
      render(<ChatPage />);

      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('auto-focuses input', () => {
      render(<ChatPage />);

      expect(screen.getByPlaceholderText(/tell me about your gig/i)).toHaveFocus();
    });
  });
});