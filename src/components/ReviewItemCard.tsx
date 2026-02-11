import { useState } from 'react';
import type { ReviewItem } from '../types/review';

interface Props {
  item: ReviewItem;
  onHighlightCode: (range: [number, number] | null) => void;
  isHighlighted: boolean;
}

const SEVERITY_LABELS: Record<string, string> = {
  critical: '严重',
  major: '重要',
  minor: '次要',
  nit: '建议',
};

const LEVEL_LABELS: Record<string, string> = {
  architecture: '架构',
  module: '模块',
  function: '函数',
  line: '语句',
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
            <span className="detail-label">影响</span>
            <p className="detail-text">{item.whyItMatters}</p>
          </div>
          <div className="review-item-detail">
            <span className="detail-label">建议</span>
            <p className="detail-text suggestion-text">{item.suggestion}</p>
          </div>
        </div>
      )}

      <div className="review-item-expand-hint">
        {expanded ? '点击收起' : '点击展开详情'}
      </div>
    </div>
  );
}
