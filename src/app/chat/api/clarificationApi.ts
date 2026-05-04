const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.bndy.co.uk';

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
  selectedOptionId: string,
  resolvedBy: string
): Promise<ResolveClarificationResponse> {
  const response = await fetch(`${API_URL}/clarifications/${clarificationId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'resolve',
      selectedOptionId,
      resolvedBy,
    }),
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
  const response = await fetch(`${API_URL}/clarifications/${clarificationId}`, {
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
