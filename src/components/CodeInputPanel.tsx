import { useRef, useEffect, useCallback } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

interface Props {
  code: string;
  language: string;
  onChange: (value: string) => void;
  highlightedRange: [number, number] | null;
}

const LANGUAGE_MAP: Record<string, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  java: 'java',
  go: 'go',
  rust: 'rust',
  c: 'c',
  cpp: 'cpp',
  csharp: 'csharp',
  php: 'php',
  ruby: 'ruby',
  swift: 'swift',
  kotlin: 'kotlin',
  scala: 'scala',
  html: 'html',
  css: 'css',
  sql: 'sql',
  shell: 'shell',
  yaml: 'yaml',
  json: 'json',
  xml: 'xml',
  markdown: 'markdown',
  latex: 'latex',
};

export default function CodeInputPanel({ code, language, onChange, highlightedRange }: Props) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef = useRef<editor.IEditorDecorationsCollection | null>(null);

  const handleEditorMount: OnMount = useCallback((editor) => {
    editorRef.current = editor;
    decorationsRef.current = editor.createDecorationsCollection([]);
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    const decorations = decorationsRef.current;
    if (!editor || !decorations) return;

    if (highlightedRange) {
      const [startLine, endLine] = highlightedRange;
      decorations.set([
        {
          range: {
            startLineNumber: startLine,
            startColumn: 1,
            endLineNumber: endLine,
            endColumn: 1000,
          },
          options: {
            isWholeLine: true,
            className: 'highlighted-code-line',
            glyphMarginClassName: 'highlighted-code-glyph',
          },
        },
      ]);
      editor.revealLineInCenter(startLine);
    } else {
      decorations.set([]);
    }
  }, [highlightedRange]);

  const handleChange = useCallback(
    (value: string | undefined) => {
      onChange(value ?? '');
    },
    [onChange],
  );

  return (
    <div className="code-input-panel">
      <Editor
        height="100%"
        language={LANGUAGE_MAP[language] || language}
        value={code}
        onChange={handleChange}
        onMount={handleEditorMount}
        theme="vs-dark"
        options={{
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, Monaco, monospace",
          lineNumbers: 'on',
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          padding: { top: 12 },
          glyphMargin: true,
          folding: true,
          renderLineHighlight: 'line',
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          bracketPairColorization: { enabled: true },
        }}
      />
    </div>
  );
}
