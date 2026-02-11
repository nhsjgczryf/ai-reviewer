import { useState, useCallback, useEffect } from 'react';
import type { ReviewConfig, ReviewResult, FocusArea } from './types/review';
import { submitReview, fetchServerConfig } from './services/api';
import CodeInputPanel from './components/CodeInputPanel';
import ReviewConfigBar from './components/ReviewConfigBar';
import ReviewPanel from './components/ReviewPanel';
import './App.css';

const DEFAULT_CODE = `// 在此粘贴代码，或使用以下示例
function processUserData(users) {
  var result = [];
  for (var i = 0; i < users.length; i++) {
    var user = users[i];
    if (user.age > 18) {
      var fullName = user.firstName + " " + user.lastName;
      var data = {
        name: fullName,
        email: user.email,
        age: user.age,
        isAdmin: user.role == "admin",
        password: user.password,
        token: "sk-1234567890abcdef"
      };
      result.push(data);
    }
  }
  return result;
}

async function fetchData(url) {
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

function calculateDiscount(price, discount) {
  if (discount > 100) discount = 100;
  return price - price * discount / 100;
}

class UserService {
  constructor(db) {
    this.db = db;
    this.cache = {};
  }

  getUser(id) {
    if (this.cache[id]) return this.cache[id];
    const user = this.db.query("SELECT * FROM users WHERE id = " + id);
    this.cache[id] = user;
    return user;
  }

  deleteUser(id) {
    this.db.query("DELETE FROM users WHERE id = " + id);
    delete this.cache[id];
  }

  getAllUsers() {
    return this.db.query("SELECT * FROM users");
  }
}`;

const CODE_FOCUS: FocusArea[] = ['architecture', 'security', 'maintainability'];
const PAPER_FOCUS: FocusArea[] = ['structure', 'methodology', 'writing', 'references'];

const DEFAULT_CONFIG: ReviewConfig = {
  depth: 'standard',
  focusAreas: CODE_FOCUS,
  style: 'strict',
};

function isLatexLang(lang: string) {
  return lang === 'latex';
}

export default function App() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [language, setLanguage] = useState('javascript');
  const [config, setConfig] = useState<ReviewConfig>(DEFAULT_CONFIG);
  const [model, setModel] = useState('');
  const [defaultModel, setDefaultModel] = useState('');
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightedRange, setHighlightedRange] = useState<[number, number] | null>(null);

  useEffect(() => {
    fetchServerConfig().then(({ defaultModel: dm }) => {
      setDefaultModel(dm);
    });
  }, []);

  const handleLanguageChange = useCallback((lang: string) => {
    setLanguage(lang);
    // Switch focus areas when toggling between code and paper mode
    if (isLatexLang(lang) && !isLatexLang(language)) {
      setConfig((prev) => ({ ...prev, focusAreas: PAPER_FOCUS }));
    } else if (!isLatexLang(lang) && isLatexLang(language)) {
      setConfig((prev) => ({ ...prev, focusAreas: CODE_FOCUS }));
    }
  }, [language]);

  const handleRunReview = useCallback(async () => {
    if (!code.trim()) return;

    setIsLoading(true);
    setError(null);
    setReviewResult(null);
    setHighlightedRange(null);

    try {
      const result = await submitReview({
        code,
        language,
        config,
        model: model || undefined,
      });
      setReviewResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生未知错误');
    } finally {
      setIsLoading(false);
    }
  }, [code, language, config, model]);

  const handleHighlightCode = useCallback((range: [number, number] | null) => {
    setHighlightedRange(range);
  }, []);

  const isPaper = isLatexLang(language);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-left">
          <h1 className="app-title">
            <span className="app-title-icon">&#x2727;</span>
            AI 代码评审助手
          </h1>
          <span className="app-version">v0.1</span>
        </div>
        <p className="app-subtitle">
          基于 AI 的结构化、可执行的代码与论文评审
        </p>
      </header>

      <ReviewConfigBar
        config={config}
        onConfigChange={setConfig}
        language={language}
        onLanguageChange={handleLanguageChange}
        model={model}
        onModelChange={setModel}
        defaultModel={defaultModel}
        onRunReview={handleRunReview}
        isLoading={isLoading}
        hasCode={code.trim().length > 0}
      />

      <main className="app-main">
        <div className="panel panel-code">
          <div className="panel-header">
            <span className="panel-title">{isPaper ? '论文输入' : '代码输入'}</span>
            <span className="panel-meta">
              {code.split('\n').length} 行
            </span>
          </div>
          <CodeInputPanel
            code={code}
            language={language}
            onChange={setCode}
            highlightedRange={highlightedRange}
          />
        </div>

        <div className="panel-divider" />

        <div className="panel panel-review">
          <div className="panel-header">
            <span className="panel-title">评审结果</span>
            {reviewResult && (
              <span className="panel-meta">
                {reviewResult.issues.length + reviewResult.codeFindings.length} 个发现
              </span>
            )}
          </div>
          <ReviewPanel
            result={reviewResult}
            isLoading={isLoading}
            error={error}
            onHighlightCode={handleHighlightCode}
            highlightedRange={highlightedRange}
            isPaper={isPaper}
          />
        </div>
      </main>
    </div>
  );
}
