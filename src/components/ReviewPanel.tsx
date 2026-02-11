import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ReviewResult } from '../types/review';

interface Props {
  result: ReviewResult | null;
  isLoading: boolean;
  error: string | null;
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

function EmptyState() {
  return (
    <div className="review-empty-state">
      <div className="empty-state-icon">&#x2727;</div>
      <h3>准备就绪</h3>
      <p>
        在左侧面板粘贴代码或论文，配置评审偏好，
        然后点击 <strong>开始评审</strong> 获取详细的评审反馈。
      </p>
      <div className="empty-state-features">
        <div className="feature-item">
          <span className="feature-icon">&#x25B8;</span>
          层次化评审：架构 → 模块 → 函数 → 语句
        </div>
        <div className="feature-item">
          <span className="feature-icon">&#x25B8;</span>
          按严重程度排序的问题与可执行建议
        </div>
        <div className="feature-item">
          <span className="feature-icon">&#x25B8;</span>
          支持代码评审和学术论文评审
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="review-loading-state">
      <div className="loading-spinner-large" />
      <h3>正在分析...</h3>
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

export default function ReviewPanel({ result, isLoading, error }: Props) {
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!result) return <EmptyState />;

  return (
    <div className="review-panel-content">
      <div className="review-markdown">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {result.markdown}
        </ReactMarkdown>
      </div>

      <div className="review-metadata">
        <span>深度：{DEPTH_LABELS[result.metadata.reviewDepth] || result.metadata.reviewDepth}</span>
        <span>关注：{result.metadata.focusAreas.map((a) => FOCUS_LABELS[a] || a).join('、')}</span>
        <span>行数：{result.metadata.linesReviewed}</span>
        <span>{new Date(result.metadata.timestamp).toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
