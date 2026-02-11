interface ReviewConfig {
  depth?: string;
  focusAreas?: string[];
  style?: string;
}

interface CodeAnalysis {
  lineCount: number;
  functions: { name: string; startLine: number; endLine: number }[];
  classes: { name: string; startLine: number; endLine: number }[];
  hasErrorHandling: boolean;
  hasTodos: boolean;
  hasConsoleLog: boolean;
  hasHardcodedSecrets: boolean;
  hasSqlInjection: boolean;
  hasEqualityIssues: boolean;
  hasVarDeclarations: boolean;
  hasNoResponseCheck: boolean;
  longFunctions: { name: string; startLine: number; endLine: number; length: number }[];
}

function analyzeCode(code: string, language: string): CodeAnalysis {
  const lines = code.split('\n');
  const lineCount = lines.length;

  // Find functions
  const functions: CodeAnalysis['functions'] = [];
  const funcPatterns: Record<string, RegExp> = {
    javascript: /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\(.*\)\s*=>))/,
    typescript: /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\(.*\)\s*=>))/,
    python: /^\s*(?:async\s+)?def\s+(\w+)/,
    java: /(?:public|private|protected|static|\s)+[\w<>\[\]]+\s+(\w+)\s*\(/,
    go: /^func\s+(?:\(\w+\s+\*?\w+\)\s+)?(\w+)/,
    rust: /^\s*(?:pub\s+)?fn\s+(\w+)/,
  };

  const pattern = funcPatterns[language] || funcPatterns.javascript;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(pattern);
    if (match) {
      const name = match[1] || match[2] || 'anonymous';
      // Estimate function end by finding matching closing brace or next function
      let endLine = i + 1;
      let braceCount = 0;
      let started = false;
      for (let j = i; j < lines.length; j++) {
        for (const ch of lines[j]) {
          if (ch === '{') { braceCount++; started = true; }
          if (ch === '}') braceCount--;
        }
        if (started && braceCount <= 0) { endLine = j + 1; break; }
        if (j === lines.length - 1) endLine = j + 1;
      }
      functions.push({ name, startLine: i + 1, endLine });
    }
  }

  // Find classes
  const classes: CodeAnalysis['classes'] = [];
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/class\s+(\w+)/);
    if (match) {
      let endLine = i + 1;
      let braceCount = 0;
      let started = false;
      for (let j = i; j < lines.length; j++) {
        for (const ch of lines[j]) {
          if (ch === '{') { braceCount++; started = true; }
          if (ch === '}') braceCount--;
        }
        if (started && braceCount <= 0) { endLine = j + 1; break; }
        if (j === lines.length - 1) endLine = j + 1;
      }
      classes.push({ name: match[1], startLine: i + 1, endLine });
    }
  }

  // Detect patterns
  const hasErrorHandling = /try\s*\{|\.catch\(|except\s|rescue\s/.test(code);
  const hasTodos = /TODO|FIXME|HACK|XXX/.test(code);
  const hasConsoleLog = /console\.(log|debug|info|warn)\s*\(/.test(code);
  const hasHardcodedSecrets = /["'](sk-|api[_-]?key|password|secret|token)[^"']*["']/i.test(code);
  const hasSqlInjection = /["'`]SELECT\s.*\+\s*\w|["'`]DELETE\s.*\+\s*\w|["'`]INSERT\s.*\+\s*\w|["'`]UPDATE\s.*\+\s*\w/i.test(code);
  const hasEqualityIssues = /[^!=]==[^=]/.test(code) && !/===/.test(code.replace(/==[^=]/g, ''));
  const hasVarDeclarations = /\bvar\s+/.test(code);
  const hasNoResponseCheck = /await\s+fetch\(/.test(code) && !/\.ok\b|\.status\b/.test(code);

  const longFunctions = functions.filter(
    (f) => f.endLine - f.startLine > 20,
  ).map((f) => ({ ...f, length: f.endLine - f.startLine }));

  return {
    lineCount,
    functions,
    classes,
    hasErrorHandling,
    hasTodos,
    hasConsoleLog,
    hasHardcodedSecrets,
    hasSqlInjection,
    hasEqualityIssues,
    hasVarDeclarations,
    hasNoResponseCheck,
    longFunctions,
  };
}

let idCounter = 0;
function nextId(prefix: string) {
  return `${prefix}-${++idCounter}`;
}

export function generateMockReview(code: string, language: string, config: ReviewConfig) {
  idCounter = 0;
  const analysis = analyzeCode(code, language);
  interface ReviewIssue {
    id: string;
    level: string;
    severity: string;
    title: string;
    description: string;
    codeRange?: [number, number];
    whyItMatters: string;
    suggestion: string;
  }
  const issues: ReviewIssue[] = [];
  const codeFindings: ReviewIssue[] = [];

  // --- Generate issues based on analysis ---

  // SQL Injection
  if (analysis.hasSqlInjection) {
    const sqlLine = findLineWith(code, /["'`](?:SELECT|DELETE|INSERT|UPDATE)\s/i);
    issues.push({
      id: nextId('issue'),
      level: 'function',
      severity: 'critical',
      title: 'SQL Injection Vulnerability',
      description: 'SQL queries are built using string concatenation with user-supplied values, making them vulnerable to SQL injection attacks.',
      codeRange: sqlLine ? [sqlLine, sqlLine + 2] as [number, number] : undefined,
      whyItMatters: 'An attacker can execute arbitrary SQL commands, potentially reading, modifying, or deleting all database data. This is consistently ranked as a top security vulnerability (OWASP Top 10).',
      suggestion: 'Use parameterized queries or prepared statements. For example: db.query("SELECT * FROM users WHERE id = ?", [id])',
    });
  }

  // Hardcoded secrets
  if (analysis.hasHardcodedSecrets) {
    const secretLine = findLineWith(code, /["'](sk-|api[_-]?key|password|secret|token)/i);
    issues.push({
      id: nextId('issue'),
      level: 'line',
      severity: 'critical',
      title: 'Hardcoded Secrets in Source Code',
      description: 'API keys, tokens, or passwords are hardcoded directly in the source code.',
      codeRange: secretLine ? [secretLine, secretLine] as [number, number] : undefined,
      whyItMatters: 'Secrets in source code can be exposed through version control, logs, or error messages. If the repository is ever made public, all secrets are immediately compromised.',
      suggestion: 'Move secrets to environment variables or a secret management service. Use process.env.API_KEY or a .env file (excluded from version control).',
    });
  }

  // No error handling on fetch
  if (analysis.hasNoResponseCheck) {
    const fetchLine = findLineWith(code, /await\s+fetch\(/);
    issues.push({
      id: nextId('issue'),
      level: 'function',
      severity: 'major',
      title: 'No Error Handling for HTTP Requests',
      description: 'The fetch call does not check the response status or handle network errors. Failed requests will silently return invalid data.',
      codeRange: fetchLine ? [fetchLine, fetchLine + 2] as [number, number] : undefined,
      whyItMatters: 'In production, network requests fail regularly. Without error handling, the application will crash or produce incorrect results with no indication of what went wrong.',
      suggestion: 'Add response status checking: if (!response.ok) throw new Error(`HTTP ${response.status}`); Wrap in try/catch for network errors.',
    });
  }

  // Loose equality
  if (analysis.hasEqualityIssues) {
    const eqLine = findLineWith(code, /[^!=]==[^=]/);
    issues.push({
      id: nextId('issue'),
      level: 'line',
      severity: 'major',
      title: 'Loose Equality Comparison (==)',
      description: 'Using == instead of === for comparison. Loose equality performs type coercion which can lead to unexpected behavior.',
      codeRange: eqLine ? [eqLine, eqLine] as [number, number] : undefined,
      whyItMatters: 'Type coercion bugs are subtle and hard to debug. For example, "0" == false is true, null == undefined is true. These can cause logic errors in authentication and authorization checks.',
      suggestion: 'Use strict equality (===) for all comparisons. Configure ESLint rule "eqeqeq" to enforce this automatically.',
    });
  }

  // var declarations
  if (analysis.hasVarDeclarations) {
    const varLine = findLineWith(code, /\bvar\s+/);
    issues.push({
      id: nextId('issue'),
      level: 'line',
      severity: 'minor',
      title: 'Using var Instead of const/let',
      description: 'The code uses var declarations which have function-scoped (not block-scoped) behavior and can lead to hoisting issues.',
      codeRange: varLine ? [varLine, varLine] as [number, number] : undefined,
      whyItMatters: 'var declarations are hoisted and function-scoped, which can cause bugs in loops and conditional blocks. Modern JavaScript should use const (default) or let (when reassignment is needed).',
      suggestion: 'Replace all var with const (for values that don\'t change) or let (for values that are reassigned). This is standard practice in modern JavaScript.',
    });
  }

  // No error handling general
  if (!analysis.hasErrorHandling && analysis.functions.length > 1) {
    issues.push({
      id: nextId('issue'),
      level: 'architecture',
      severity: 'major',
      title: 'No Error Handling Strategy',
      description: 'The code has no try/catch blocks or error handling patterns. All operations assume success.',
      codeRange: undefined,
      whyItMatters: 'Without error handling, any runtime error will crash the application. Database operations, network calls, and user input parsing are all prone to failure.',
      suggestion: 'Add try/catch blocks around I/O operations. Define a consistent error handling strategy: either throw custom errors or return Result types.',
    });
  }

  // Long functions
  for (const fn of analysis.longFunctions) {
    issues.push({
      id: nextId('issue'),
      level: 'function',
      severity: 'minor',
      title: `Function "${fn.name}" is too long (${fn.length} lines)`,
      description: `The function spans ${fn.length} lines, making it harder to understand, test, and maintain.`,
      codeRange: [fn.startLine, fn.endLine] as [number, number],
      whyItMatters: 'Long functions tend to have multiple responsibilities, making them harder to test in isolation and more likely to contain bugs.',
      suggestion: `Break "${fn.name}" into smaller, focused helper functions. Each function should ideally do one thing and be under 20 lines.`,
    });
  }

  // Console.log
  if (analysis.hasConsoleLog) {
    const logLine = findLineWith(code, /console\.(log|debug|info)\s*\(/);
    codeFindings.push({
      id: nextId('finding'),
      level: 'line',
      severity: 'nit',
      title: 'Console.log Statements Present',
      description: 'Debug logging statements found in the code.',
      codeRange: logLine ? [logLine, logLine] as [number, number] : undefined,
      whyItMatters: 'Console.log statements in production can leak sensitive information and clutter output.',
      suggestion: 'Remove debug logs or replace with a proper logging library that supports log levels.',
    });
  }

  // Generate code-level findings for each function
  for (const fn of analysis.functions) {
    if (fn.endLine - fn.startLine < 3) continue;

    const fnCode = code.split('\n').slice(fn.startLine - 1, fn.endLine).join('\n');

    // Check for missing input validation
    if (/function\s+\w+\s*\(/.test(fnCode) && !/if\s*\(.*(?:typeof|instanceof|!|===|null|undefined)/.test(fnCode) && fn.endLine - fn.startLine > 5) {
      codeFindings.push({
        id: nextId('finding'),
        level: 'function',
        severity: 'minor',
        title: `No input validation in "${fn.name}"`,
        description: `Function "${fn.name}" accepts parameters but does not validate them before use.`,
        codeRange: [fn.startLine, Math.min(fn.startLine + 2, fn.endLine)] as [number, number],
        whyItMatters: 'Without input validation, the function can receive unexpected types or values, leading to runtime errors or incorrect behavior.',
        suggestion: `Add parameter validation at the start of "${fn.name}". Check for null/undefined, correct types, and valid ranges.`,
      });
    }
  }

  // Password/sensitive data exposure
  if (/password|secret|token/i.test(code) && /push|return|send|response|res\./i.test(code)) {
    const passLine = findLineWith(code, /password|secret/i);
    codeFindings.push({
      id: nextId('finding'),
      level: 'function',
      severity: 'major',
      title: 'Sensitive Data Exposure Risk',
      description: 'Sensitive fields (password, secret, token) appear to be included in output data without being filtered.',
      codeRange: passLine ? [passLine, passLine + 1] as [number, number] : undefined,
      whyItMatters: 'Returning sensitive fields like passwords in API responses is a data breach risk, even if the API is "internal".',
      suggestion: 'Explicitly exclude sensitive fields from output. Use a DTO/serializer pattern to control which fields are exposed.',
    });
  }

  // Sort issues by severity
  const severityOrder = { critical: 0, major: 1, minor: 2, nit: 3 };
  issues.sort((a, b) => severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder]);

  // Sort code findings by line number
  codeFindings.sort((a, b) => (a.codeRange?.[0] ?? 0) - (b.codeRange?.[0] ?? 0));

  // Quality score
  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const majorCount = issues.filter((i) => i.severity === 'major').length;
  const minorCount = issues.filter((i) => i.severity === 'minor').length;

  let qualityScore = 10 - criticalCount * 3 - majorCount * 1.5 - minorCount * 0.5;
  qualityScore = Math.max(1, Math.min(10, Math.round(qualityScore)));

  const qualityLabel =
    qualityScore >= 8 ? 'Good' :
    qualityScore >= 6 ? 'Acceptable' :
    qualityScore >= 4 ? 'Needs Improvement' :
    'Poor';

  // Determine intent
  const intent = inferIntent(code, analysis);

  // Risk overview
  const risks: string[] = [];
  if (criticalCount > 0) risks.push(`${criticalCount} critical security issue${criticalCount > 1 ? 's' : ''}`);
  if (majorCount > 0) risks.push(`${majorCount} major issue${majorCount > 1 ? 's' : ''}`);
  if (!analysis.hasErrorHandling) risks.push('no error handling');
  const riskOverview = risks.length > 0
    ? `Key risks: ${risks.join(', ')}. The code requires significant hardening before production use.`
    : 'No critical risks detected. Code is reasonably structured.';

  return {
    summary: {
      intent,
      qualityScore,
      qualityLabel,
      riskOverview,
    },
    architecture: {
      modularity: analysis.classes.length > 0
        ? `Code uses ${analysis.classes.length} class(es) and ${analysis.functions.length} standalone function(s). Consider whether class-based organization is the right abstraction for this use case.`
        : `Code contains ${analysis.functions.length} function(s) at the top level. Functions are loosely coupled but lack a clear module boundary or dependency management.`,
      abstractionBoundaries: analysis.functions.length > 3
        ? 'Multiple functions exist but lack clear layering. Data access, business logic, and data transformation are mixed together.'
        : 'Simple structure with few abstractions. Appropriate for the current complexity level.',
      extensibility: analysis.classes.length > 0
        ? 'Class-based structure provides some extensibility, but tight coupling to specific implementations (e.g., direct DB queries) limits flexibility.'
        : 'Functional structure is straightforward but would need refactoring to support new features like caching, logging, or alternative data sources.',
      techRisks: analysis.hasSqlInjection
        ? 'Direct SQL string concatenation is a critical security anti-pattern. No ORM or query builder is used.'
        : analysis.hasHardcodedSecrets
          ? 'Hardcoded credentials/secrets pose a significant deployment and security risk.'
          : 'No major technical architecture risks for the current scope. Consider adding proper dependency injection as the codebase grows.',
    },
    issues,
    codeFindings,
    suggestions: {
      refactoring: generateRefactoringSuggestions(analysis),
      testing: generateTestingSuggestions(analysis),
      performanceSecurity: generatePerfSecSuggestions(analysis),
    },
    metadata: {
      reviewDepth: config.depth || 'standard',
      focusAreas: config.focusAreas || [],
      timestamp: new Date().toISOString(),
      linesReviewed: analysis.lineCount,
    },
  };
}

function findLineWith(code: string, pattern: RegExp): number | null {
  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (pattern.test(lines[i])) return i + 1;
  }
  return null;
}

function inferIntent(code: string, analysis: CodeAnalysis): string {
  const parts: string[] = [];

  if (analysis.classes.length > 0) {
    parts.push(`defines ${analysis.classes.map((c) => c.name).join(', ')} class${analysis.classes.length > 1 ? 'es' : ''}`);
  }
  if (analysis.functions.length > 0) {
    const fnNames = analysis.functions.slice(0, 3).map((f) => f.name);
    parts.push(`implements ${fnNames.join(', ')}${analysis.functions.length > 3 ? ` and ${analysis.functions.length - 3} more functions` : ''}`);
  }

  if (/fetch|http|request|api/i.test(code)) parts.push('with HTTP/API integration');
  if (/query|SELECT|INSERT|UPDATE|DELETE/i.test(code)) parts.push('with database operations');
  if (/user|auth|login|password/i.test(code)) parts.push('for user data management');

  if (parts.length === 0) return `A ${analysis.lineCount}-line ${code.includes('class') ? 'object-oriented' : 'procedural'} code module.`;

  return `This code ${parts.join(', ')}. It appears to be a utility/service layer handling data processing and persistence.`;
}

function generateRefactoringSuggestions(analysis: CodeAnalysis): string[] {
  const suggestions: string[] = [];

  if (analysis.longFunctions.length > 0) {
    suggestions.push(`Extract helper functions from ${analysis.longFunctions.map((f) => f.name).join(', ')} to reduce complexity.`);
  }
  if (analysis.classes.length > 0 && analysis.hasSqlInjection) {
    suggestions.push('Introduce a repository/DAO pattern to separate data access from business logic.');
  }
  if (analysis.functions.length > 3) {
    suggestions.push('Group related functions into modules or classes with clear interfaces.');
  }
  if (analysis.hasVarDeclarations) {
    suggestions.push('Modernize variable declarations: replace all var with const/let.');
  }

  if (suggestions.length === 0) {
    suggestions.push('Code structure is reasonable for the current size. Keep functions focused and small as the codebase grows.');
  }

  return suggestions;
}

function generateTestingSuggestions(analysis: CodeAnalysis): string[] {
  const suggestions: string[] = [];

  for (const fn of analysis.functions.slice(0, 3)) {
    suggestions.push(`Write unit tests for ${fn.name}() covering happy path, edge cases, and error scenarios.`);
  }

  if (analysis.hasSqlInjection) {
    suggestions.push('Add integration tests that verify SQL injection prevention with malicious input.');
  }

  if (!analysis.hasErrorHandling) {
    suggestions.push('Test error paths: network failures, invalid input, empty data sets.');
  }

  return suggestions;
}

function generatePerfSecSuggestions(analysis: CodeAnalysis): string[] {
  const suggestions: string[] = [];

  if (analysis.hasSqlInjection) {
    suggestions.push('CRITICAL: Migrate all SQL queries to use parameterized statements immediately.');
  }
  if (analysis.hasHardcodedSecrets) {
    suggestions.push('CRITICAL: Remove all hardcoded secrets and use environment variables.');
  }
  if (analysis.hasNoResponseCheck) {
    suggestions.push('Add timeout and retry logic for HTTP requests. Implement circuit breaker pattern for external dependencies.');
  }
  if (analysis.classes.some((c) => /cache/i.test(c.name))) {
    suggestions.push('Consider cache eviction strategy and memory limits to prevent unbounded memory growth.');
  }

  if (suggestions.length === 0) {
    suggestions.push('No critical performance or security issues detected. Consider adding rate limiting for any public-facing endpoints.');
  }

  return suggestions;
}
