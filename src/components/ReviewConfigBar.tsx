import type { ReviewConfig, ReviewDepth, FocusArea, ReviewStyle } from '../types/review';

interface Props {
  config: ReviewConfig;
  onConfigChange: (config: ReviewConfig) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
  model: string;
  onModelChange: (model: string) => void;
  defaultModel: string;
  onRunReview: () => void;
  isLoading: boolean;
  hasCode: boolean;
}

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'shell', label: 'Shell' },
  { value: 'sql', label: 'SQL' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'yaml', label: 'YAML' },
  { value: 'latex', label: 'LaTeX (论文)' },
];

const DEPTHS: { value: ReviewDepth; label: string; desc: string }[] = [
  { value: 'quick', label: '快速', desc: '表面扫描' },
  { value: 'standard', label: '标准', desc: '均衡评审' },
  { value: 'deep', label: '深度', desc: '深入分析' },
];

const CODE_FOCUS_AREAS: { value: FocusArea; label: string }[] = [
  { value: 'architecture', label: '架构' },
  { value: 'performance', label: '性能' },
  { value: 'security', label: '安全' },
  { value: 'maintainability', label: '可维护性' },
];

const PAPER_FOCUS_AREAS: { value: FocusArea; label: string }[] = [
  { value: 'structure', label: '结构' },
  { value: 'methodology', label: '方法论' },
  { value: 'writing', label: '写作' },
  { value: 'references', label: '引用' },
];

const STYLES: { value: ReviewStyle; label: string }[] = [
  { value: 'strict', label: '严格' },
  { value: 'lenient', label: '宽松' },
];

const MODEL_OPTIONS = [
  { group: 'OpenAI', models: ['gpt-4', 'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
  { group: 'Anthropic', models: ['claude-sonnet-4-5-20250514', 'claude-opus-4-20250514', 'claude-haiku-4-5-20251001'] },
  { group: 'DeepSeek', models: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'] },
  { group: '其他', models: ['qwen-plus', 'qwen-turbo', 'glm-4', 'llama-3.1-70b'] },
];

export default function ReviewConfigBar({
  config,
  onConfigChange,
  language,
  onLanguageChange,
  model,
  onModelChange,
  defaultModel,
  onRunReview,
  isLoading,
  hasCode,
}: Props) {
  const isPaper = language === 'latex';
  const focusAreas = isPaper ? PAPER_FOCUS_AREAS : CODE_FOCUS_AREAS;

  const toggleFocusArea = (area: FocusArea) => {
    const current = config.focusAreas;
    const updated = current.includes(area)
      ? current.filter((a) => a !== area)
      : [...current, area];
    if (updated.length > 0) {
      onConfigChange({ ...config, focusAreas: updated });
    }
  };

  return (
    <div className="config-bar">
      <div className="config-group">
        <label className="config-label">语言</label>
        <select
          className="config-select"
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      <div className="config-group">
        <label className="config-label">模型</label>
        <select
          className="config-select config-select-model"
          value={model}
          onChange={(e) => onModelChange(e.target.value)}
        >
          <option value="">{defaultModel ? `默认 (${defaultModel})` : '服务端默认'}</option>
          {MODEL_OPTIONS.map((group) => (
            <optgroup key={group.group} label={group.group}>
              {group.models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="config-group">
        <label className="config-label">深度</label>
        <div className="config-toggle-group">
          {DEPTHS.map((d) => (
            <button
              key={d.value}
              className={`config-toggle ${config.depth === d.value ? 'active' : ''}`}
              onClick={() => onConfigChange({ ...config, depth: d.value })}
              title={d.desc}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="config-group">
        <label className="config-label">关注点</label>
        <div className="config-toggle-group">
          {focusAreas.map((f) => (
            <button
              key={f.value}
              className={`config-toggle ${config.focusAreas.includes(f.value) ? 'active' : ''}`}
              onClick={() => toggleFocusArea(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="config-group">
        <label className="config-label">风格</label>
        <div className="config-toggle-group">
          {STYLES.map((s) => (
            <button
              key={s.value}
              className={`config-toggle ${config.style === s.value ? 'active' : ''}`}
              onClick={() => onConfigChange({ ...config, style: s.value })}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <button
        className="run-review-btn"
        onClick={onRunReview}
        disabled={isLoading || !hasCode}
      >
        {isLoading ? (
          <>
            <span className="spinner" />
            分析中...
          </>
        ) : (
          <>开始评审</>
        )}
      </button>
    </div>
  );
}
