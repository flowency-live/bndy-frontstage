'use client';

import { useState, useCallback } from 'react';
import { ClarificationRequest } from '../types/clarification';

interface ClarificationMessageProps {
  clarification: ClarificationRequest;
  onResolve: (clarificationId: string, optionIdOrValue: string, isFreeform?: boolean) => void;
  onDismiss: (clarificationId: string) => void;
  isResolving: boolean;
}

export function ClarificationMessage({
  clarification,
  onResolve,
  onDismiss,
  isResolving,
}: ClarificationMessageProps) {
  const [textInput, setTextInput] = useState('');
  const hasOptions = clarification.options.length > 0;

  const handleOptionClick = (optionId: string) => {
    if (!isResolving) {
      onResolve(clarification.clarificationId, optionId, false);
    }
  };

  const handleTextSubmit = useCallback(() => {
    if (!isResolving && textInput.trim()) {
      onResolve(clarification.clarificationId, textInput.trim(), true);
      setTextInput('');
    }
  }, [isResolving, textInput, clarification.clarificationId, onResolve]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    }
  };

  const handleSkip = () => {
    if (!isResolving) {
      onDismiss(clarification.clarificationId);
    }
  };

  // Determine placeholder text based on question type
  const getPlaceholder = () => {
    switch (clarification.questionType) {
      case 'event_time':
        return 'e.g. 9pm, 21:00, 8';
      case 'venue_location':
        return 'e.g. Newcastle, Manchester';
      default:
        return 'Type your answer...';
    }
  };

  return (
    <div
      data-testid="clarification-message"
      role="listitem"
      className="flex justify-start"
    >
      <div className="max-w-[80%] items-start flex flex-col gap-1">
        <span className="text-xs text-zinc-500">bndy</span>

        <div className="bg-zinc-800 rounded-lg px-4 py-3 text-zinc-100">
          <p className="mb-3">{clarification.question}</p>

          {hasOptions ? (
            <div className="flex flex-wrap gap-2">
              {clarification.options.map((option) => (
                <button
                  key={option.optionId}
                  onClick={() => handleOptionClick(option.optionId)}
                  disabled={isResolving}
                  className={`px-3 py-2 rounded-md text-sm transition-colors ${
                    isResolving
                      ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                      : 'bg-amber-600 text-white hover:bg-amber-500'
                  }`}
                >
                  {option.label}
                </button>
              ))}

              <button
                onClick={handleSkip}
                disabled={isResolving}
                className={`px-3 py-2 rounded-md text-sm transition-colors ${
                  isResolving
                    ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                    : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                }`}
              >
                Skip
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={getPlaceholder()}
                disabled={isResolving}
                className={`flex-1 px-3 py-2 rounded-md text-sm bg-zinc-700 text-zinc-100
                  placeholder-zinc-500 border border-zinc-600 focus:border-amber-500
                  focus:outline-none ${isResolving ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              <button
                onClick={handleTextSubmit}
                disabled={isResolving || !textInput.trim()}
                className={`px-4 py-2 rounded-md text-sm transition-colors ${
                  isResolving || !textInput.trim()
                    ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                    : 'bg-amber-600 text-white hover:bg-amber-500'
                }`}
              >
                Submit
              </button>
              <button
                onClick={handleSkip}
                disabled={isResolving}
                className={`px-3 py-2 rounded-md text-sm transition-colors ${
                  isResolving
                    ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                    : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                }`}
              >
                Skip
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
