import { useState } from 'react';
import type { ReviewItem } from '../types/review';

interface Props {
  item: ReviewItem;
  onHighlightCode: (range: [number, number] | null) => void;
  isHighlighted: boolean;
}

const SEVERITY_LABELS: Record<string, string> = {
  critical: 'Critical',
  major: 'Major',
  minor: 'Minor',
  nit: 'Nit',
};

const LEVEL_LABELS: Record<string, string> = {
  architecture: 'Architecture',
  module: 'Module',
  function: 'Function',
  line: 'Line',
};

export default function ReviewItemCard({ item, onHighlightCode, isHighlighted }: Props) {
  const [expanded, setExpanded] = useState(false);

  const handleClick = () => {
    if (item.codeRange) {
      onHighlightCode(isHighlighted ? null : item.codeRange);
    }
    setExpanded(!expanded);
  };

  return (
    <div
      className={`review-item-card severity-${item.severity} ${isHighlighted ? 'highlighted' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleClick();
      }}
    >
      <div className="review-item-header">
        <div className="review-item-badges">
          <span className={`severity-badge severity-${item.severity}`}>
            {SEVERITY_LABELS[item.severity]}
          </span>
          <span className="level-badge">{LEVEL_LABELS[item.level]}</span>
          {item.codeRange && (
            <span className="line-badge">
              L{item.codeRange[0]}
              {item.codeRange[1] !== item.codeRange[0] && `–${item.codeRange[1]}`}
            </span>
          )}
        </div>
      </div>

      <h4 className="review-item-title">{item.title}</h4>
      <p className="review-item-description">{item.description}</p>

      {expanded && (
        <div className="review-item-details">
          <div className="review-item-detail">
            <span className="detail-label">Why it matters</span>
            <p className="detail-text">{item.whyItMatters}</p>
          </div>
          <div className="review-item-detail">
            <span className="detail-label">Suggestion</span>
            <p className="detail-text suggestion-text">{item.suggestion}</p>
          </div>
        </div>
      )}

      <div className="review-item-expand-hint">
        {expanded ? 'Click to collapse' : 'Click to expand details'}
      </div>
    </div>
  );
}
