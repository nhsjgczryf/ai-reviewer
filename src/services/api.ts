import type { ReviewRequest, ReviewResult } from '../types/review';

export async function submitReview(request: ReviewRequest): Promise<ReviewResult> {
  const response = await fetch('/api/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Review request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}
