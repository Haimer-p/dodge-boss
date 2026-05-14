"use client";

import { useState, useMemo, useCallback } from "react";

const FILE_CONTENTS: Record<string, string> = {
  "middleware/authenticate.ts": `// auth-service/src/middleware/authenticate.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export async function authenticateMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = verifyToken(authHeader.split(' ')[1]);
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid token' });
  }
}`,
  "utils/jwt.ts": `import jwt from 'jsonwebtoken';

export function generateAccessToken(payload: object): string {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, { expiresIn: '15m' });
}

export function verifyToken(token: string) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET!);
}`,
  "routes/auth.ts": `import { Router } from 'express';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  // authenticate user...
  res.json({ accessToken: '...', refreshToken: '...' });
});

export default router;`,
  "services/user.ts": `export class UserService {
  static async authenticate(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    return user;
  }
}`,
};

const OPEN_TABS = ["middleware/authenticate.ts", "utils/jwt.ts", "routes/auth.ts"];

const FILE_TREE = {
  "auth-service": {
    src: {
      middleware: ["authenticate.ts"],
      routes: ["auth.ts"],
      services: ["user.ts"],
      utils: ["jwt.ts"],
    },
  },
};

type TreeNode = typeof FILE_TREE | Record<string, string[] | Record<string, string[]>>;

function FileTreeView({
  tree,
  depth = 0,
  selectedFile,
  onFileSelect,
}: {
  tree: TreeNode;
  depth?: number;
  selectedFile: string;
  onFileSelect: (path: string) => void;
}) {
  return (
    <div className="font-mono text-xs">
      {Object.entries(tree).map(([key, value]) => {
        if (Array.isArray(value)) {
          return value.map((file) => {
            const filePath = `${key}/${file}`;
            return (
              <button
                key={filePath}
                type="button"
                onClick={() => onFileSelect(filePath)}
                className={`w-full text-left px-2 py-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-1 ${
                  selectedFile === filePath
                    ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300"
                    : "text-gray-600 dark:text-gray-400"
                }`}
                style={{ paddingLeft: `${(depth + 1) * 12}px` }}
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z" />
                </svg>
                {file}
              </button>
            );
          });
        }
        return (
          <div key={key}>
            <div
              className="flex items-center gap-1 px-2 py-0.5 text-gray-500 font-semibold uppercase tracking-wider"
              style={{ paddingLeft: `${depth * 12}px` }}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
              </svg>
              {key}
            </div>
            <FileTreeView
              tree={value as Record<string, string[] | Record<string, string[]>>}
              depth={depth + 1}
              selectedFile={selectedFile}
              onFileSelect={onFileSelect}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function CodeEditorMode() {
  const [files, setFiles] = useState(FILE_CONTENTS);
  const [activeFile, setActiveFile] = useState("middleware/authenticate.ts");
  const [openTabs, setOpenTabs] = useState(OPEN_TABS);
  const [search, setSearch] = useState("");
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorCol, setCursorCol] = useState(1);

  const filteredTree = useMemo(() => {
    if (!search.trim()) return FILE_TREE;
    const q = search.toLowerCase();
    const filtered: Record<string, string> = {};
    Object.entries(FILE_CONTENTS).forEach(([path, content]) => {
      if (path.toLowerCase().includes(q) || content.toLowerCase().includes(q)) {
        filtered[path] = content;
      }
    });
    return filtered;
  }, [search]);

  const openFile = useCallback((path: string) => {
    setActiveFile(path);
    if (!openTabs.includes(path)) setOpenTabs((t) => [...t, path]);
    if (!files[path]) {
      setFiles((f) => ({ ...f, [path]: `// ${path}\n` }));
    }
  }, [openTabs, files]);

  const closeTab = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = openTabs.filter((t) => t !== path);
    setOpenTabs(next.length ? next : [activeFile]);
    if (path === activeFile && next.length) setActiveFile(next[next.length - 1]);
  };

  const handleCodeChange = (value: string) => {
    setFiles((f) => ({ ...f, [activeFile]: value }));
    const lines = value.split("\n");
    setCursorLine(lines.length);
  };

  const updateCursor = (ta: HTMLTextAreaElement) => {
    const text = ta.value.slice(0, ta.selectionStart);
    const lines = text.split("\n");
    setCursorLine(lines.length);
    setCursorCol(lines[lines.length - 1].length + 1);
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    updateCursor(e.currentTarget);
  };

  const handleClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    updateCursor(e.currentTarget);
  };

  const lineCount = (files[activeFile] || "").split("\n").length;

  return (
    <div className="flex-1 flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="w-52 bg-gray-900 text-gray-300 flex flex-col overflow-hidden shrink-0">
        <div className="bg-gray-800 px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-700">
          EXPLORER
        </div>
        <div className="px-2 py-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files..."
            className="input-3d w-full"
          />
        </div>
        <div className="flex-1 overflow-y-auto thin-scrollbar">
          {search.trim() ? (
            Object.keys(filteredTree as Record<string, string>).map((path) => (
              <button
                key={path}
                type="button"
                onClick={() => openFile(path)}
                className={`w-full text-left px-3 py-1 text-xs hover:bg-blue-900/20 ${
                  activeFile === path ? "text-blue-300 bg-blue-900/30" : "text-gray-400"
                }`}
              >
                {path}
              </button>
            ))
          ) : (
            <FileTreeView tree={FILE_TREE} selectedFile={activeFile} onFileSelect={openFile} />
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-[#1e1e1e] overflow-hidden">
        <div className="bg-[#252526] border-b border-[#3c3c3c] flex items-center text-xs overflow-x-auto">
          {openTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveFile(tab)}
              className={`flex items-center gap-1.5 px-3 py-2 border-r border-[#3c3c3c] shrink-0 group ${
                activeFile === tab ? "bg-[#1e1e1e] text-white" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <svg className="w-3 h-3 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z" />
              </svg>
              {tab.split("/").pop()}
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => closeTab(tab, e)}
                onKeyDown={(e) => e.key === "Enter" && closeTab(tab, e as unknown as React.MouseEvent)}
                className="ml-1 opacity-0 group-hover:opacity-100 hover:bg-gray-700 rounded px-1 text-gray-400"
              >
                ×
              </span>
            </button>
          ))}
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-12 bg-[#1e1e1e] text-right pr-3 pt-3 select-none shrink-0 text-gray-600 text-xs leading-5">
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i} className={i + 1 === cursorLine ? "text-yellow-400" : ""}>
                {i + 1}
              </div>
            ))}
          </div>
          <textarea
            value={files[activeFile] || ""}
            onChange={(e) => handleCodeChange(e.target.value)}
            onKeyUp={handleKeyUp}
            onClick={handleClick}
            spellCheck={false}
            className="flex-1 bg-[#1e1e1e] text-gray-300 font-mono text-sm leading-5 p-3 pt-3 resize-none outline-none border-none focus:ring-0 thin-scrollbar"
          />
        </div>

        <div className="bg-[#007acc] text-white text-xs px-3 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>main*</span>
            <span>{activeFile}</span>
            <span className="text-blue-200">TypeScript</span>
          </div>
          <div className="flex items-center gap-3 text-blue-100">
            <span>Ln {cursorLine}, Col {cursorCol}</span>
            <span>UTF-8</span>
          </div>
        </div>
      </div>
    </div>
  );
}
