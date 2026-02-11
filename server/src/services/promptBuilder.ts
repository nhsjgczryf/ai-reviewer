interface ReviewConfig {
  depth?: string;
  focusAreas?: string[];
  style?: string;
}

export function buildPrompt(code: string, language: string, config: ReviewConfig) {
  if (language === 'latex') {
    return buildPaperPrompt(code, config);
  }
  return buildCodePrompt(code, language, config);
}

function buildCodePrompt(code: string, language: string, config: ReviewConfig) {
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
Please respond in Chinese (中文).

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

${RESPONSE_SCHEMA(config)}`;

  const user = `Review this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``;

  return { system, user };
}

function buildPaperPrompt(code: string, config: ReviewConfig) {
  const depthInstruction = {
    quick: 'Perform a quick review focusing on major structural and logical issues only.',
    standard: 'Perform a balanced review covering structure, methodology, writing quality, and references.',
    deep: 'Perform an exhaustive review analyzing every aspect: logical rigor, novelty, writing clarity, experimental design, and citation completeness.',
  }[config.depth || 'standard'];

  const focusMap: Record<string, string> = {
    structure: 'paper structure and section organization',
    methodology: 'research methodology and experimental design',
    writing: 'writing quality, clarity, and grammar',
    references: 'citations, references, and related work coverage',
  };

  const focusInstruction = config.focusAreas?.length
    ? `Pay special attention to: ${config.focusAreas.map((a) => focusMap[a] || a).join(', ')}.`
    : '';

  const styleInstruction = config.style === 'lenient'
    ? 'Be lenient - only flag significant issues that would affect publication.'
    : 'Be thorough and strict, as if reviewing for a top-tier venue.';

  const system = `You are a senior academic reviewer performing a structured review of a LaTeX paper/manuscript.
Please respond in Chinese (中文).

RULES:
- First understand the paper's research topic and contribution
- Provide a hierarchical review (overall structure → sections → paragraphs → sentences)
- Focus on substance: logical rigor, novelty, methodology soundness, writing clarity
- Every issue MUST be actionable with a concrete suggestion for improvement
- Prioritize issues that affect the paper's acceptance/quality over minor formatting
- Clearly distinguish: Logical Error / Methodological Issue / Writing Issue / Citation Issue

${depthInstruction}
${focusInstruction}
${styleInstruction}

For the JSON response, use these mappings:
- "architecture" section → paper structure and logic analysis
- "modularity" → section organization
- "abstractionBoundaries" → argument logic and flow
- "extensibility" → novelty and contribution
- "techRisks" → methodological risks
- issue levels: "architecture"=overall, "module"=section, "function"=paragraph, "line"=sentence
- suggestions.refactoring → structural improvements
- suggestions.testing → additional experiments/evidence needed
- suggestions.performanceSecurity → writing and citation improvements

${RESPONSE_SCHEMA(config)}`;

  const user = `Review this academic paper/manuscript:\n\n\`\`\`latex\n${code}\n\`\`\``;

  return { system, user };
}

function RESPONSE_SCHEMA(config: ReviewConfig) {
  return `You MUST respond with a single JSON object (no markdown, no explanation) matching this exact schema:
{
  "summary": {
    "intent": "string - what the code/paper is about",
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
}
