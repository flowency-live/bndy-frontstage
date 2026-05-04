'use client';

import { useState, useCallback, useRef } from 'react';
import { ClarificationRequest } from '../types/clarification';
import {
  resolveClarification as apiResolveClarification,
  dismissClarification as apiDismissClarification,
} from '../api/clarificationApi';

const SIGNALS_API_URL =
  process.env.NEXT_PUBLIC_SIGNALS_API_URL ||
  'https://9tq7w39hb2.execute-api.eu-west-2.amazonaws.com/dev';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface SignalResponse {
  signal: {
    signalId: string;
    status: string;
  };
  interpretation?: {
    llmInterpretation: {
      reasoning: string;
      modelUsed: string;
    };
  };
  claims: unknown[];
  clarifications?: ClarificationRequest[];
}

interface UseChatSessionReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sessionId: string | null;
  clarifications: ClarificationRequest[];
  resolvingId: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearSession: () => void;
  handleResolve: (clarificationId: string, optionId: string) => Promise<void>;
  handleDismiss: (clarificationId: string) => Promise<void>;
}

export function useChatSession(): UseChatSessionReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [clarifications, setClarifications] = useState<ClarificationRequest[]>([]);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const generateId = () => `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const getTimestamp = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  const pollForResponse = useCallback(async (signalId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`${SIGNALS_API_URL}/signals/${signalId}`);
        const data: SignalResponse = await response.json();

        if (data.signal.status === 'pending_review' || data.signal.status === 'failed') {
          // Stop polling
          if (pollingRef.current) {
            clearTimeout(pollingRef.current);
            pollingRef.current = null;
          }

          // Add assistant message if we have a reasoning response
          if (data.interpretation?.llmInterpretation?.reasoning) {
            const assistantMessage: ChatMessage = {
              id: generateId(),
              role: 'assistant',
              content: data.interpretation.llmInterpretation.reasoning,
              timestamp: getTimestamp(),
            };
            setMessages((prev) => [...prev, assistantMessage]);
          }

          // Update clarifications (only show open ones)
          if (data.clarifications) {
            const openClarifications = data.clarifications.filter(
              (c) => c.status === 'open'
            );
            setClarifications(openClarifications);
          }

          setIsLoading(false);
          return;
        }

        // Still processing, poll again
        pollingRef.current = setTimeout(poll, 2000);
      } catch (err) {
        setIsLoading(false);
        setError(err instanceof Error ? err.message : 'Polling failed');
      }
    };

    pollingRef.current = setTimeout(poll, 2000);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      setError(null);
      setIsLoading(true);

      // Add user message immediately
      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content,
        timestamp: getTimestamp(),
      };
      setMessages((prev) => [...prev, userMessage]);

      try {
        const body: Record<string, unknown> = {
          signalType: 'text_paste',
          content,
        };

        if (sessionId) {
          body.sessionId = sessionId;
        }

        const response = await fetch(`${SIGNALS_API_URL}/signals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to send message');
        }

        const data = await response.json();

        // Store session ID if returned
        if (data.sessionId) {
          setSessionId(data.sessionId);
        }

        // Start polling for response
        pollForResponse(data.signalId);
      } catch (err) {
        setIsLoading(false);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    },
    [sessionId, pollForResponse]
  );

  const handleResolve = useCallback(
    async (clarificationId: string, optionId: string) => {
      setResolvingId(clarificationId);
      try {
        const result = await apiResolveClarification(
          clarificationId,
          optionId,
          'chat_user' // Default user ID for chat
        );

        if (result.success) {
          // Remove the resolved clarification from the list
          setClarifications((prev) =>
            prev.filter((c) => c.clarificationId !== clarificationId)
          );
        } else {
          setError(result.error || 'Failed to resolve clarification');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to resolve clarification');
      } finally {
        setResolvingId(null);
      }
    },
    []
  );

  const handleDismiss = useCallback(async (clarificationId: string) => {
    setResolvingId(clarificationId);
    try {
      const result = await apiDismissClarification(clarificationId, 'chat_user');

      if (result.success) {
        // Remove the dismissed clarification from the list
        setClarifications((prev) =>
          prev.filter((c) => c.clarificationId !== clarificationId)
        );
      } else {
        setError(result.error || 'Failed to dismiss clarification');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dismiss clarification');
    } finally {
      setResolvingId(null);
    }
  }, []);

  const clearSession = useCallback(() => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
    setMessages([]);
    setSessionId(null);
    setError(null);
    setIsLoading(false);
    setClarifications([]);
    setResolvingId(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sessionId,
    clarifications,
    resolvingId,
    sendMessage,
    clearSession,
    handleResolve,
    handleDismiss,
  };
}
