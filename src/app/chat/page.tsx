'use client';

import { useEffect, useRef } from 'react';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { ClarificationMessage } from './components/ClarificationMessage';
import { useChatSession } from './hooks/useChatSession';

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant' as const,
  content:
    "Hi! I'm here to help you submit a gig to bndy. Just tell me about your event - the venue, date, time, artists playing, or anything else you know. I'll ask follow-up questions if I need more details.",
  timestamp: '',
};

export default function ChatPage() {
  const {
    messages,
    isLoading,
    error,
    clarifications,
    resolvingId,
    sendMessage,
    clearSession,
    handleResolve,
    handleDismiss,
  } = useChatSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get the first (active) clarification - sequential presentation
  const activeClarification = clarifications.length > 0 ? clarifications[0] : null;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, clarifications]);

  const displayMessages = messages.length === 0 ? [WELCOME_MESSAGE] : messages;

  const handleNewChat = () => {
    clearSession();
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col px-4 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Chat</h1>
            <p className="text-sm text-zinc-400">Tell me about your gig</p>
          </div>
          <button
            onClick={handleNewChat}
            aria-label="New chat"
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-600 rounded-lg transition-colors"
          >
            New Chat
          </button>
        </header>

        {/* Messages */}
        <div
          role="list"
          className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0"
        >
          {displayMessages.map((message) => (
            <ChatMessage
              key={message.id}
              role={message.role}
              content={message.content}
              timestamp={message.timestamp || undefined}
            />
          ))}

          {/* Loading indicator for pending response */}
          {isLoading && (
            <ChatMessage
              role="assistant"
              content=""
              isLoading
            />
          )}

          {/* Clarification prompt - only show when not loading */}
          {activeClarification && !isLoading && (
            <ClarificationMessage
              clarification={activeClarification}
              onResolve={handleResolve}
              onDismiss={handleDismiss}
              isResolving={resolvingId === activeClarification.clarificationId}
            />
          )}

          {/* Error display */}
          {error && (
            <div className="bg-red-900/50 border border-red-500 rounded-lg p-4">
              <p className="text-red-300">{error}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="pt-4 border-t border-zinc-800">
          <ChatInput
            onSend={sendMessage}
            isDisabled={isLoading}
            autoFocus
          />
        </div>
      </div>
    </main>
  );
}
