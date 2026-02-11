import type { ReviewResult } from '../types/review';
import ReviewSection from './ReviewSection';
import ReviewItemCard from './ReviewItemCard';

interface Props {
  result: ReviewResult | null;
  isLoading: boolean;
  error: string | null;
  onHighlightCode: (range: [number, number] | null) => void;
  highlightedRange: [number, number] | null;
}

function QualityScoreBar({ score }: { score: number }) {
  const color =
    score >= 7 ? 'var(--quality-good)' :
    score >= 4 ? 'var(--quality-ok)' :
    'var(--quality-bad)';

  return (
    <div className="quality-score-bar">
      <div className="quality-score-track">
        <div
          className="quality-score-fill"
          style={{ width: `${score * 10}%`, backgroundColor: color }}
        />
      </div>
      <span className="quality-score-value" style={{ color }}>{score}/10</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="review-empty-state">
      <div className="empty-state-icon">&#x2727;</div>
      <h3>Ready to Review</h3>
      <p>
        Paste your code in the left panel, configure your review preferences,
        then click <strong>Run Review</strong> to get structured, actionable feedback.
      </p>
      <div className="empty-state-features">
        <div className="feature-item">
          <span className="feature-icon">&#x25B8;</span>
          Hierarchical review: architecture → module → function → line
        </div>
        <div className="feature-item">
          <span className="feature-icon">&#x25B8;</span>
          Click any finding to highlight the relevant code
        </div>
        <div className="feature-item">
          <span className="feature-icon">&#x25B8;</span>
          Severity-ranked issues with actionable suggestions
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="review-loading-state">
      <div className="loading-spinner-large" />
      <h3>Analyzing your code...</h3>
      <p>Performing structured review across all layers</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="review-error-state">
      <div className="error-icon">!</div>
      <h3>Review Failed</h3>
      <p>{message}</p>
    </div>
  );
}

export default function ReviewPanel({
  result,
  isLoading,
  error,
  onHighlightCode,
  highlightedRange,
}: Props) {
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!result) return <EmptyState />;

  const criticalCount = result.issues.filter((i) => i.severity === 'critical').length;
  const majorCount = result.issues.filter((i) => i.severity === 'major').length;

  const isItemHighlighted = (range?: [number, number]) => {
    if (!range || !highlightedRange) return false;
    return range[0] === highlightedRange[0] && range[1] === highlightedRange[1];
  };

  return (
    <div className="review-panel-content">
      {/* 1. High-Level Summary */}
      <ReviewSection title="High-Level Summary" defaultOpen={true}>
        <div className="summary-section">
          <div className="summary-item">
            <span className="summary-label">Code Intent</span>
            <p className="summary-value">{result.summary.intent}</p>
          </div>
          <div className="summary-item">
            <span className="summary-label">Overall Quality</span>
            <div className="summary-quality">
              <QualityScoreBar score={result.summary.qualityScore} />
              <span className="quality-label">{result.summary.qualityLabel}</span>
            </div>
          </div>
          <div className="summary-item">
            <span className="summary-label">Risk Overview</span>
            <p className="summary-value">{result.summary.riskOverview}</p>
          </div>
        </div>
      </ReviewSection>

      {/* 2. Architecture & Design */}
      <ReviewSection title="Architecture & Design" defaultOpen={true}>
        <div className="architecture-grid">
          <div className="arch-item">
            <span className="arch-label">Modularity</span>
            <p className="arch-value">{result.architecture.modularity}</p>
          </div>
          <div className="arch-item">
            <span className="arch-label">Abstraction Boundaries</span>
            <p className="arch-value">{result.architecture.abstractionBoundaries}</p>
          </div>
          <div className="arch-item">
            <span className="arch-label">Extensibility</span>
            <p className="arch-value">{result.architecture.extensibility}</p>
          </div>
          <div className="arch-item">
            <span className="arch-label">Tech Risks</span>
            <p className="arch-value">{result.architecture.techRisks}</p>
          </div>
        </div>
      </ReviewSection>

      {/* 3. Key Issues */}
      <ReviewSection
        title="Key Issues"
        badge={result.issues.length}
        badgeType={criticalCount > 0 ? 'critical' : majorCount > 0 ? 'major' : 'minor'}
        defaultOpen={true}
      >
        {result.issues.length === 0 ? (
          <p className="no-items-message">No significant issues found.</p>
        ) : (
          <div className="review-items-list">
            {result.issues.map((item) => (
              <ReviewItemCard
                key={item.id}
                item={item}
                onHighlightCode={onHighlightCode}
                isHighlighted={isItemHighlighted(item.codeRange)}
              />
            ))}
          </div>
        )}
      </ReviewSection>

      {/* 4. Code-Level Findings */}
      <ReviewSection
        title="Code-Level Findings"
        badge={result.codeFindings.length}
        defaultOpen={true}
      >
        {result.codeFindings.length === 0 ? (
          <p className="no-items-message">No code-level findings.</p>
        ) : (
          <div className="review-items-list">
            {result.codeFindings.map((item) => (
              <ReviewItemCard
                key={item.id}
                item={item}
                onHighlightCode={onHighlightCode}
                isHighlighted={isItemHighlighted(item.codeRange)}
              />
            ))}
          </div>
        )}
      </ReviewSection>

      {/* 5. Actionable Suggestions */}
      <ReviewSection title="Actionable Suggestions" defaultOpen={true}>
        <div className="suggestions-section">
          {result.suggestions.refactoring.length > 0 && (
            <div className="suggestion-group">
              <h4 className="suggestion-group-title">Refactoring</h4>
              <ul className="suggestion-list">
                {result.suggestions.refactoring.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {result.suggestions.testing.length > 0 && (
            <div className="suggestion-group">
              <h4 className="suggestion-group-title">Testing</h4>
              <ul className="suggestion-list">
                {result.suggestions.testing.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {result.suggestions.performanceSecurity.length > 0 && (
            <div className="suggestion-group">
              <h4 className="suggestion-group-title">Performance & Security</h4>
              <ul className="suggestion-list">
                {result.suggestions.performanceSecurity.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </ReviewSection>

      {/* Metadata */}
      <div className="review-metadata">
        <span>Depth: {result.metadata.reviewDepth}</span>
        <span>Focus: {result.metadata.focusAreas.join(', ')}</span>
        <span>Lines: {result.metadata.linesReviewed}</span>
        <span>{new Date(result.metadata.timestamp).toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
