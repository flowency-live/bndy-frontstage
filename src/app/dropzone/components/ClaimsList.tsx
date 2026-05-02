'use client';

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
}

const strengthColors: Record<string, { bg: string; text: string; border: string }> = {
  weak: { bg: 'bg-orange-900/30', text: 'text-orange-300', border: 'border-orange-700' },
  moderate: { bg: 'bg-yellow-900/30', text: 'text-yellow-300', border: 'border-yellow-700' },
  strong: { bg: 'bg-green-900/30', text: 'text-green-300', border: 'border-green-700' },
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

export function ClaimsList({ claims, uncertainties }: ClaimsListProps) {
  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
      <h2 className="text-xl font-semibold mb-4">
        Claims ({claims.length})
      </h2>

      <div className="space-y-3">
        {claims.map((claim) => {
          const colors = strengthColors[claim.strength];
          return (
            <div
              key={claim.claimId}
              className={`p-4 rounded-lg border ${colors.border} ${colors.bg}`}
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
                </div>
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
