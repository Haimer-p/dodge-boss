"use client";

import { DisguiseMode } from "@/lib/types";

interface ModeSelectorProps {
  selected: DisguiseMode;
  onSelect: (mode: DisguiseMode) => void;
}

const modes: { id: DisguiseMode; label: string; icon: string }[] = [
  { id: "document", label: "Docs", icon: "📄" },
  { id: "code-editor", label: "Code", icon: "💻" },
  { id: "terminal", label: "Terminal", icon: "⬛" },
  { id: "kanban", label: "Board", icon: "📋" },
  { id: "spreadsheet", label: "Sheet", icon: "📊" },
];

export default function ModeSelector({ selected, onSelect }: ModeSelectorProps) {
  return (
    <div className="flex gap-1">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onSelect(mode.id)}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all whitespace-nowrap ${
            selected === mode.id
              ? "bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/40 shadow-sm shadow-blue-500/10"
              : "text-gray-500 hover:text-gray-300 hover:bg-gray-800"
          }`}
        >
          <span className="text-sm leading-none">{mode.icon}</span>
          <span>{mode.label}</span>
        </button>
      ))}
    </div>
  );
}
