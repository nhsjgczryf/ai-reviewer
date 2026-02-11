import { generateMockReview } from './mockReview.js';
import { buildPrompt } from './promptBuilder.js';

interface ReviewConfig {
  depth?: string;
  focusAreas?: string[];
  style?: string;
}

export async function performReview(code: string, language: string, config: ReviewConfig) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (apiKey) {
    return performLLMReview(code, language, config, apiKey);
  }

  // Simulate processing time for demo
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return generateMockReview(code, language, config);
}

async function performLLMReview(
  code: string,
  language: string,
  config: ReviewConfig,
  apiKey: string,
) {
  const { system, user } = buildPrompt(code, language, config);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 4096,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error: ${response.status} ${err}`);
  }

  const data = await response.json() as { content: { type: string; text: string }[] };
  const text = data.content[0]?.text || '';

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
  const parsed = JSON.parse(jsonMatch[1]!.trim());

  return parsed;
}
