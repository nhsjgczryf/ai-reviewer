import { generateMockReview } from './mockReview.js';
import { buildPrompt } from './promptBuilder.js';

interface ReviewConfig {
  depth?: string;
  focusAreas?: string[];
  style?: string;
}

interface ReviewResult {
  markdown: string;
  metadata: {
    reviewDepth: string;
    focusAreas: string[];
    timestamp: string;
    linesReviewed: number;
  };
}

type LLMProvider = 'openai' | 'anthropic' | 'mock';

function detectProvider(): { provider: LLMProvider; apiKey: string; baseUrl: string; model: string } {
  const openaiKey = process.env.OPENAI_API_KEY;
  const openaiBase = process.env.OPENAI_BASE_URL || process.env.OPENAI_API_BASE;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.LLM_MODEL || '';

  // LiteLLM proxy or any OpenAI-compatible endpoint
  if (openaiKey && openaiBase) {
    return {
      provider: 'openai',
      apiKey: openaiKey,
      baseUrl: openaiBase.replace(/\/+$/, ''),
      model: model || 'gpt-4',
    };
  }

  // Direct OpenAI API
  if (openaiKey) {
    return {
      provider: 'openai',
      apiKey: openaiKey,
      baseUrl: 'https://api.openai.com',
      model: model || 'gpt-4',
    };
  }

  // Direct Anthropic API
  if (anthropicKey) {
    return {
      provider: 'anthropic',
      apiKey: anthropicKey,
      baseUrl: 'https://api.anthropic.com',
      model: model || 'claude-sonnet-4-5-20250514',
    };
  }

  return { provider: 'mock', apiKey: '', baseUrl: '', model: '' };
}

export function getProviderInfo() {
  const { provider, baseUrl, model } = detectProvider();
  if (provider === 'mock') return 'Mock';
  if (provider === 'openai') return `OpenAI-compatible (${baseUrl}, model: ${model})`;
  return `Anthropic (model: ${model})`;
}

export function getDefaultModel() {
  return detectProvider().model;
}

export async function performReview(
  code: string,
  language: string,
  config: ReviewConfig,
  requestModel?: string,
): Promise<ReviewResult> {
  const detected = detectProvider();
  const model = requestModel || detected.model;

  if (detected.provider === 'openai') {
    return performOpenAIReview(code, language, config, detected.apiKey, detected.baseUrl, model);
  }

  if (detected.provider === 'anthropic') {
    return performAnthropicReview(code, language, config, detected.apiKey, detected.baseUrl, model);
  }

  // Mock mode
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return generateMockReview(code, language, config);
}

function buildReviewResult(markdown: string, code: string, config: ReviewConfig): ReviewResult {
  return {
    markdown,
    metadata: {
      reviewDepth: config.depth || 'standard',
      focusAreas: config.focusAreas || [],
      timestamp: new Date().toISOString(),
      linesReviewed: code.split('\n').length,
    },
  };
}

async function performOpenAIReview(
  code: string,
  language: string,
  config: ReviewConfig,
  apiKey: string,
  baseUrl: string,
  model: string,
): Promise<ReviewResult> {
  const { system, user } = buildPrompt(code, language, config);

  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: 4096,
      temperature: 0,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI-compatible API error: ${response.status} ${err}`);
  }

  const data = await response.json() as {
    choices: { message: { content: string } }[];
  };
  const text = data.choices[0]?.message?.content || '';

  return buildReviewResult(text, code, config);
}

async function performAnthropicReview(
  code: string,
  language: string,
  config: ReviewConfig,
  apiKey: string,
  baseUrl: string,
  model: string,
): Promise<ReviewResult> {
  const { system, user } = buildPrompt(code, language, config);

  const response = await fetch(`${baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
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

  return buildReviewResult(text, code, config);
}
