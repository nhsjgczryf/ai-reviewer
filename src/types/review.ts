export type ReviewDepth = 'quick' | 'standard' | 'deep';
export type FocusArea =
  | 'architecture' | 'performance' | 'security' | 'maintainability'
  | 'structure' | 'methodology' | 'writing' | 'references';
export type ReviewStyle = 'strict' | 'lenient';

export interface ReviewConfig {
  depth: ReviewDepth;
  focusAreas: FocusArea[];
  style: ReviewStyle;
}

export interface ReviewResult {
  markdown: string;
  metadata: {
    reviewDepth: string;
    focusAreas: string[];
    timestamp: string;
    linesReviewed: number;
  };
}

export interface ReviewRequest {
  code: string;
  language: string;
  config: ReviewConfig;
  model?: string;
}
