"use client";

import { useEffect, useState, useRef } from "react";

const HEADERS = [
  "Metric",
  "Q1 2026",
  "Q2 2026",
  "Q3 2026 (Est.)",
  "QoQ Change",
  "Status",
];

const ROWS = [
  ["Active Users", "12,847", "15,234", "18,500", "+18.6%", "on-track"],
  ["New Sign-ups", "3,421", "5,678", "7,200", "+66.0%", "on-track"],
  ["Auth Success Rate", "94.2%", "96.8%", "98.0%", "+2.6pp", "on-track"],
  ["Avg Response Time", "245ms", "128ms", "80ms", "-47.8%", "on-track"],
  ["Error Rate (5xx)", "2.1%", "0.8%", "0.3%", "-61.9%", "improving"],
  ["Token Refresh Rate", "78.3%", "89.2%", "95.0%", "+10.9pp", "on-track"],
  ["MFA Adoption", "23.5%", "42.1%", "65.0%", "+18.6pp", "needs-attention"],
  ["API Latency P99", "890ms", "420ms", "200ms", "-52.8%", "on-track"],
  ["Security Score", "72/100", "85/100", "92/100", "+13pts", "on-track"],
  ["Incident Count", "12", "5", "2", "-58.3%", "on-track"],
  ["Support Tickets", "84", "52", "30", "-38.1%", "on-track"],
  ["Deployment Freq.", "1/week", "3/week", "daily", "+200%", "on-track"],
];

function getStatusColor(status: string): string {
  switch (status) {
    case "on-track":
      return "text-green-400";
    case "improving":
      return "text-yellow-400";
    case "needs-attention":
      return "text-red-400";
    default:
      return "text-gray-400";
  }
}

export default function SpreadsheetMode() {
  const [activeCell, setActiveCell] = useState<string | null>(null);
  const [highlightedRow, setHighlightedRow] = useState<number | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [currentViewRow, setCurrentViewRow] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Auto scroll through rows periodically
  useEffect(() => {
    if (!autoScroll) return;

    const interval = setInterval(() => {
      setCurrentViewRow((prev) => {
        // Cycle through highlighting each row
        const nextRow = prev + 1;
        if (nextRow >= ROWS.length) {
          return 0;
        }
        return nextRow;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [autoScroll]);

  // Clicking anywhere stops auto-scroll
  const handleCellClick = (row: number, col: number) => {
    setAutoScroll(false);
    setActiveCell(`${row}-${col}`);
    setHighlightedRow(row);
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-950 rounded-lg overflow-hidden border border-gray-800 shadow-sm">
      {/* Excel-style top bar */}
      <div className="bg-gray-900/90 border-b border-gray-800 px-4 py-1.5 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-green-400">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 2h12l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm0 2v16h12V7h-4V3H6zm2 6h8v2H8v-2zm0 4h8v2H8v-2z" />
            </svg>
            <span className="font-semibold text-gray-200 uppercase tracking-wider">Q2 Report - Auth Service KPIs</span>
          </div>
          <span className="text-gray-600">|</span>
          <span className="text-gray-500 font-mono">Last updated: 2 min ago</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] ${autoScroll ? "text-green-500" : "text-gray-600"} flex items-center gap-1`}>
            <span className={`w-1.5 h-1.5 rounded-full ${autoScroll ? "bg-green-500" : "bg-gray-600"}`} />
            Auto-scroll
          </span>
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className="px-2 py-0.5 text-[10px] bg-gray-800 hover:bg-gray-700 text-gray-400 rounded transition-colors"
          >
            {autoScroll ? "Pause" : "Resume"}
          </button>
        </div>
      </div>

      {/* Formula bar */}
      <div className="bg-gray-900/50 border-b border-gray-800 px-3 py-1 flex items-center gap-2 text-[10px]">
        <span className="text-gray-600 font-mono min-w-[60px]">
          {activeCell ? `${String.fromCharCode(65 + parseInt(activeCell.split("-")[1]))}${parseInt(activeCell.split("-")[0]) + 1}` : "A1"}
        </span>
        <span className="text-gray-700">|</span>
        <span className="text-gray-500 italic">
          {activeCell ? ROWS[parseInt(activeCell.split("-")[0])]?.[parseInt(activeCell.split("-")[1])] || "" : "Click a cell to select"}
        </span>
      </div>

      {/* Spreadsheet Grid */}
      <div ref={sheetRef} className="flex-1 overflow-auto hide-scrollbar">
        <table className="w-full border-collapse text-xs">
          {/* Header row */}
          <thead>
            <tr className="sticky top-0 z-10">
              {HEADERS.map((header, i) => (
                <th
                  key={i}
                  className="text-left px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-900 border-b border-r border-gray-800 sticky top-0"
                  style={{ minWidth: i === 0 ? 160 : i === HEADERS.length - 1 ? 90 : 100 }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, ri) => (
              <tr
                key={ri}
                className={`transition-colors ${
                  highlightedRow === ri
                    ? "bg-blue-500/5"
                    : ri % 2 === 0
                    ? "bg-gray-900/30"
                    : "bg-gray-950"
                } hover:bg-blue-500/10`}
              >
                {row.map((cell, ci) => {
                  const cellId = `${ri}-${ci}`;
                  const isActive = activeCell === cellId;

                  return (
                    <td
                      key={ci}
                      onClick={() => handleCellClick(ri, ci)}
                      className={`px-3 py-2 text-xs border-b border-r border-gray-800 cursor-default transition-colors ${
                        isActive
                          ? "bg-blue-500/20 ring-1 ring-inset ring-blue-500"
                          : ""
                      } ${
                        ci === 0
                          ? "text-gray-300 font-medium"
                          : ci === 4
                          ? "text-yellow-400 font-mono"
                          : ci === 5
                          ? getStatusColor(cell)
                          : "text-gray-300 font-mono"
                      }`}
                    >
                      {cell}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom status */}
      <div className="bg-gray-900/80 border-t border-gray-800 px-3 py-1 flex items-center justify-between text-[10px] text-gray-600">
        <div className="flex items-center gap-3">
          <span>Sheet: Q2_KPI_Report</span>
          <span>Rows: {ROWS.length}</span>
          <span>Cols: {HEADERS.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-700">READY</span>
        </div>
      </div>
    </div>
  );
}
