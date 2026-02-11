export type ReviewLevel = 'architecture' | 'module' | 'function' | 'line';
export type Severity = 'critical' | 'major' | 'minor' | 'nit';
export type ReviewDepth = 'quick' | 'standard' | 'deep';
export type FocusArea =
  | 'architecture' | 'performance' | 'security' | 'maintainability'
  | 'structure' | 'methodology' | 'writing' | 'references';
export type ReviewStyle = 'strict' | 'lenient';

export interface ReviewItem {
  id: string;
  level: ReviewLevel;
  severity: Severity;
  title: string;
  description: string;
  codeRange?: [number, number];
  whyItMatters: string;
  suggestion: string;
}

export interface ReviewSummary {
  intent: string;
  qualityScore: number;
  qualityLabel: string;
  riskOverview: string;
}

export interface ArchitectureReview {
  modularity: string;
  abstractionBoundaries: string;
  extensibility: string;
  techRisks: string;
}

export interface ReviewSuggestions {
  refactoring: string[];
  testing: string[];
  performanceSecurity: string[];
}

export interface ReviewMetadata {
  reviewDepth: ReviewDepth;
  focusAreas: FocusArea[];
  timestamp: string;
  linesReviewed: number;
}

export interface ReviewResult {
  summary: ReviewSummary;
  architecture: ArchitectureReview;
  issues: ReviewItem[];
  codeFindings: ReviewItem[];
  suggestions: ReviewSuggestions;
  metadata: ReviewMetadata;
}

export interface ReviewConfig {
  depth: ReviewDepth;
  focusAreas: FocusArea[];
  style: ReviewStyle;
}

export interface ReviewRequest {
  code: string;
  language: string;
  config: ReviewConfig;
  model?: string;
}
