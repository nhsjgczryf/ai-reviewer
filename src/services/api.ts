import type { ReviewRequest, ReviewResult } from '../types/review';

export async function submitReview(request: ReviewRequest): Promise<ReviewResult> {
  const response = await fetch('/api/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '评审请求失败' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function fetchServerConfig(): Promise<{ defaultModel: string; provider: string }> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) return { defaultModel: '', provider: 'Mock' };
    return res.json();
  } catch {
    return { defaultModel: '', provider: 'Mock' };
  }
}
