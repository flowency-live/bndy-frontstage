'use client';

import { useState } from 'react';

interface SignalDropzoneProps {
  onSubmit: (content: string) => void;
  isSubmitting: boolean;
}

export function SignalDropzone({ onSubmit, isSubmitting }: SignalDropzoneProps) {
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() && !isSubmitting) {
      onSubmit(content.trim());
    }
  };

  const exampleTexts = [
    'STINGRAY LIVE AT THE RIGGER THURSDAY 15TH MAY 8PM',
    'Jazz Night at The Blue Note - Friday 23rd May, doors 7pm, tickets £15',
    'Acoustic Sessions every Tuesday at The Crown, 8pm start, free entry',
  ];

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
      <form onSubmit={handleSubmit}>
        <label htmlFor="content" className="block text-sm font-medium text-zinc-300 mb-2">
          Paste event text
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste Facebook event text, poster text, or any event announcement..."
          className="w-full h-40 bg-zinc-800 border border-zinc-700 rounded-lg p-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
          disabled={isSubmitting}
        />

        <div className="flex items-center justify-between mt-4">
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className="px-6 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Interpreting...
              </span>
            ) : (
              'Interpret Signal'
            )}
          </button>

          <span className="text-sm text-zinc-500">
            {content.length} characters
          </span>
        </div>
      </form>

      <div className="mt-6 pt-6 border-t border-zinc-800">
        <p className="text-sm text-zinc-500 mb-3">Try an example:</p>
        <div className="flex flex-wrap gap-2">
          {exampleTexts.map((text, i) => (
            <button
              key={i}
              onClick={() => setContent(text)}
              disabled={isSubmitting}
              className="text-sm px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
            >
              Example {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
