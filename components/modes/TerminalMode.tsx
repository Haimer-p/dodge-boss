"use client";

import { useEffect, useState, useRef } from "react";

const BUILD_LOG_LINES = [
  { text: "$ npm run build:production", type: "command" },
  { text: "", type: "empty" },
  { text: "> auth-service@1.0.0 build:production", type: "info" },
  { text: "> tsc --project tsconfig.build.json && vite build", type: "info" },
  { text: "", type: "empty" },
  { text: "[10:32:15] Starting TypeScript compilation...", type: "timestamp" },
  { text: "[10:32:15] Checking auth-service/src/middleware/authenticate.ts", type: "info" },
  { text: "[10:32:16] Checking auth-service/src/utils/jwt.ts", type: "info" },
  { text: "[10:32:16] Checking auth-service/src/services/user.ts", type: "info" },
  { text: "[10:32:17] Checking auth-service/src/routes/auth.ts", type: "info" },
  { text: "[10:32:18] TypeScript compilation completed (3.2s)", type: "success" },
  { text: "", type: "empty" },
  { text: "[10:32:18] Starting Vite build...", type: "timestamp" },
  { text: "vite v5.2.0 building for production...", type: "info" },
  { text: "transforming...", type: "info" },
  { text: "  node_modules/express/lib/router/index.ts", type: "file" },
  { text: "  node_modules/jsonwebtoken/sign.ts", type: "file" },
  { text: "  src/middleware/authenticate.ts", type: "file" },
  { text: "  src/utils/jwt.ts", type: "file" },
  { text: "  src/services/user.ts", type: "file" },
  { text: "  src/routes/auth.ts", type: "file" },
  { text: "  src/config/database.ts", type: "file" },
  { text: "  src/models/blacklist.ts", type: "file" },
  { text: "✓ 72 modules transformed in 4.8s", type: "success" },
  { text: "", type: "empty" },
  { text: "rendering chunks...", type: "info" },
  { text: "computing gzip size...", type: "info" },
  { text: "", type: "empty" },
  { text: "dist/assets/index-D1X5aF.js   142.30 kB │ gzip: 42.15 kB", type: "output" },
  { text: "dist/assets/vendor-C2v3bG.js  89.45 kB │ gzip: 28.30 kB", type: "output" },
  { text: "", type: "empty" },
  { text: "✓ Build completed in 8.2s", type: "success" },
  { text: "", type: "empty" },
  { text: "Running tests...", type: "command" },
  { text: "", type: "empty" },
  { text: " PASS  tests/auth.test.ts (8.3s)", type: "test-pass" },
  { text: " PASS  tests/jwt.test.ts (5.1s)", type: "test-pass" },
  { text: " PASS  tests/middleware.test.ts (6.7s)", type: "test-pass" },
  { text: "", type: "empty" },
  { text: "Tests:       42 passed, 42 total", type: "summary" },
  { text: "Snapshots:   0 total", type: "info" },
  { text: "Time:        22.4s", type: "timestamp" },
  { text: "", type: "empty" },
  { text: "Lighthouse report generated: dist/reports/lighthouse/", type: "info" },
  { text: "  Performance: 92", type: "score" },
  { text: "  Accessibility: 100", type: "score" },
  { text: "  Best Practices: 95", type: "score" },
  { text: "  SEO: 100", type: "score" },
  { text: "", type: "empty" },
  { text: "$ git push origin main", type: "command" },
  { text: "Enumerating objects: 42, done.", type: "git" },
  { text: "Counting objects: 100% (42/42), done.", type: "git" },
  { text: "Delta compression using up to 8 threads", type: "git" },
  { text: "Compressing objects: 100% (38/38), done.", type: "git" },
  { text: "Writing objects: 100% (42/42), 15.3 KiB | 2.2 MiB/s, done.", type: "git" },
  { text: "Total 42 (delta 12), reused 0 (delta 0)", type: "git" },
  { text: "To github.com:company/auth-service.git", type: "git" },
  { text: "   a1b2c3d..e4f5g6h  main -> main", type: "git" },
  { text: "", type: "empty" },
  { text: "✓ Deployment triggered: prod-v1.2.3", type: "success" },
  { text: "✓ Health check passed (200 OK)", type: "success" },
  { text: "✓ All systems operational", type: "success" },
];

interface LogEntry {
  text: string;
  type: string;
}

export default function TerminalMode() {
  const [visibleLogs, setVisibleLogs] = useState<LogEntry[]>([]);
  const [logIndex, setLogIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [typedCommand, setTypedCommand] = useState("");
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logIndex >= BUILD_LOG_LINES.length) return;

    const line = BUILD_LOG_LINES[logIndex];

    if (line.type === "command") {
      // Type the command character by character
      setIsTyping(true);
      let charIdx = 0;
      const cmdText = line.text;

      const typeInterval = setInterval(() => {
        if (charIdx < cmdText.length) {
          setTypedCommand(cmdText.slice(0, charIdx + 1));
          charIdx++;
        } else {
          clearInterval(typeInterval);
          // Execute the command
          setTimeout(() => {
            setVisibleLogs((prev) => [...prev, line]);
            setTypedCommand("");
            setIsTyping(false);
            setLogIndex((prev) => prev + 1);
          }, 300);
        }
      }, 40 + Math.random() * 30);

      return () => clearInterval(typeInterval);
    } else {
      // Just show the line
      const delay = line.type === "empty" ? 200 : 100 + Math.random() * 200;

      const timeout = setTimeout(() => {
        setVisibleLogs((prev) => [...prev, line]);
        setLogIndex((prev) => prev + 1);
      }, delay);

      return () => clearTimeout(timeout);
    }
  }, [logIndex]);

  // Auto scroll
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [visibleLogs, typedCommand]);

  // Restart after completion
  useEffect(() => {
    if (logIndex >= BUILD_LOG_LINES.length) {
      const restartTimeout = setTimeout(() => {
        setVisibleLogs([]);
        setLogIndex(0);
        setTypedCommand("");
      }, 8000);
      return () => clearTimeout(restartTimeout);
    }
  }, [logIndex]);

  return (
    <div className="flex-1 flex rounded-lg overflow-hidden border border-gray-600 shadow-sm">
      {/* Terminal Window */}
      <div className="flex-1 flex flex-col bg-black">
        {/* Title bar */}
        <div className="bg-[#2d2d2d] px-3 py-1.5 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <span className="text-xs text-gray-400 font-mono">
              admin@build-server: ~/projects/auth-service
            </span>
          </div>
          <div className="text-xs text-gray-500 font-mono">bash</div>
        </div>

        {/* Terminal output */}
        <div
          ref={terminalRef}
          className="flex-1 p-3 overflow-y-auto hide-scrollbar font-mono text-sm leading-6"
          style={{ background: "#0d1117" }}
        >
          {visibleLogs.map((log, i) => (
            <div key={i} className="message-enter">
              <LogLine log={log} />
            </div>
          ))}
          {isTyping && (
            <div className="flex">
              <span className="text-green-400 mr-2">$</span>
              <span className="text-gray-200">{typedCommand}</span>
              <span className="w-2 h-4 bg-green-400 ml-0.5 animate-pulse" />
            </div>
          )}
          {logIndex < BUILD_LOG_LINES.length && !isTyping && (
            <div className="flex items-center">
              <span className="text-green-400 mr-2">$</span>
              <span className="w-2 h-4 bg-green-400 animate-pulse" />
            </div>
          )}
          {logIndex >= BUILD_LOG_LINES.length && (
            <div className="flex items-center text-green-400">
              <span className="mr-2">$</span>
              <span className="text-gray-500 text-xs">[Idle] Press Ctrl+C to cancel ...</span>
              <span className="w-2 h-4 bg-green-400 ml-2 animate-pulse" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LogLine({ log }: { log: LogEntry }) {
  switch (log.type) {
    case "command":
      return (
        <span>
          <span className="text-green-400 mr-2">$</span>
          <span className="text-white">{log.text.slice(2)}</span>
        </span>
      );
    case "empty":
      return <span className="text-transparent">.</span>;
    case "success":
      return <span className="text-green-400">{log.text}</span>;
    case "timestamp":
      return <span className="text-blue-400">{log.text}</span>;
    case "test-pass":
      return <span className="text-green-400">{log.text}</span>;
    case "summary":
      return <span className="text-cyan-400">{log.text}</span>;
    case "score":
      return <span className="text-yellow-400">{log.text}</span>;
    case "git":
      return <span className="text-purple-400">{log.text}</span>;
    case "file":
      return <span className="text-gray-400">{log.text}</span>;
    case "output":
      return <span className="text-yellow-300">{log.text}</span>;
    default:
      return <span className="text-gray-300">{log.text}</span>;
  }
}
