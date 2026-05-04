'use client';

import { ClarificationRequest } from '../types/clarification';

interface ClarificationMessageProps {
  clarification: ClarificationRequest;
  onResolve: (clarificationId: string, optionId: string) => void;
  onDismiss: (clarificationId: string) => void;
  isResolving: boolean;
}

export function ClarificationMessage({
  clarification,
  onResolve,
  onDismiss,
  isResolving,
}: ClarificationMessageProps) {
  const handleOptionClick = (optionId: string) => {
    if (!isResolving) {
      onResolve(clarification.clarificationId, optionId);
    }
  };

  const handleSkip = () => {
    if (!isResolving) {
      onDismiss(clarification.clarificationId);
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
        </div>
      </div>
    </div>
  );
}
