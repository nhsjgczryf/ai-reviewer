import type { ReviewResult } from '../types/review';
import ReviewSection from './ReviewSection';
import ReviewItemCard from './ReviewItemCard';

interface Props {
  result: ReviewResult | null;
  isLoading: boolean;
  error: string | null;
  onHighlightCode: (range: [number, number] | null) => void;
  highlightedRange: [number, number] | null;
  isPaper: boolean;
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

function EmptyState({ isPaper }: { isPaper: boolean }) {
  return (
    <div className="review-empty-state">
      <div className="empty-state-icon">&#x2727;</div>
      <h3>准备就绪</h3>
      <p>
        在左侧面板粘贴{isPaper ? '论文' : '代码'}，配置评审偏好，
        然后点击 <strong>开始评审</strong> 获取结构化、可执行的反馈。
      </p>
      <div className="empty-state-features">
        <div className="feature-item">
          <span className="feature-icon">&#x25B8;</span>
          {isPaper
            ? '层次化评审：结构 → 方法论 → 段落 → 语句'
            : '层次化评审：架构 → 模块 → 函数 → 语句'}
        </div>
        <div className="feature-item">
          <span className="feature-icon">&#x25B8;</span>
          点击任意发现项，高亮对应{isPaper ? '段落' : '代码'}
        </div>
        <div className="feature-item">
          <span className="feature-icon">&#x25B8;</span>
          按严重程度排序的问题与可执行建议
        </div>
      </div>
    </div>
  );
}

function LoadingState({ isPaper }: { isPaper: boolean }) {
  return (
    <div className="review-loading-state">
      <div className="loading-spinner-large" />
      <h3>正在分析{isPaper ? '论文' : '代码'}...</h3>
      <p>正在进行结构化多层次评审</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="review-error-state">
      <div className="error-icon">!</div>
      <h3>评审失败</h3>
      <p>{message}</p>
    </div>
  );
}

const DEPTH_LABELS: Record<string, string> = {
  quick: '快速',
  standard: '标准',
  deep: '深度',
};

const FOCUS_LABELS: Record<string, string> = {
  architecture: '架构',
  performance: '性能',
  security: '安全',
  maintainability: '可维护性',
  structure: '结构',
  methodology: '方法论',
  writing: '写作',
  references: '引用',
};

export default function ReviewPanel({
  result,
  isLoading,
  error,
  onHighlightCode,
  highlightedRange,
  isPaper,
}: Props) {
  if (isLoading) return <LoadingState isPaper={isPaper} />;
  if (error) return <ErrorState message={error} />;
  if (!result) return <EmptyState isPaper={isPaper} />;

  const criticalCount = result.issues.filter((i) => i.severity === 'critical').length;
  const majorCount = result.issues.filter((i) => i.severity === 'major').length;

  const isItemHighlighted = (range?: [number, number]) => {
    if (!range || !highlightedRange) return false;
    return range[0] === highlightedRange[0] && range[1] === highlightedRange[1];
  };

  return (
    <div className="review-panel-content">
      {/* 1. 概览 */}
      <ReviewSection title="概览" defaultOpen={true}>
        <div className="summary-section">
          <div className="summary-item">
            <span className="summary-label">{isPaper ? '论文主题' : '代码意图'}</span>
            <p className="summary-value">{result.summary.intent}</p>
          </div>
          <div className="summary-item">
            <span className="summary-label">整体质量</span>
            <div className="summary-quality">
              <QualityScoreBar score={result.summary.qualityScore} />
              <span className="quality-label">{result.summary.qualityLabel}</span>
            </div>
          </div>
          <div className="summary-item">
            <span className="summary-label">风险概览</span>
            <p className="summary-value">{result.summary.riskOverview}</p>
          </div>
        </div>
      </ReviewSection>

      {/* 2. 架构与设计 / 论文结构与逻辑 */}
      <ReviewSection title={isPaper ? '论文结构与逻辑' : '架构与设计'} defaultOpen={true}>
        <div className="architecture-grid">
          <div className="arch-item">
            <span className="arch-label">{isPaper ? '章节结构' : '模块化'}</span>
            <p className="arch-value">{result.architecture.modularity}</p>
          </div>
          <div className="arch-item">
            <span className="arch-label">{isPaper ? '论证逻辑' : '抽象边界'}</span>
            <p className="arch-value">{result.architecture.abstractionBoundaries}</p>
          </div>
          <div className="arch-item">
            <span className="arch-label">{isPaper ? '创新性' : '可扩展性'}</span>
            <p className="arch-value">{result.architecture.extensibility}</p>
          </div>
          <div className="arch-item">
            <span className="arch-label">{isPaper ? '方法论风险' : '技术风险'}</span>
            <p className="arch-value">{result.architecture.techRisks}</p>
          </div>
        </div>
      </ReviewSection>

      {/* 3. 关键问题 */}
      <ReviewSection
        title="关键问题"
        badge={result.issues.length}
        badgeType={criticalCount > 0 ? 'critical' : majorCount > 0 ? 'major' : 'minor'}
        defaultOpen={true}
      >
        {result.issues.length === 0 ? (
          <p className="no-items-message">未发现显著问题。</p>
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

      {/* 4. 代码级/段落级发现 */}
      <ReviewSection
        title={isPaper ? '段落级发现' : '代码级发现'}
        badge={result.codeFindings.length}
        defaultOpen={true}
      >
        {result.codeFindings.length === 0 ? (
          <p className="no-items-message">{isPaper ? '无段落级发现。' : '无代码级发现。'}</p>
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

      {/* 5. 改进建议 */}
      <ReviewSection title="改进建议" defaultOpen={true}>
        <div className="suggestions-section">
          {result.suggestions.refactoring.length > 0 && (
            <div className="suggestion-group">
              <h4 className="suggestion-group-title">{isPaper ? '结构调整' : '重构'}</h4>
              <ul className="suggestion-list">
                {result.suggestions.refactoring.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {result.suggestions.testing.length > 0 && (
            <div className="suggestion-group">
              <h4 className="suggestion-group-title">{isPaper ? '论证补充' : '测试'}</h4>
              <ul className="suggestion-list">
                {result.suggestions.testing.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {result.suggestions.performanceSecurity.length > 0 && (
            <div className="suggestion-group">
              <h4 className="suggestion-group-title">{isPaper ? '写作与引用' : '性能与安全'}</h4>
              <ul className="suggestion-list">
                {result.suggestions.performanceSecurity.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </ReviewSection>

      {/* 元数据 */}
      <div className="review-metadata">
        <span>深度：{DEPTH_LABELS[result.metadata.reviewDepth] || result.metadata.reviewDepth}</span>
        <span>关注：{result.metadata.focusAreas.map((a) => FOCUS_LABELS[a] || a).join('、')}</span>
        <span>行数：{result.metadata.linesReviewed}</span>
        <span>{new Date(result.metadata.timestamp).toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
