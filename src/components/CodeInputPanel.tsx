import { useRef, useCallback } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

interface Props {
  code: string;
  language: string;
  onChange: (value: string) => void;
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

export default function CodeInputPanel({ code, language, onChange }: Props) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorMount: OnMount = useCallback((editor) => {
    editorRef.current = editor;
  }, []);

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
          glyphMargin: false,
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
