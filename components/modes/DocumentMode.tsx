"use client";

import { useRef, useState, useCallback } from "react";

const INITIAL_TEXT = `PROJECT: Internal Authentication Microservice Refactoring

Overview:
This document outlines the planned refactoring of the authentication service to improve security posture and reduce technical debt.

Architecture Changes:
The new architecture will implement a microservice-based authentication system using JWT tokens with refresh token rotation.

Key Components:
1. Auth Service - Handles login, logout, token generation
2. Token Service - Manages JWT creation, validation, rotation
3. User Service - User profile management and permissions
4. Session Store - Redis-based session management

Security Improvements:
- Implement rate limiting on login endpoints
- Add IP-based anomaly detection
- Encrypt sensitive data at rest using AES-256

Timeline:
Week 1-2: Setup infrastructure and base services
Week 3-4: Implement core auth flows
Week 5: Integration testing and security audit
Week 6: Production rollout`;

const TOOLBAR_BUTTONS = [
  { icon: "format-bold", label: "Bold", cmd: "bold" },
  { icon: "format-italic", label: "Italic", cmd: "italic" },
  { icon: "format-underline", label: "Underline", cmd: "underline" },
  { icon: "format-list-bulleted", label: "Bullet List", cmd: "insertUnorderedList" },
  { icon: "format-list-numbered", label: "Numbered List", cmd: "insertOrderedList" },
  { icon: "undo", label: "Undo", cmd: "undo" },
  { icon: "redo", label: "Redo", cmd: "redo" },
];

function ToolbarIcon({ icon }: { icon: string }) {
  const icons: Record<string, React.ReactNode> = {
    undo: <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" />,
    redo: <path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.06-5.5 7.6-5.5 1.96 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z" />,
    "format-bold": <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" />,
    "format-italic": <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z" />,
    "format-underline": <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z" />,
    "format-list-bulleted": <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z" />,
    "format-list-numbered": <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z" />,
  };
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      {icons[icon]}
    </svg>
  );
}

export default function DocumentMode() {
  const editorRef = useRef<HTMLDivElement>(null);
  const [charCount, setCharCount] = useState(INITIAL_TEXT.length);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const execFormat = useCallback((cmd: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false);
    setActiveFormats((prev) => {
      const next = new Set(prev);
      if (["bold", "italic", "underline"].includes(cmd)) {
        if (next.has(cmd)) next.delete(cmd);
        else next.add(cmd);
      }
      return next;
    });
  }, []);

  const handleInput = () => {
    const text = editorRef.current?.innerText || "";
    setCharCount(text.length);
  };

  const handleSave = () => {
    setSavedAt(new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }));
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-1.5">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
          </svg>
          <span className="font-medium text-gray-700 dark:text-gray-300">Document</span>
          <span className="text-gray-400">|</span>
          <span>auth-refactoring-specs-v3</span>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-2 py-1.5 flex items-center gap-1 flex-wrap">
        {TOOLBAR_BUTTONS.map((btn) => (
          <button
            key={btn.icon}
            type="button"
            title={btn.label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execFormat(btn.cmd)}
            className={`p-2 rounded-lg transition-colors min-w-9 min-h-9 flex items-center justify-center ${
              activeFormats.has(btn.cmd)
                ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600"
                : "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
            }`}
          >
            <ToolbarIcon icon={btn.icon} />
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Save
          </button>
          {savedAt && (
            <span className="text-xs text-green-600 dark:text-green-400">Saved {savedAt}</span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 p-4 thin-scrollbar">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 shadow-sm rounded min-h-[500px] p-8 border border-gray-100 dark:border-gray-800">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            className="font-sans text-sm leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap outline-none min-h-[400px] focus:ring-2 focus:ring-blue-500/20 rounded-lg p-1"
            dangerouslySetInnerHTML={{ __html: INITIAL_TEXT.replace(/\n/g, "<br>") }}
          />
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-1.5 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-4">
          <span>{charCount} characters</span>
          <span className="text-green-500">Editing</span>
        </div>
        <span>Click anywhere to type · Use toolbar to format</span>
      </div>
    </div>
  );
}
