'use client';

import { useState } from 'react';
import { SignalDropzone } from './components/SignalDropzone';
import { SignalStatus } from './components/SignalStatus';
import { ClaimsList } from './components/ClaimsList';

const API_URL = 'https://9tq7w39hb2.execute-api.eu-west-2.amazonaws.com/dev';

interface Signal {
  signalId: string;
  status: string;
  signalType: string;
  receivedAt: string;
  currentInterpretationId?: string;
}

interface Claim {
  claimId: string;
  claimType: string;
  subject: string;
  predicate: string;
  object?: string;
  value?: string;
  strength: 'weak' | 'moderate' | 'strong';
  strengthReasoning: string;
  status: string;
}

interface Interpretation {
  interpretationId: string;
  llmInterpretation: {
    reasoning: string;
    modelUsed: string;
  };
  sourceCost: {
    modelCost: number;
    tokensIn: number;
    tokensOut: number;
    runtimeMs: number;
  };
  uncertainties: string[];
}

interface SignalResponse {
  signal: Signal;
  interpretation?: Interpretation;
  claims: Claim[];
}

export default function DropzonePage() {
  const [currentSignal, setCurrentSignal] = useState<SignalResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (content: string) => {
    setIsSubmitting(true);
    setError(null);
    setCurrentSignal(null);

    try {
      const response = await fetch(`${API_URL}/signals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signalType: 'text_paste',
          content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create signal');
      }

      const { signalId } = await response.json();
      setIsPolling(true);
      pollForResult(signalId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsSubmitting(false);
    }
  };

  const pollForResult = async (signalId: string) => {
    const maxAttempts = 30;
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`${API_URL}/signals/${signalId}`);
        const data: SignalResponse = await response.json();

        setCurrentSignal(data);

        if (data.signal.status === 'pending_review' || data.signal.status === 'failed') {
          setIsPolling(false);
          setIsSubmitting(false);
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          setIsPolling(false);
          setIsSubmitting(false);
          setError('Timeout waiting for interpretation');
        }
      } catch (err) {
        setIsPolling(false);
        setIsSubmitting(false);
        setError(err instanceof Error ? err.message : 'Polling failed');
      }
    };

    poll();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Signal Dropzone</h1>
          <p className="text-zinc-400">
            Paste event text, and bndy will interpret what it means for the live music world.
          </p>
        </header>

        <div className="grid gap-8">
          <SignalDropzone
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />

          {error && (
            <div className="bg-red-900/50 border border-red-500 rounded-lg p-4">
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {currentSignal && (
            <>
              <SignalStatus
                signal={currentSignal.signal}
                interpretation={currentSignal.interpretation}
                isPolling={isPolling}
              />

              {currentSignal.claims.length > 0 && (
                <ClaimsList
                  claims={currentSignal.claims}
                  uncertainties={currentSignal.interpretation?.uncertainties}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
