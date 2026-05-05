const SIGNALS_API_URL =
  process.env.NEXT_PUBLIC_SIGNALS_API_URL ||
  'https://9tq7w39hb2.execute-api.eu-west-2.amazonaws.com/dev';

export interface ResolveClarificationResponse {
  success: boolean;
  resolution?: string;
  error?: string;
}

export interface DismissClarificationResponse {
  success: boolean;
  error?: string;
}

export async function resolveClarification(
  clarificationId: string,
  selectedOptionIdOrValue: string,
  resolvedBy: string,
  isFreeform = false
): Promise<ResolveClarificationResponse> {
  const body: Record<string, string> = {
    action: 'resolve',
    resolvedBy,
  };

  if (isFreeform) {
    body.freeformValue = selectedOptionIdOrValue;
  } else {
    body.selectedOptionId = selectedOptionIdOrValue;
  }

  const response = await fetch(`${SIGNALS_API_URL}/clarifications/${clarificationId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      error: errorData.error || `Failed to resolve clarification (${response.status})`,
    };
  }

  return response.json();
}

export async function dismissClarification(
  clarificationId: string,
  dismissedBy: string,
  reason?: string
): Promise<DismissClarificationResponse> {
  const response = await fetch(`${SIGNALS_API_URL}/clarifications/${clarificationId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'dismiss',
      dismissedBy,
      reason,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      error: errorData.error || `Failed to dismiss clarification (${response.status})`,
    };
  }

  return response.json();
}
