"use client";

import { useEffect, useState, useRef, useCallback } from "react";

const CODE_SAMPLES = [
  `// auth-service/src/middleware/authenticate.ts
// TODO: Implement JWT validation middleware
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { TokenBlacklist } from '../models/blacklist';

export async function authenticateMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }`,
  `
  const token = authHeader.split(' ')[1];
  
  // Check blacklist
  const isBlacklisted = await TokenBlacklist.exists(token);
  if (isBlacklisted) {
    return res.status(401).json({ error: 'Token revoked' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}`,
  `
// auth-service/src/utils/jwt.ts
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { redis } from '../config/redis';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_EXPIRY = '15m';
const REFRESH_EXPIRY = '7d';`,
  `
export interface TokenPayload {
  userId: string;
  email: string;
  role: 'admin' | 'developer' | 'viewer';
  jti: string;
}

export function generateAccessToken(payload: Omit<TokenPayload, 'jti'>): string {
  return jwt.sign(
    { ...payload, jti: uuidv4() },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRY }
  );
}

export function generateRefreshToken(userId: string): string {
  const jti = uuidv4();
  const token = jwt.sign({ userId, jti }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRY
  });`,
  `
  // Store refresh token hash in Redis
  await redis.set(
    \`refresh_token:\${userId}:\${jti}\`,
    'valid',
    { EX: 7 * 24 * 60 * 60 }
  );
  
  return token;
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): { userId: string; jti: string } {
  return jwt.verify(token, REFRESH_SECRET) as { userId: string; jti: string };
}`,
  `
// auth-service/src/routes/auth.ts
import { Router } from 'express';
import { z } from 'zod';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { UserService } from '../services/user';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

router.post('/login', async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = await UserService.authenticate(email, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }`,
  `
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
  
  const refreshToken = generateRefreshToken(user.id);
  
  res.json({
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, role: user.role },
  });
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  try {
    const { userId, jti } = verifyRefreshToken(refreshToken);
    // ... token rotation logic
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});`,
  `
// auth-service/src/services/user.ts
import { prisma } from '../config/database';
import bcrypt from 'bcrypt';

export class UserService {
  static async authenticate(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) return null;
    
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;
    
    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    
    return user;
  }
`,
];

const FILE_TREE = {
  "auth-service": {
    "src": {
      "middleware": ["authenticate.ts", "authorize.ts", "rateLimiter.ts"],
      "routes": ["auth.ts", "users.ts", "health.ts"],
      "services": ["user.ts", "token.ts", "session.ts"],
      "utils": ["jwt.ts", "password.ts", "validators.ts"],
      "config": ["database.ts", "redis.ts", "env.ts"],
      "models": ["blacklist.ts", "auditLog.ts"],
    },
    "tests": ["auth.test.ts", "jwt.test.ts", "middleware.test.ts"],
    "docker": ["Dockerfile", "docker-compose.yml"],
  },
};

type FileTree = typeof FILE_TREE;

function FileTreeView({
  tree,
  depth = 0,
  selectedFile,
  onFileSelect,
}: {
  tree: FileTree | Record<string, string[] | Record<string, string[]>>;
  depth?: number;
  selectedFile: string | null;
  onFileSelect: (path: string) => void;
}) {
  return (
    <div className="font-mono text-xs">
      {Object.entries(tree).map(([key, value]) => {
        if (Array.isArray(value)) {
          return (
            <div key={key}>
              {value.map((file) => {
                const filePath = key + "/" + file;
                return (
                  <button
                    key={file}
                    onClick={() => onFileSelect(filePath)}
                    className={`w-full text-left px-2 py-0.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-1 ${
                      selectedFile === filePath
                        ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                    style={{ paddingLeft: `${(depth + 1) * 12}px` }}
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
                    </svg>
                    {file}
                  </button>
                );
              })}
            </div>
          );
        }
        return (
          <div key={key}>
            <div
              className="flex items-center gap-1 px-2 py-0.5 text-gray-500 dark:text-gray-500 font-semibold uppercase tracking-wider"
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
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [currentLineIdx, setCurrentLineIdx] = useState(0);
  const [selectedFile, setSelectedFile] = useState<string | null>("middleware/authenticate.ts");
  const [isActive] = useState(true);
  const codeRef = useRef<HTMLDivElement>(null);

  // Flatten all code into lines
  const allLines = useCallback(() => {
    const lines: string[] = [];
    CODE_SAMPLES.forEach((block) => {
      block.split("\n").forEach((line) => lines.push(line));
    });
    return lines;
  }, []);

  useEffect(() => {
    if (!isActive) return;

    const lines = allLines();
    let idx = 0;

    const interval = setInterval(() => {
      if (idx < lines.length) {
        setVisibleLines(lines.slice(0, idx + 1));
        setCurrentLineIdx(idx);
        idx++;
      } else {
        // Reset after a pause
        setTimeout(() => {
          idx = 0;
          setVisibleLines([]);
          setCurrentLineIdx(0);
        }, 5000);
        clearInterval(interval);
      }
    }, 80 + Math.random() * 120); // Random typing speed

    return () => clearInterval(interval);
  }, [isActive, allLines]);

  // Auto scroll
  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.scrollTop = codeRef.current.scrollHeight;
    }
  }, [visibleLines]);

  return (
    <div className="flex-1 flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Sidebar */}
      <div className="w-52 bg-gray-900 text-gray-300 flex flex-col overflow-hidden shrink-0">
        {/* Title bar */}
        <div className="bg-gray-800 px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-700">
          EXPLORER
        </div>
        {/* Search bar */}
        <div className="px-2 py-1">
          <div className="bg-gray-800 rounded px-2 py-1 text-xs text-gray-500">
            search files...
          </div>
        </div>
        {/* File tree */}
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          <FileTreeView
            tree={FILE_TREE}
            selectedFile={selectedFile}
            onFileSelect={setSelectedFile}
          />
        </div>
      </div>

      {/* Code Area */}
      <div className="flex-1 flex flex-col bg-[#1e1e1e] overflow-hidden">
        {/* Tabs */}
        <div className="bg-[#252526] border-b border-[#3c3c3c] flex items-center text-xs">
          <div className="flex items-center">
            <div className="bg-[#1e1e1e] text-white px-3 py-1.5 border-r border-[#3c3c3c] flex items-center gap-1.5">
              <svg className="w-3 h-3 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z" />
              </svg>
              authenticate.ts
            </div>
            <div className="text-gray-500 px-3 py-1.5 border-r border-[#3c3c3c]">jwt.ts</div>
            <div className="text-gray-500 px-3 py-1.5">auth.ts</div>
          </div>
          <div className="ml-auto flex items-center gap-1 px-2 text-gray-500">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
          </div>
        </div>

        {/* Line numbers + code */}
        <div className="flex-1 flex overflow-hidden">
          {/* Line numbers */}
          <div className="w-12 bg-[#1e1e1e] text-right pr-3 pt-3 select-none shrink-0">
            {visibleLines.map((_, i) => (
              <div
                key={i}
                className={`text-xs leading-5 ${
                  i === currentLineIdx
                    ? "text-yellow-400"
                    : "text-gray-600"
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>

          {/* Code */}
          <div
            ref={codeRef}
            className="flex-1 overflow-y-auto hide-scrollbar pt-3 pb-4"
          >
            <pre className="font-mono text-sm leading-5 text-gray-300 whitespace-pre">
              {visibleLines.map((line, i) => (
                <div
                  key={i}
                  className="code-line"
                  style={{
                    animationDelay: `${i * 30}ms`,
                    ["--line-opacity" as string]: i === currentLineIdx ? "1" : "0.85",
                  }}
                >
                  {highlightLine(line)}
                </div>
              ))}
              <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-1" />
            </pre>
          </div>
        </div>

        {/* Status bar */}
        <div className="bg-[#007acc] text-white text-xs px-3 py-1 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>main*</span>
            <span>authenticate.ts</span>
            <span className="text-blue-200">TypeScript</span>
          </div>
          <div className="flex items-center gap-3 text-blue-100">
            <span>Ln {currentLineIdx + 1}, Col 1</span>
            <span>UTF-8</span>
            <span>Spaces: 2</span>
            <span>Prettier</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function highlightLine(line: string): React.ReactNode {
  if (line.startsWith("//")) {
    return <span className="text-green-500">{line}</span>;
  }
  if (line.startsWith("import")) {
    return (
      <span>
        <span className="text-purple-400">import</span>
        <span> </span>
        <span className="text-orange-300">{line.slice(6)}</span>
      </span>
    );
  }
  if (line.startsWith("export")) {
    return (
      <span>
        <span className="text-purple-400">export</span>
        <span>{line.slice(6)}</span>
      </span>
    );
  }
  if (line.includes("function") || line.includes("async")) {
    return (
      <span>
        <span className="text-blue-400">{line.match(/^\s*/)?.[0] || ""}</span>
        <span className="text-yellow-300">function</span>
        <span>{line.replace(/^\s*/, "").replace("function", "")}</span>
      </span>
    );
  }
  if (line.includes("const ") || line.includes("let ") || line.includes("var ")) {
    return (
      <span>
        <span className="text-blue-400">{line.match(/^\s*/)?.[0] || ""}</span>
        <span className="text-purple-400">{line.trim().split(/\s/)[0]}</span>
        <span>{line.replace(/^\s*/, "").slice(line.trim().split(/\s/)[0].length)}</span>
      </span>
    );
  }
  if (line.includes("return ")) {
    return <span><span className="text-purple-400">return</span><span>{line.slice(line.indexOf("return") + 6)}</span></span>;
  }
  if (line.includes('"') || line.includes("'")) {
    return <span className="text-orange-300">{line}</span>;
  }
  if (line.trim().startsWith("}") || line.trim().startsWith("{")) {
    return <span>{line}</span>;
  }
  return <span>{line}</span>;
}
