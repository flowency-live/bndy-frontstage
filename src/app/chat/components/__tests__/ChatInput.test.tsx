import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInput } from '../ChatInput';

describe('ChatInput', () => {
  const mockOnSend = jest.fn();

  beforeEach(() => {
    mockOnSend.mockClear();
  });

  describe('rendering', () => {
    it('renders a text input', () => {
      render(<ChatInput onSend={mockOnSend} />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders a send button', () => {
      render(<ChatInput onSend={mockOnSend} />);

      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    });

    it('has appropriate placeholder text', () => {
      render(<ChatInput onSend={mockOnSend} />);

      expect(screen.getByPlaceholderText(/tell me about your gig/i)).toBeInTheDocument();
    });
  });

  describe('user input', () => {
    it('allows typing in the input', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Jazz night at The Blue Note');

      expect(input).toHaveValue('Jazz night at The Blue Note');
    });

    it('clears input after sending', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Test message');
      await user.click(screen.getByRole('button', { name: /send/i }));

      expect(input).toHaveValue('');
    });
  });

  describe('sending messages', () => {
    it('calls onSend with message content when send button clicked', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} />);

      await user.type(screen.getByRole('textbox'), 'Gig at the pub');
      await user.click(screen.getByRole('button', { name: /send/i }));

      expect(mockOnSend).toHaveBeenCalledWith('Gig at the pub');
    });

    it('calls onSend when Enter key pressed', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Friday night gig');
      await user.keyboard('{Enter}');

      expect(mockOnSend).toHaveBeenCalledWith('Friday night gig');
    });

    it('does not send empty messages', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} />);

      await user.click(screen.getByRole('button', { name: /send/i }));

      expect(mockOnSend).not.toHaveBeenCalled();
    });

    it('does not send whitespace-only messages', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} />);

      await user.type(screen.getByRole('textbox'), '   ');
      await user.click(screen.getByRole('button', { name: /send/i }));

      expect(mockOnSend).not.toHaveBeenCalled();
    });

    it('trims whitespace from message before sending', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} />);

      await user.type(screen.getByRole('textbox'), '  hello world  ');
      await user.click(screen.getByRole('button', { name: /send/i }));

      expect(mockOnSend).toHaveBeenCalledWith('hello world');
    });
  });

  describe('disabled state', () => {
    it('disables input when isDisabled is true', () => {
      render(<ChatInput onSend={mockOnSend} isDisabled />);

      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('disables send button when isDisabled is true', () => {
      render(<ChatInput onSend={mockOnSend} isDisabled />);

      expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
    });

    it('does not call onSend when disabled', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} isDisabled />);

      // Even if input has value somehow, clicking send should not work
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } });
      await user.click(screen.getByRole('button', { name: /send/i }));

      expect(mockOnSend).not.toHaveBeenCalled();
    });

    it('disables send button when input is empty', () => {
      render(<ChatInput onSend={mockOnSend} />);

      expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
    });

    it('enables send button when input has content', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} />);

      await user.type(screen.getByRole('textbox'), 'Hello');

      expect(screen.getByRole('button', { name: /send/i })).toBeEnabled();
    });
  });

  describe('accessibility', () => {
    it('has proper label for screen readers', () => {
      render(<ChatInput onSend={mockOnSend} />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-label', 'Message input');
    });

    it('focuses input on mount when autoFocus is true', () => {
      render(<ChatInput onSend={mockOnSend} autoFocus />);

      expect(screen.getByRole('textbox')).toHaveFocus();
    });
  });

  describe('keyboard navigation', () => {
    it('does not submit on Shift+Enter (allows newline)', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Line 1');

      // Use fireEvent for explicit shiftKey control (userEvent.keyboard has JSDOM quirks)
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });

      expect(mockOnSend).not.toHaveBeenCalled();
    });
  });
});
