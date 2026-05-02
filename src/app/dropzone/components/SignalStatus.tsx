'use client';

interface Signal {
  signalId: string;
  status: string;
  signalType: string;
  receivedAt: string;
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
}

interface SignalStatusProps {
  signal: Signal;
  interpretation?: Interpretation;
  isPolling: boolean;
}

const statusColors: Record<string, string> = {
  received: 'bg-blue-500',
  extracting: 'bg-yellow-500',
  interpreting: 'bg-yellow-500',
  pending_review: 'bg-green-500',
  failed: 'bg-red-500',
};

const statusLabels: Record<string, string> = {
  received: 'Signal Received',
  extracting: 'Extracting Content...',
  interpreting: 'Interpreting...',
  pending_review: 'Ready for Review',
  failed: 'Failed',
};

export function SignalStatus({ signal, interpretation, isPolling }: SignalStatusProps) {
  const formatCost = (cost: number) => `$${cost.toFixed(4)}`;
  const formatTime = (ms: number) => `${(ms / 1000).toFixed(2)}s`;

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${statusColors[signal.status] || 'bg-zinc-500'} ${isPolling ? 'animate-pulse' : ''}`} />
          <span className="font-medium">
            {statusLabels[signal.status] || signal.status}
          </span>
        </div>
        <code className="text-sm text-zinc-500 font-mono">{signal.signalId}</code>
      </div>

      {interpretation && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-zinc-400 mb-1">Interpretation</h3>
            <p className="text-zinc-300">{interpretation.llmInterpretation.reasoning}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-zinc-800 rounded-lg">
            <div>
              <p className="text-xs text-zinc-500 uppercase">Model</p>
              <p className="text-sm font-mono text-zinc-300">
                {interpretation.llmInterpretation.modelUsed.split('.').pop()?.replace(/-/g, ' ') || 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase">Cost</p>
              <p className="text-sm font-mono text-green-400">
                {formatCost(interpretation.sourceCost.modelCost)}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase">Tokens</p>
              <p className="text-sm font-mono text-zinc-300">
                {interpretation.sourceCost.tokensIn} in / {interpretation.sourceCost.tokensOut} out
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase">Time</p>
              <p className="text-sm font-mono text-zinc-300">
                {formatTime(interpretation.sourceCost.runtimeMs)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
