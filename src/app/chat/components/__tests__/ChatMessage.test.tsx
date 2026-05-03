import { render, screen } from '@testing-library/react';
import { ChatMessage } from '../ChatMessage';

describe('ChatMessage', () => {
  describe('user messages', () => {
    it('renders user message content', () => {
      render(
        <ChatMessage
          role="user"
          content="I want to submit a gig at The Blue Note"
        />
      );

      expect(screen.getByText('I want to submit a gig at The Blue Note')).toBeInTheDocument();
    });

    it('applies user message styling (right-aligned, amber background)', () => {
      render(
        <ChatMessage
          role="user"
          content="Test message"
        />
      );

      const message = screen.getByText('Test message');
      const container = message.closest('[data-testid="chat-message"]');

      expect(container).toHaveClass('justify-end');
      expect(message).toHaveClass('bg-amber-600');
    });

    it('displays "You" label for user messages', () => {
      render(
        <ChatMessage
          role="user"
          content="Test message"
        />
      );

      expect(screen.getByText('You')).toBeInTheDocument();
    });
  });

  describe('assistant messages', () => {
    it('renders assistant message content', () => {
      render(
        <ChatMessage
          role="assistant"
          content="Great! What date is the gig?"
        />
      );

      expect(screen.getByText('Great! What date is the gig?')).toBeInTheDocument();
    });

    it('applies assistant message styling (left-aligned, zinc background)', () => {
      render(
        <ChatMessage
          role="assistant"
          content="Test response"
        />
      );

      const message = screen.getByText('Test response');
      const container = message.closest('[data-testid="chat-message"]');

      expect(container).toHaveClass('justify-start');
      expect(message).toHaveClass('bg-zinc-800');
    });

    it('displays "bndy" label for assistant messages', () => {
      render(
        <ChatMessage
          role="assistant"
          content="Test response"
        />
      );

      expect(screen.getByText('bndy')).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('shows loading indicator when isLoading is true', () => {
      render(
        <ChatMessage
          role="assistant"
          content=""
          isLoading
        />
      );

      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });

    it('does not show content when loading', () => {
      render(
        <ChatMessage
          role="assistant"
          content="This should not appear"
          isLoading
        />
      );

      expect(screen.queryByText('This should not appear')).not.toBeInTheDocument();
    });
  });

  describe('timestamps', () => {
    it('renders timestamp when provided', () => {
      render(
        <ChatMessage
          role="user"
          content="Test message"
          timestamp="14:30"
        />
      );

      expect(screen.getByText('14:30')).toBeInTheDocument();
    });

    it('does not render timestamp when not provided', () => {
      render(
        <ChatMessage
          role="user"
          content="Test message"
        />
      );

      expect(screen.queryByText(/\d{2}:\d{2}/)).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has appropriate ARIA attributes', () => {
      render(
        <ChatMessage
          role="user"
          content="Accessible message"
        />
      );

      const container = screen.getByTestId('chat-message');
      expect(container).toHaveAttribute('role', 'listitem');
    });
  });

  describe('multiline content', () => {
    it('preserves line breaks in message content', () => {
      render(
        <ChatMessage
          role="assistant"
          content={'Line 1\nLine 2\nLine 3'}
        />
      );

      const message = screen.getByText(/Line 1/);
      expect(message).toHaveClass('whitespace-pre-wrap');
    });
  });
});
