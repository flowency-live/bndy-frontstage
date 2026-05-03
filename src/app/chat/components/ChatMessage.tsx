'use client';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  isLoading?: boolean;
}

export function ChatMessage({ role, content, timestamp, isLoading }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div
      data-testid="chat-message"
      role="listitem"
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <span className="text-xs text-zinc-500">
          {isUser ? 'You' : 'bndy'}
        </span>

        {isLoading ? (
          <div
            data-testid="loading-indicator"
            className="bg-zinc-800 rounded-lg px-4 py-3"
          >
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        ) : (
          <div
            className={`rounded-lg px-4 py-3 whitespace-pre-wrap ${
              isUser
                ? 'bg-amber-600 text-white'
                : 'bg-zinc-800 text-zinc-100'
            }`}
          >
            {content}
          </div>
        )}

        {timestamp && (
          <span className="text-xs text-zinc-600">{timestamp}</span>
        )}
      </div>
    </div>
  );
}
