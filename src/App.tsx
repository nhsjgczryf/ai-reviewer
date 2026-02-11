import { useState, useCallback } from 'react';
import type { ReviewConfig, ReviewResult } from './types/review';
import { submitReview } from './services/api';
import CodeInputPanel from './components/CodeInputPanel';
import ReviewConfigBar from './components/ReviewConfigBar';
import ReviewPanel from './components/ReviewPanel';
import './App.css';

const DEFAULT_CODE = `// Paste your code here or try the example below
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

const DEFAULT_CONFIG: ReviewConfig = {
  depth: 'standard',
  focusAreas: ['architecture', 'security', 'maintainability'],
  style: 'strict',
};

export default function App() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [language, setLanguage] = useState('javascript');
  const [config, setConfig] = useState<ReviewConfig>(DEFAULT_CONFIG);
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightedRange, setHighlightedRange] = useState<[number, number] | null>(null);

  const handleRunReview = useCallback(async () => {
    if (!code.trim()) return;

    setIsLoading(true);
    setError(null);
    setReviewResult(null);
    setHighlightedRange(null);

    try {
      const result = await submitReview({ code, language, config });
      setReviewResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [code, language, config]);

  const handleHighlightCode = useCallback((range: [number, number] | null) => {
    setHighlightedRange(range);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-left">
          <h1 className="app-title">
            <span className="app-title-icon">&#x2727;</span>
            AI Code Review Assistant
          </h1>
          <span className="app-version">v0.1</span>
        </div>
        <p className="app-subtitle">
          Structured, actionable code review powered by AI
        </p>
      </header>

      <ReviewConfigBar
        config={config}
        onConfigChange={setConfig}
        language={language}
        onLanguageChange={setLanguage}
        onRunReview={handleRunReview}
        isLoading={isLoading}
        hasCode={code.trim().length > 0}
      />

      <main className="app-main">
        <div className="panel panel-code">
          <div className="panel-header">
            <span className="panel-title">Code Input</span>
            <span className="panel-meta">
              {code.split('\n').length} lines
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
            <span className="panel-title">Review Results</span>
            {reviewResult && (
              <span className="panel-meta">
                {reviewResult.issues.length + reviewResult.codeFindings.length} findings
              </span>
            )}
          </div>
          <ReviewPanel
            result={reviewResult}
            isLoading={isLoading}
            error={error}
            onHighlightCode={handleHighlightCode}
            highlightedRange={highlightedRange}
          />
        </div>
      </main>
    </div>
  );
}
