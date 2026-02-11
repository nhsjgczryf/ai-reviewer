# AI Code Review Assistant

Structured, actionable code review powered by AI. Transforms LLM understanding into engineering-grade review assets.

## Features

- **Monaco Editor** — syntax highlighting, line numbers, language auto-detection
- **Structured Review Output** — hierarchical: Summary → Architecture → Key Issues → Code Findings → Suggestions
- **Severity Ranking** — Critical / Major / Minor / Nit with color-coded badges
- **Click-to-Highlight** — click any finding to highlight the corresponding code lines
- **Review Configuration** — depth (Quick / Standard / Deep), focus areas, style (Strict / Lenient)
- **Multi-provider LLM** — LiteLLM proxy, OpenAI, Anthropic, or built-in mock mode

## Quick Start

```bash
# Install dependencies
npm install
cd server && npm install && cd ..

# Start both frontend and backend
npm run dev:all
```

Frontend: `http://localhost:5173` | Backend: `http://localhost:3001`

## LLM Provider Configuration

The server auto-detects the provider based on environment variables:

| Provider | Env Vars | Endpoint |
|---|---|---|
| LiteLLM / OpenAI-compatible | `OPENAI_API_KEY` + `OPENAI_BASE_URL` | `{baseUrl}/v1/chat/completions` |
| OpenAI (direct) | `OPENAI_API_KEY` | `api.openai.com/v1/chat/completions` |
| Anthropic (direct) | `ANTHROPIC_API_KEY` | `api.anthropic.com/v1/messages` |
| Mock (no keys) | — | Built-in code analysis |

Use `LLM_MODEL` to override the default model name.

**Example — LiteLLM proxy:**

```bash
OPENAI_BASE_URL=http://localhost:4000 \
OPENAI_API_KEY=sk-xxx \
LLM_MODEL=deepseek/deepseek-chat \
npm run server
```

**Example — Anthropic:**

```bash
ANTHROPIC_API_KEY=sk-ant-xxx npm run server
```

## Project Structure

```
ai-reviewer/
├── src/                          # Frontend (React + Vite + TypeScript)
│   ├── App.tsx                   # Main layout — left/right split panels
│   ├── types/review.ts           # Shared type definitions
│   ├── services/api.ts           # Backend API client
│   └── components/
│       ├── CodeInputPanel.tsx     # Monaco Editor with line highlighting
│       ├── ReviewConfigBar.tsx    # Depth / Focus / Style / Language controls
│       ├── ReviewPanel.tsx        # Structured review result display
│       ├── ReviewSection.tsx      # Collapsible section wrapper
│       └── ReviewItemCard.tsx     # Individual finding card
├── server/                       # Backend (Express + TypeScript)
│   └── src/
│       ├── index.ts              # Express server entry
│       ├── routes/review.ts      # POST /api/review
│       └── services/
│           ├── reviewService.ts   # Provider routing (OpenAI / Anthropic / Mock)
│           ├── promptBuilder.ts   # LLM prompt construction
│           └── mockReview.ts      # Smart mock with static code analysis
├── package.json
└── vite.config.ts
```

## Review Output Schema

Each review item follows this structure:

```json
{
  "level": "architecture | module | function | line",
  "severity": "critical | major | minor | nit",
  "title": "Short conclusion",
  "description": "Problem explanation",
  "codeRange": [startLine, endLine],
  "whyItMatters": "Impact description",
  "suggestion": "Actionable fix"
}
```

The full review result contains five sections:

1. **High-Level Summary** — intent, quality score (1–10), risk overview
2. **Architecture & Design** — modularity, abstraction boundaries, extensibility, tech risks
3. **Key Issues** — ranked by severity
4. **Code-Level Findings** — sorted by line number
5. **Actionable Suggestions** — refactoring, testing, performance & security

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start frontend dev server |
| `npm run server` | Start backend dev server |
| `npm run dev:all` | Start both concurrently |
| `npm run build` | Production build |

## License

MIT
