'use client';

import { useState } from 'react';

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

interface ClaimsListProps {
  claims: Claim[];
  uncertainties?: string[];
  signalId: string;
  onClaimReviewed?: (claimId: string, status: string) => void;
}

const API_URL = 'https://9tq7w39hb2.execute-api.eu-west-2.amazonaws.com/dev';

const strengthColors: Record<string, { bg: string; text: string; border: string }> = {
  weak: { bg: 'bg-orange-900/30', text: 'text-orange-300', border: 'border-orange-700' },
  moderate: { bg: 'bg-yellow-900/30', text: 'text-yellow-300', border: 'border-yellow-700' },
  strong: { bg: 'bg-green-900/30', text: 'text-green-300', border: 'border-green-700' },
};

const statusColors: Record<string, string> = {
  proposed: 'bg-zinc-700',
  accepted: 'bg-green-600',
  rejected: 'bg-red-600',
  challenged: 'bg-amber-600',
};

const claimTypeLabels: Record<string, string> = {
  event_exists: 'Event',
  artist_performs: 'Performance',
  venue_hosts: 'Hosting',
  event_date: 'Date',
  event_time: 'Time',
  artist_exists: 'Artist',
  venue_exists: 'Venue',
  ticket_source: 'Tickets',
};

const claimTypeIcons: Record<string, string> = {
  event_exists: '🎵',
  artist_performs: '🎤',
  venue_hosts: '🏠',
  event_date: '📅',
  event_time: '🕗',
  artist_exists: '👤',
  venue_exists: '📍',
  ticket_source: '🎟️',
};

export function ClaimsList({ claims, uncertainties, signalId, onClaimReviewed }: ClaimsListProps) {
  const [claimStatuses, setClaimStatuses] = useState<Record<string, string>>({});
  const [reviewingClaim, setReviewingClaim] = useState<string | null>(null);
  const [challengeReason, setChallengeReason] = useState('');
  const [showChallengeInput, setShowChallengeInput] = useState<string | null>(null);

  const reviewClaim = async (claimId: string, action: 'accept' | 'reject' | 'challenge', reason?: string) => {
    setReviewingClaim(claimId);
    try {
      const response = await fetch(`${API_URL}/signals/${signalId}/claims/${claimId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      });

      if (response.ok) {
        const result = await response.json();
        setClaimStatuses((prev) => ({ ...prev, [claimId]: result.status }));
        onClaimReviewed?.(claimId, result.status);
        setShowChallengeInput(null);
        setChallengeReason('');
      }
    } catch (error) {
      console.error('Failed to review claim:', error);
    } finally {
      setReviewingClaim(null);
    }
  };

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
      <h2 className="text-xl font-semibold mb-4">
        Claims ({claims.length})
      </h2>

      <div className="space-y-3">
        {claims.map((claim) => {
          const colors = strengthColors[claim.strength];
          const currentStatus = claimStatuses[claim.claimId] || claim.status;
          const isReviewed = currentStatus !== 'proposed';
          const isReviewing = reviewingClaim === claim.claimId;

          return (
            <div
              key={claim.claimId}
              className={`p-4 rounded-lg border ${colors.border} ${colors.bg} ${isReviewed ? 'opacity-75' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">
                      {claimTypeIcons[claim.claimType] || '📋'}
                    </span>
                    <span className="text-sm font-medium text-zinc-400">
                      {claimTypeLabels[claim.claimType] || claim.claimType}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${colors.text} ${colors.bg} border ${colors.border}`}>
                      {claim.strength}
                    </span>
                    {isReviewed && (
                      <span className={`text-xs px-2 py-0.5 rounded-full text-white ${statusColors[currentStatus]}`}>
                        {currentStatus}
                      </span>
                    )}
                  </div>

                  <p className="text-white font-medium">
                    {claim.subject}
                    {claim.predicate && (
                      <span className="text-zinc-400 font-normal mx-2">
                        {claim.predicate.replace(/_/g, ' ')}
                      </span>
                    )}
                    {claim.object && (
                      <span className="text-white">{claim.object}</span>
                    )}
                    {claim.value && (
                      <span className="text-amber-400 ml-2 font-mono">{claim.value}</span>
                    )}
                  </p>

                  <p className="text-sm text-zinc-500 mt-2">
                    {claim.strengthReasoning}
                  </p>

                  {/* Challenge input */}
                  {showChallengeInput === claim.claimId && (
                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={challengeReason}
                        onChange={(e) => setChallengeReason(e.target.value)}
                        placeholder="Why is this wrong?"
                        className="flex-1 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm text-white placeholder-zinc-500"
                      />
                      <button
                        onClick={() => reviewClaim(claim.claimId, 'challenge', challengeReason)}
                        disabled={!challengeReason || isReviewing}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm rounded"
                      >
                        Submit
                      </button>
                      <button
                        onClick={() => { setShowChallengeInput(null); setChallengeReason(''); }}
                        className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {/* Review buttons */}
                {!isReviewed && !showChallengeInput && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => reviewClaim(claim.claimId, 'accept')}
                      disabled={isReviewing}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm rounded"
                    >
                      {isReviewing ? '...' : 'Accept'}
                    </button>
                    <button
                      onClick={() => reviewClaim(claim.claimId, 'reject')}
                      disabled={isReviewing}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm rounded"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => setShowChallengeInput(claim.claimId)}
                      disabled={isReviewing}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm rounded"
                    >
                      Challenge
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {uncertainties && uncertainties.length > 0 && (
        <div className="mt-6 pt-6 border-t border-zinc-800">
          <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
            <span>⚠️</span> Uncertainties
          </h3>
          <ul className="space-y-2">
            {uncertainties.map((uncertainty, i) => (
              <li key={i} className="text-sm text-zinc-500 flex items-start gap-2">
                <span className="text-zinc-600">•</span>
                {uncertainty}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
