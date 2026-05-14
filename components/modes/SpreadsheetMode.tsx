"use client";

import { useState } from "react";

const HEADERS = ["Metric", "Q1 2026", "Q2 2026", "Q3 2026 (Est.)", "QoQ Change", "Status"];

const INITIAL_ROWS: string[][] = [
  ["Active Users", "12,847", "15,234", "18,500", "+18.6%", "on-track"],
  ["New Sign-ups", "3,421", "5,678", "7,200", "+66.0%", "on-track"],
  ["Auth Success Rate", "94.2%", "96.8%", "98.0%", "+2.6pp", "on-track"],
  ["Avg Response Time", "245ms", "128ms", "80ms", "-47.8%", "on-track"],
  ["Error Rate (5xx)", "2.1%", "0.8%", "0.3%", "-61.9%", "improving"],
  ["MFA Adoption", "23.5%", "42.1%", "65.0%", "+18.6pp", "needs-attention"],
  ["API Latency P99", "890ms", "420ms", "200ms", "-52.8%", "on-track"],
  ["Security Score", "72/100", "85/100", "92/100", "+13pts", "on-track"],
];

function getStatusColor(status: string): string {
  switch (status) {
    case "on-track": return "text-green-400";
    case "improving": return "text-yellow-400";
    case "needs-attention": return "text-red-400";
    default: return "text-gray-400";
  }
}

export default function SpreadsheetMode() {
  const [rows, setRows] = useState(INITIAL_ROWS);
  const [activeCell, setActiveCell] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const startEdit = (ri: number, ci: number) => {
    const id = `${ri}-${ci}`;
    setActiveCell(id);
    setEditingCell(id);
    setEditValue(rows[ri][ci]);
  };

  const commitEdit = () => {
    if (!editingCell) return;
    const [ri, ci] = editingCell.split("-").map(Number);
    setRows((prev) => {
      const next = prev.map((r) => [...r]);
      next[ri][ci] = editValue;
      return next;
    });
    setEditingCell(null);
  };

  const cellLabel = (id: string | null) => {
    if (!id) return "A1";
    const [ri, ci] = id.split("-").map(Number);
    return `${String.fromCharCode(65 + ci)}${ri + 1}`;
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-950 rounded-lg overflow-hidden border border-gray-800 shadow-sm">
      <div className="bg-gray-900/90 border-b border-gray-800 px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-200 uppercase tracking-wider">Q2 Report - Auth Service KPIs</span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-500 font-mono">Double-click cell to edit</span>
        </div>
        <button
          type="button"
          onClick={() => setRows(INITIAL_ROWS)}
          className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg transition-colors"
        >
          Reset data
        </button>
      </div>

      <div className="bg-gray-900/50 border-b border-gray-800 px-3 py-1.5 flex items-center gap-2 text-xs">
        <span className="text-gray-600 font-mono min-w-[60px]">{cellLabel(activeCell)}</span>
        <span className="text-gray-700">|</span>
        <span className="text-gray-500 italic flex-1 truncate">
          {activeCell
            ? rows[parseInt(activeCell.split("-")[0])]?.[parseInt(activeCell.split("-")[1])]
            : "Select or double-click a cell"}
        </span>
      </div>

      <div className="flex-1 overflow-auto thin-scrollbar">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              {HEADERS.map((header, i) => (
                <th
                  key={i}
                  className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-900 border-b border-r border-gray-800 sticky top-0"
                  style={{ minWidth: i === 0 ? 160 : 100 }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? "bg-gray-900/30" : "bg-gray-950"}>
                {row.map((cell, ci) => {
                  const cellId = `${ri}-${ci}`;
                  const isEditing = editingCell === cellId;
                  return (
                    <td
                      key={ci}
                      onClick={() => setActiveCell(cellId)}
                      onDoubleClick={() => startEdit(ri, ci)}
                      className={`px-3 py-2 text-xs border-b border-r border-gray-800 cursor-cell transition-colors ${
                        activeCell === cellId ? "bg-blue-500/20 ring-1 ring-inset ring-blue-500" : ""
                      } ${
                        ci === 0 ? "text-gray-300 font-medium" : ci === 4 ? "text-yellow-400 font-mono" : ci === 5 ? getStatusColor(cell) : "text-gray-300 font-mono"
                      }`}
                    >
                      {isEditing ? (
                        <input
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitEdit();
                            if (e.key === "Escape") setEditingCell(null);
                          }}
                          className="input-3d input-3d-sm w-full text-xs py-1"
                        />
                      ) : (
                        cell
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
