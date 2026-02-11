interface ReviewConfig {
  depth?: string;
  focusAreas?: string[];
  style?: string;
}

export function buildPrompt(code: string, language: string, config: ReviewConfig) {
  const depthInstruction = {
    quick: 'Perform a quick, surface-level review focusing on critical issues only.',
    standard: 'Perform a balanced review covering all severity levels.',
    deep: 'Perform an exhaustive, deep review analyzing every aspect thoroughly.',
  }[config.depth || 'standard'];

  const focusInstruction = config.focusAreas?.length
    ? `Pay special attention to: ${config.focusAreas.join(', ')}.`
    : '';

  const styleInstruction = config.style === 'lenient'
    ? 'Be lenient - only flag clear bugs and significant design issues. Skip minor style concerns.'
    : 'Be thorough and strict in your review. Flag all issues including minor improvements.';

  const system = `You are a senior software engineer performing a structured code review.

RULES:
- First infer the intent of the code before evaluating implementation
- Provide a hierarchical review (architecture → module → function → line)
- Avoid trivial stylistic comments unless explicitly requested
- Every issue MUST be actionable with a concrete suggestion
- Prioritize issues that "will cause problems" over "could be better"
- Clearly distinguish: Bug / Design Problem / Style Issue

${depthInstruction}
${focusInstruction}
${styleInstruction}

You MUST respond with a single JSON object (no markdown, no explanation) matching this exact schema:
{
  "summary": {
    "intent": "string - what the code is trying to accomplish",
    "qualityScore": number (1-10),
    "qualityLabel": "string - e.g. Good, Needs Improvement, Poor",
    "riskOverview": "string - main risks"
  },
  "architecture": {
    "modularity": "string",
    "abstractionBoundaries": "string",
    "extensibility": "string",
    "techRisks": "string"
  },
  "issues": [
    {
      "id": "string - unique id like issue-1",
      "level": "architecture | module | function | line",
      "severity": "critical | major | minor | nit",
      "title": "string - short conclusion",
      "description": "string - problem explanation",
      "codeRange": [startLine, endLine] or null,
      "whyItMatters": "string - impact",
      "suggestion": "string - actionable fix"
    }
  ],
  "codeFindings": [same schema as issues - but sorted by line number],
  "suggestions": {
    "refactoring": ["string"],
    "testing": ["string"],
    "performanceSecurity": ["string"]
  },
  "metadata": {
    "reviewDepth": "${config.depth || 'standard'}",
    "focusAreas": ${JSON.stringify(config.focusAreas || [])},
    "timestamp": "ISO string",
    "linesReviewed": number
  }
}`;

  const user = `Review this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``;

  return { system, user };
}
