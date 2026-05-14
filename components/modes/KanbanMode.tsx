"use client";

import { useEffect, useState, useRef } from "react";

const TICKETS = [
  {
    id: "AUTH-142",
    title: "Implement JWT refresh token rotation",
    priority: "High",
    assignee: "you",
    status: "In Progress",
    desc: "Add refresh token rotation to prevent token reuse attacks",
  },
  {
    id: "AUTH-143",
    title: "Rate limiting on login endpoint",
    priority: "Critical",
    assignee: "dev_team",
    status: "In Progress",
    desc: "Implement rate limiting middleware to prevent brute force",
  },
  {
    id: "AUTH-140",
    title: "Add OAuth2.0 Google provider",
    priority: "Medium",
    assignee: "backend",
    status: "Review",
    desc: "Integrate Google OAuth for SSO login option",
  },
  {
    id: "AUTH-138",
    title: "Password reset flow",
    priority: "High",
    assignee: "backend",
    status: "Done",
    desc: "Implement forgot password with email verification",
  },
  {
    id: "AUTH-141",
    title: "Session management dashboard",
    priority: "Low",
    assignee: "frontend",
    status: "Backlog",
    desc: "Admin panel to view and revoke active sessions",
  },
  {
    id: "AUTH-144",
    title: "Audit logging for auth events",
    priority: "Medium",
    assignee: "backend",
    status: "Backlog",
    desc: "Log all login/logout/token refresh events",
  },
  {
    id: "AUTH-139",
    title: "MFA implementation",
    priority: "High",
    assignee: "dev_team",
    status: "Review",
    desc: "TOTP-based multi-factor authentication",
  },
  {
    id: "AUTH-145",
    title: "API key management",
    priority: "Low",
    assignee: "frontend",
    status: "Backlog",
    desc: "Allow users to generate and manage API keys",
  },
];

const COLUMNS = [
  { id: "Backlog", color: "bg-gray-500" },
  { id: "In Progress", color: "bg-blue-500" },
  { id: "Review", color: "bg-yellow-500" },
  { id: "Done", color: "bg-green-500" },
];

const PRIORITY_COLORS: Record<string, string> = {
  Critical: "text-red-400 bg-red-500/10",
  High: "text-orange-400 bg-orange-500/10",
  Medium: "text-yellow-400 bg-yellow-500/10",
  Low: "text-gray-400 bg-gray-500/10",
};

export default function KanbanMode() {
  const [tickets, setTickets] = useState(TICKETS);
  const [animatingTickets, setAnimatingTickets] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Simulate ticket movements every few seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const idx = Math.floor(Math.random() * tickets.length);
      const ticket = tickets[idx];
      const colIdx = COLUMNS.findIndex((c) => c.id === ticket.status);
      if (colIdx < COLUMNS.length - 1) {
        const newStatus = COLUMNS[colIdx + 1].id;
        setAnimatingTickets((prev) => [...prev, ticket.id]);
        setTimeout(() => {
          setTickets((prev) =>
            prev.map((t) => (t.id === ticket.id ? { ...t, status: newStatus } : t))
          );
          setAnimatingTickets((prev) => prev.filter((id) => id !== ticket.id));
        }, 600);
      }
    }, 4000 + Math.random() * 3000);

    return () => clearInterval(interval);
  }, [tickets]);

  const filteredTickets = tickets.filter(
    (t) =>
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col bg-gray-950 rounded-lg overflow-hidden border border-gray-800 shadow-sm">
      {/* Board Header */}
      <div className="bg-gray-900/80 border-b border-gray-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-blue-400">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
            </svg>
            <span className="text-xs font-semibold uppercase tracking-wider">Sprint Planning - Q2 2026</span>
          </div>
          <span className="text-[10px] text-gray-600 border border-gray-700 rounded px-1.5 py-0.5">
            {tickets.length} issues
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search issues..."
              className="w-44 pl-7 pr-2 py-1 text-[11px] bg-gray-800 border border-gray-700 rounded text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button className="px-2.5 py-1 text-[11px] bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors font-medium">
            + Create Issue
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 flex gap-3 p-3 overflow-x-auto hide-scrollbar">
        {COLUMNS.map((col) => {
          const colTickets = filteredTickets.filter((t) => t.status === col.id);
          return (
            <div key={col.id} className="flex-1 min-w-[200px] flex flex-col">
              {/* Column Header */}
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className={`w-2 h-2 rounded-full ${col.color} shadow-sm`} />
                <span className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider">
                  {col.id}
                </span>
                <span className="text-[10px] text-gray-600 font-mono ml-auto">
                  {colTickets.length}
                </span>
              </div>

              {/* Column Cards */}
              <div className="flex-1 space-y-2 overflow-y-auto hide-scrollbar min-h-[100px]">
                {colTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`bg-gray-900 rounded-lg border border-gray-800 p-2.5 cursor-default hover:border-gray-600 transition-all ${
                      animatingTickets.includes(ticket.id) ? "opacity-50 scale-95" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-mono text-gray-500">{ticket.id}</span>
                      <span
                        className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${PRIORITY_COLORS[ticket.priority] || "text-gray-400"}`}
                      >
                        {ticket.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-200 leading-relaxed mb-2">{ticket.title}</p>
                    <p className="text-[10px] text-gray-500 line-clamp-2 mb-2">{ticket.desc}</p>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-[7px] font-bold text-white">
                        {ticket.assignee === "you"
                          ? "YO"
                          : ticket.assignee.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-[9px] text-gray-600">{ticket.assignee}</span>
                      <div className="ml-auto flex gap-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-700" />
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-700" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
