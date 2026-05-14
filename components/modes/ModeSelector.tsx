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
  { id: "email", label: "Mail" },
  { id: "dashboard", label: "Metrics" },
  { id: "music", label: "Music" },
  { id: "youtube", label: "YouTube" },
  { id: "google", label: "Google" },
];

export default function ModeSelector({ selected, onSelect }: ModeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onSelect(mode.id)}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap min-h-[44px] ${
            selected === mode.id
              ? "btn-3d btn-3d-secondary text-white ring-1 ring-white/20"
              : "text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent"
          }`}
        >
          <ModeIcon mode={mode.id} className="w-4 h-4 shrink-0" />
          <span>{mode.label}</span>
        </button>
      ))}
    </div>
  );
}
