"use client";

import { DisguiseMode } from "@/lib/types";
import ModeIcon from "./ModeIcon";

interface ModeSelectorProps {
  selected: DisguiseMode;
  onSelect: (mode: DisguiseMode) => void;
}

const modes: { id: DisguiseMode; label: string }[] = [
  { id: "document", label: "Docs" },
  { id: "code-editor", label: "Code" },
  { id: "terminal", label: "Terminal" },
  { id: "kanban", label: "Board" },
  { id: "spreadsheet", label: "Sheet" },
];

export default function ModeSelector({ selected, onSelect }: ModeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onSelect(mode.id)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap ${
            selected === mode.id
              ? "bg-white/10 text-white ring-1 ring-white/20"
              : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
          }`}
        >
          <ModeIcon mode={mode.id} className="w-3.5 h-3.5 shrink-0" />
          <span>{mode.label}</span>
        </button>
      ))}
    </div>
  );
}
