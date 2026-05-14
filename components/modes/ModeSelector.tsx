"use client";

import { useEffect, useRef, useState } from "react";
import { DisguiseMode } from "@/lib/types";
import { GAME_MODES, WORK_MODES, isGameMode } from "@/lib/modes";
import ModeIcon from "./ModeIcon";

interface ModeSelectorProps {
  selected: DisguiseMode;
  onSelect: (mode: DisguiseMode) => void;
}

export default function ModeSelector({ selected, onSelect }: ModeSelectorProps) {
  const [gamesOpen, setGamesOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gamesOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setGamesOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [gamesOpen]);

  const selectGame = (mode: DisguiseMode) => {
    onSelect(mode);
    setGamesOpen(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {WORK_MODES.map((mode) => (
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

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setGamesOpen((v) => !v)}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap min-h-[44px] ${
            isGameMode(selected)
              ? "btn-3d btn-3d-secondary text-white ring-1 ring-white/20"
              : "text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent"
          }`}
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <path d="M6 12h4m4 0h4" />
          </svg>
          <span>Play</span>
          <svg className={`w-3 h-3 transition-transform ${gamesOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {gamesOpen && (
          <div className="absolute top-full left-0 mt-1 z-50 min-w-[160px] glass rounded-xl border border-white/10 shadow-2xl p-1.5 animate-fade-slide">
            {GAME_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => selectGame(mode.id)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium text-left transition-colors ${
                  selected === mode.id
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                }`}
              >
                <ModeIcon mode={mode.id} className="w-4 h-4 shrink-0" />
                {mode.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
