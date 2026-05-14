"use client";

import { useState } from "react";
import BackButton from "@/components/ui/BackButton";

interface Ticket {
  id: string;
  title: string;
  priority: string;
  assignee: string;
  status: string;
  desc: string;
}

const INITIAL_TICKETS: Ticket[] = [
  { id: "AUTH-142", title: "Implement JWT refresh token rotation", priority: "High", assignee: "you", status: "In Progress", desc: "Add refresh token rotation to prevent token reuse attacks" },
  { id: "AUTH-143", title: "Rate limiting on login endpoint", priority: "Critical", assignee: "dev_team", status: "In Progress", desc: "Implement rate limiting middleware" },
  { id: "AUTH-140", title: "Add OAuth2.0 Google provider", priority: "Medium", assignee: "backend", status: "Review", desc: "Integrate Google OAuth for SSO" },
  { id: "AUTH-138", title: "Password reset flow", priority: "High", assignee: "backend", status: "Done", desc: "Forgot password with email verification" },
  { id: "AUTH-141", title: "Session management dashboard", priority: "Low", assignee: "frontend", status: "Backlog", desc: "Admin panel for active sessions" },
  { id: "AUTH-144", title: "Audit logging for auth events", priority: "Medium", assignee: "backend", status: "Backlog", desc: "Log login/logout/token refresh" },
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
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [searchQuery, setSearchQuery] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("Medium");
  const [nextId, setNextId] = useState(146);

  const filteredTickets = tickets.filter(
    (t) =>
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const moveTicket = (ticketId: string, newStatus: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
    );
  };

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const id = `AUTH-${nextId}`;
    setTickets((prev) => [
      ...prev,
      { id, title: newTitle.trim(), priority: newPriority, assignee: "you", status: "Backlog", desc: "New issue" },
    ]);
    setNextId((n) => n + 1);
    setNewTitle("");
    setShowCreate(false);
  };

  const handleDrop = (colId: string) => {
    if (draggingId) moveTicket(draggingId, colId);
    setDraggingId(null);
    setDropTarget(null);
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-950 rounded-lg overflow-hidden border border-gray-800 shadow-sm relative">
      <div className="bg-gray-900/80 border-b border-gray-800 px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-blue-400">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
            </svg>
            <span className="text-xs font-semibold uppercase tracking-wider">Sprint Planning - Q2 2026</span>
          </div>
          <span className="text-xs text-gray-500 border border-gray-700 rounded px-2 py-0.5">
            {tickets.length} issues
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search issues..."
            className="input-3d input-3d-sm w-48"
          />
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="px-3 py-2 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
          >
            + Create Issue
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-end gap-3 flex-wrap">
          <BackButton onClick={() => setShowCreate(false)} label="Back" className="mb-1" />
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-gray-500 block mb-1">Title</label>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="input-3d w-full"
              placeholder="Issue title..."
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Priority</label>
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              className="select-3d w-auto min-w-[120px]"
            >
              {["Critical", "High", "Medium", "Low"].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <button type="button" onClick={handleCreate} className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg">
            Add
          </button>
          <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200">
            Cancel
          </button>
        </div>
      )}

      <div className="flex-1 flex gap-3 p-3 overflow-x-auto thin-scrollbar">
        {COLUMNS.map((col) => {
          const colTickets = filteredTickets.filter((t) => t.status === col.id);
          return (
            <div
              key={col.id}
              className={`flex-1 min-w-[220px] flex flex-col rounded-lg transition-colors ${
                dropTarget === col.id ? "bg-blue-500/10 ring-1 ring-blue-500/40" : ""
              }`}
              onDragOver={(e) => { e.preventDefault(); setDropTarget(col.id); }}
              onDragLeave={() => setDropTarget(null)}
              onDrop={() => handleDrop(col.id)}
            >
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">{col.id}</span>
                <span className="text-xs text-gray-600 font-mono ml-auto">{colTickets.length}</span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto thin-scrollbar min-h-[120px]">
                {colTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    draggable
                    onDragStart={() => setDraggingId(ticket.id)}
                    onDragEnd={() => { setDraggingId(null); setDropTarget(null); }}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`bg-gray-900 rounded-lg border border-gray-800 p-3 cursor-grab active:cursor-grabbing hover:border-gray-600 transition-all ${
                      draggingId === ticket.id ? "opacity-50 scale-95" : ""
                    } ${selectedTicket?.id === ticket.id ? "ring-1 ring-blue-500" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-xs font-mono text-gray-500">{ticket.id}</span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${PRIORITY_COLORS[ticket.priority]}`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-200 leading-relaxed mb-1">{ticket.title}</p>
                    <p className="text-xs text-gray-500 line-clamp-2">{ticket.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedTicket && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedTicket(null)}>
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <BackButton onClick={() => setSelectedTicket(null)} label="Back to board" />
              <span className="text-xs font-mono text-gray-500">{selectedTicket.id}</span>
            </div>
            <input
              value={selectedTicket.title}
              onChange={(e) => {
                const title = e.target.value;
                setSelectedTicket((t) => t ? { ...t, title } : null);
                setTickets((prev) => prev.map((t) => t.id === selectedTicket.id ? { ...t, title } : t));
              }}
              className="input-3d w-full text-base font-medium mb-2"
            />
            <textarea
              value={selectedTicket.desc}
              onChange={(e) => {
                const desc = e.target.value;
                setSelectedTicket((t) => t ? { ...t, desc } : null);
                setTickets((prev) => prev.map((t) => t.id === selectedTicket.id ? { ...t, desc } : t));
              }}
              rows={3}
              className="textarea-3d w-full text-sm"
            />
            <p className="text-xs text-gray-500 mt-2">Drag card between columns to change status</p>
          </div>
        </div>
      )}
    </div>
  );
}
