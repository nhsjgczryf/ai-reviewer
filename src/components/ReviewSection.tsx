import { useState, type ReactNode } from 'react';

interface Props {
  title: string;
  badge?: string | number;
  badgeType?: 'default' | 'critical' | 'major' | 'minor';
  defaultOpen?: boolean;
  children: ReactNode;
}

export default function ReviewSection({
  title,
  badge,
  badgeType = 'default',
  defaultOpen = true,
  children,
}: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`review-section ${isOpen ? 'open' : 'collapsed'}`}>
      <button
        className="review-section-header"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`review-section-chevron ${isOpen ? 'open' : ''}`}>
          &#9656;
        </span>
        <span className="review-section-title">{title}</span>
        {badge !== undefined && (
          <span className={`review-section-badge badge-${badgeType}`}>
            {badge}
          </span>
        )}
      </button>
      {isOpen && <div className="review-section-content">{children}</div>}
    </div>
  );
}
