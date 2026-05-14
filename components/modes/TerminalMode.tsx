"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";

interface HistoryEntry {
  command: string;
  output: string[];
}

const COMMAND_RESPONSES: Record<string, string[] | ((args: string) => string[])> = {
  help: () => [
    "Available commands:",
    "  help          - Show this help",
    "  ls            - List files",
    "  pwd           - Print working directory",
    "  clear         - Clear terminal",
    "  npm run build - Run production build",
    "  git status    - Show git status",
    "  whoami        - Current user",
    "  date          - Current date/time",
    "  echo <text>   - Print text",
    "  demo          - Run build demo sequence",
  ],
  ls: () => [
    "Dockerfile  docker-compose.yml  package.json  src/  tests/  dist/",
  ],
  pwd: () => ["/home/admin/projects/auth-service"],
  whoami: () => ["admin"],
  date: () => [new Date().toString()],
  "git status": () => [
    "On branch main",
    "Your branch is up to date with 'origin/main'.",
    "nothing to commit, working tree clean",
  ],
  "npm run build": () => [
    "> auth-service@1.0.0 build",
    "> tsc && vite build",
    "✓ 72 modules transformed",
    "✓ Build completed in 8.2s",
  ],
  demo: () => [
    "Running demo build pipeline...",
    "✓ TypeScript check passed",
    "✓ 42 tests passed",
    "✓ Deployment triggered: prod-v1.2.3",
  ],
};

function runCommand(input: string): string[] {
  const trimmed = input.trim();
  if (!trimmed) return [];
  if (trimmed === "clear") return ["__CLEAR__"];
  if (trimmed.startsWith("echo ")) return [trimmed.slice(5)];
  const handler = COMMAND_RESPONSES[trimmed];
  if (handler) return typeof handler === "function" ? handler("") : handler;
  return [`bash: ${trimmed}: command not found`];
}

export default function TerminalMode() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [input, setInput] = useState("");
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  const execute = (cmd: string) => {
    const output = runCommand(cmd);
    if (output[0] === "__CLEAR__") {
      setHistory([]);
      return;
    }
    setHistory((h) => [...h, { command: cmd, output }]);
    setCmdHistory((h) => [...h, cmd]);
    setHistoryIdx(-1);
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      execute(input);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const idx = historyIdx < 0 ? cmdHistory.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(idx);
      setInput(cmdHistory[idx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx < 0) return;
      const idx = historyIdx + 1;
      if (idx >= cmdHistory.length) {
        setHistoryIdx(-1);
        setInput("");
      } else {
        setHistoryIdx(idx);
        setInput(cmdHistory[idx]);
      }
    }
  };

  return (
    <div
      className="flex-1 flex rounded-lg overflow-hidden border border-gray-600 shadow-sm"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex-1 flex flex-col bg-black">
        <div className="bg-[#2d2d2d] px-3 py-2 flex items-center justify-between border-b border-gray-700">
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
          <span className="text-xs text-gray-500 font-mono">bash — interactive</span>
        </div>

        <div
          ref={terminalRef}
          className="flex-1 p-3 overflow-y-auto thin-scrollbar font-mono text-sm leading-6"
          style={{ background: "#0d1117" }}
        >
          <div className="text-gray-500 text-xs mb-3">
            Type <span className="text-green-400">help</span> for commands · ↑↓ for history
          </div>
          {history.map((entry, i) => (
            <div key={i} className="mb-2">
              <div>
                <span className="text-green-400 mr-2">$</span>
                <span className="text-white">{entry.command}</span>
              </div>
              {entry.output.map((line, j) => (
                <div key={j} className="text-gray-300 pl-4">
                  {line}
                </div>
              ))}
            </div>
          ))}
          <div className="input-3d-shell flex items-center gap-2 px-3 py-1.5">
            <span className="text-green-400 font-mono text-sm shrink-0">$</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-gray-200 outline-none border-0 shadow-none font-mono text-sm min-h-0 p-0"
              placeholder="Type a command..."
              autoFocus
              spellCheck={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
