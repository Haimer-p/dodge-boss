import { v4 as uuidv4 } from "uuid";
import { ChatMessage, DisguiseMode } from "./types";

export function generateId(): string {
  return uuidv4();
}

export function createMessage(
  userId: string,
  username: string,
  content: string,
  type: ChatMessage["type"] = "text",
  avatar?: string
): ChatMessage {
  return {
    id: generateId(),
    userId,
    username,
    avatar,
    content,
    timestamp: Date.now(),
    type,
  };
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getDisguiseLabel(mode: DisguiseMode): string {
  const labels: Record<DisguiseMode, string> = {
    document: "Notion — Room Workspace",
    "code-editor": "VS Code - Code Review",
    terminal: "Terminal - Build Log",
    kanban: "Jira - Sprint Board",
    spreadsheet: "Excel - Data Report",
    email: "Outlook - Inbox",
    dashboard: "Grafana - Service Metrics",
    music: "Spotify - Focus Playlist",
    youtube: "YouTube - Tech Tutorials",
    google: "Google Search",
    caro: "Excel - Team Grid",
    arcade: "Training Modules — Interactive Library",
    chess: "Strategy Matrix — Sprint Planning",
    xiangqi: "Cell War — Regional Grid Analysis",
    bowling: "Lane Metrics — Throughput Simulator",
    vocabulary: "Confluence — Engineering Glossary",
  };
  return labels[mode];
}

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "from-blue-400 to-blue-600",
    "from-purple-400 to-purple-600",
    "from-green-400 to-green-600",
    "from-pink-400 to-pink-600",
    "from-yellow-400 to-yellow-600",
    "from-red-400 to-red-600",
    "from-indigo-400 to-indigo-600",
    "from-teal-400 to-teal-600",
  ];
  return colors[Math.abs(hash) % colors.length];
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Stealth: get status bar text per disguise mode
export function getStatusText(mode: DisguiseMode): string {
  const map: Record<DisguiseMode, string> = {
    document: "Synced",
    "code-editor": "Line 42, Col 8",
    terminal: "PID: 1337",
    kanban: "Sprint: Active",
    spreadsheet: "Sheet 2 of 5",
    email: "3 unread",
    dashboard: "Live metrics",
    music: "Now playing",
    youtube: "Watching",
    google: "Search ready",
    caro: "Grid active",
    arcade: "Module loaded",
    chess: "Strategy session",
    xiangqi: "War game active",
    bowling: "Lane open",
    vocabulary: "Glossary sync",
  };
  return map[mode];
}
