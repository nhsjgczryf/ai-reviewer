import type { ReviewConfig, ReviewDepth, FocusArea, ReviewStyle } from '../types/review';

interface Props {
  config: ReviewConfig;
  onConfigChange: (config: ReviewConfig) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
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
];

const DEPTHS: { value: ReviewDepth; label: string; desc: string }[] = [
  { value: 'quick', label: 'Quick', desc: 'Surface-level scan' },
  { value: 'standard', label: 'Standard', desc: 'Balanced review' },
  { value: 'deep', label: 'Deep', desc: 'Thorough analysis' },
];

const FOCUS_AREAS: { value: FocusArea; label: string }[] = [
  { value: 'architecture', label: 'Architecture' },
  { value: 'performance', label: 'Performance' },
  { value: 'security', label: 'Security' },
  { value: 'maintainability', label: 'Maintainability' },
];

const STYLES: { value: ReviewStyle; label: string }[] = [
  { value: 'strict', label: 'Strict' },
  { value: 'lenient', label: 'Lenient' },
];

export default function ReviewConfigBar({
  config,
  onConfigChange,
  language,
  onLanguageChange,
  onRunReview,
  isLoading,
  hasCode,
}: Props) {
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
        <label className="config-label">Language</label>
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
        <label className="config-label">Depth</label>
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
        <label className="config-label">Focus</label>
        <div className="config-toggle-group">
          {FOCUS_AREAS.map((f) => (
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
        <label className="config-label">Style</label>
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
            Analyzing...
          </>
        ) : (
          <>Run Review</>
        )}
      </button>
    </div>
  );
}
