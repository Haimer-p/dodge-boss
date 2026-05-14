"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const DOCUMENT_TEXT = `PROJECT: Internal Authentication Microservice Refactoring

Overview:
This document outlines the planned refactoring of the authentication service to improve security posture and reduce technical debt. The current implementation uses a monolithic approach with hardcoded secrets.

Architecture Changes:
The new architecture will implement a microservice-based authentication system using JWT tokens with refresh token rotation. The system will support OAuth2.0 and OpenID Connect protocols.

Key Components:
1. Auth Service - Handles login, logout, token generation
2. Token Service - Manages JWT creation, validation, rotation
3. User Service - User profile management and permissions
4. Session Store - Redis-based session management

Security Improvements:
- Implement rate limiting on login endpoints
- Add IP-based anomaly detection
- Encrypt sensitive data at rest using AES-256
- Implement proper CORS policies

Database Schema Changes:
The user table will be normalized into three separate tables: users, roles, and permissions. This will allow more granular access control and better query performance.

Migration Plan:
Phase 1: Deploy new auth service alongside existing system
Phase 2: Migrate users gradually over 2-week period
Phase 3: Deprecate old auth endpoints

Testing Strategy:
Each microservice requires unit tests (>80% coverage), integration tests for API contracts, and end-to-end tests for critical flows.

Performance Benchmarks:
Target P99 latency < 200ms for authentication requests.
Target throughput of 10,000 requests per second.

Deployment:
Services will be containerized using Docker and orchestrated via Kubernetes. Each service will have its own CI/CD pipeline with automated rollback capabilities.

Monitoring:
Implement distributed tracing using OpenTelemetry. Set up alerts for error rate spikes, latency degradation, and authentication failures.

Timeline:
Week 1-2: Setup infrastructure and base services
Week 3-4: Implement core auth flows
Week 5: Integration testing and security audit
Week 6: Production rollout`;

const TOOLBAR_BUTTONS = [
  { icon: "undo", label: "Undo" },
  { icon: "redo", label: "Redo" },
  { icon: "print", label: "Print" },
  { icon: "spellcheck", label: "Spell Check" },
  { icon: "format-bold", label: "Bold" },
  { icon: "format-italic", label: "Italic" },
  { icon: "format-underline", label: "Underline" },
  { icon: "format-list-bulleted", label: "Bullet List" },
  { icon: "format-list-numbered", label: "Numbered List" },
  { icon: "link", label: "Insert Link" },
  { icon: "comment", label: "Comment" },
  { icon: "history", label: "Version History" },
];

function ToolbarIcon({ icon }: { icon: string }) {
  const icons: Record<string, React.ReactNode> = {
    undo: <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" />,
    redo: <path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.06-5.5 7.6-5.5 1.96 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z" />,
    print: <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z" />,
    spellcheck: <path d="M12.45 16h2.09L9.43 3H7.57L2.46 16h2.09l1.12-3h5.64l1.14 3zm-6.02-5L8.5 5.48 10.57 11H6.43zm15.16.59l-8.09 8.09L9.83 16l-1.41 1.41 5.09 5.09L23 13l-1.41-1.41z" />,
    "format-bold": <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" />,
    "format-italic": <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z" />,
    "format-underline": <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z" />,
    "format-list-bulleted": <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z" />,
    "format-list-numbered": <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z" />,
    link: <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />,
    comment: <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />,
    history: <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />,
  };

  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      {icons[icon]}
    </svg>
  );
}

export default function DocumentMode() {
  const [displayText, setDisplayText] = useState("");
  const [charIndex, setCharIndex] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const autoType = useCallback(() => {
    if (charIndex < DOCUMENT_TEXT.length) {
      setDisplayText(DOCUMENT_TEXT.slice(0, charIndex + 1));
      setCharIndex((prev) => prev + 1);
    }
  }, [charIndex]);

  useEffect(() => {
    if (!isActive) return;

    intervalRef.current = setInterval(() => {
      // Random delay between 30-80ms for realistic typing
      const delay = Math.random() * 50 + 30;
      setTimeout(() => {
        setCharIndex((prev) => {
          if (prev < DOCUMENT_TEXT.length) {
            setDisplayText(DOCUMENT_TEXT.slice(0, prev + 1));
            return prev + 1;
          }
          return prev;
        });
      }, delay);
    }, 100);

    return () => clearInterval(intervalRef.current);
  }, [isActive]);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayText]);

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Fake Google Docs Top Bar */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-1">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
          </svg>
          <span className="font-medium text-gray-700 dark:text-gray-300">Document</span>
          <span className="text-gray-400">|</span>
          <span>auth-refactoring-specs-v3</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-2 py-1 flex items-center gap-1 flex-wrap">
        {TOOLBAR_BUTTONS.map((btn) => (
          <button
            key={btn.icon}
            title={btn.label}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <ToolbarIcon icon={btn.icon} />
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 text-xs text-gray-400">
          <span>Last edited 2 min ago</span>
          <span className="w-2 h-2 rounded-full bg-green-400" title="Auto-saving" />
        </div>
      </div>

      {/* Ruler */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-5 flex items-center px-8">
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 border-r border-gray-200 dark:border-gray-700 h-3"
          />
        ))}
      </div>

      {/* Document Content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 p-4 hide-scrollbar"
      >
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 shadow-sm rounded min-h-[600px] p-8 border border-gray-100 dark:border-gray-800">
          <pre className="font-sans text-sm leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
            {displayText}
            <span className="doc-cursor">&nbsp;</span>
          </pre>
        </div>
      </div>

      {/* Fake Status Bar */}
      <div className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-1 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-4">
          <span>{charIndex > 0 ? `${Math.round((charIndex / DOCUMENT_TEXT.length) * 100)}% complete` : "Draft"}</span>
          <span>{charIndex} characters</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1C8.14 1 5 4.14 5 8c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
            </svg>
            {charIndex > 0 ? "Editing" : "Viewing"}
          </span>
        </div>
      </div>
    </div>
  );
}
