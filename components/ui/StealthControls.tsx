"use client";

import { useState, useCallback } from "react";
import { StealthTheme } from "@/lib/types";

interface StealthControlsProps {
  onOpacityChange: (value: number) => void;
  onThemeChange: (theme: StealthTheme) => void;
  currentOpacity: number;
  currentTheme: StealthTheme;
}

export default function StealthControls({
  onOpacityChange,
  onThemeChange,
  currentOpacity,
  currentTheme,
}: StealthControlsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpacity = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onOpacityChange(parseFloat(e.target.value));
    },
    [onOpacityChange]
  );

  const quickHide = useCallback(() => {
    onOpacityChange(currentOpacity > 0.3 ? 0.12 : 0.9);
  }, [currentOpacity, onOpacityChange]);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-all"
        title="Stealth Settings"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
        {currentOpacity < 0.5 && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-yellow-400 shadow-sm shadow-yellow-400/50" />
        )}
      </button>

      {isOpen && (
        <div
          className="absolute top-full right-0 mt-1.5 z-50 min-w-[220px]"
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="glass rounded-xl p-4 shadow-2xl border border-white/10 animate-fade-slide">
            <div className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider mb-3">
              Stealth Mode
            </div>

            {/* Opacity */}
            <div className="mb-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-gray-400">Opacity</span>
                <span className="text-[10px] text-gray-500 font-mono">
                  {Math.round(currentOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1"
                step="0.05"
                value={currentOpacity}
                onChange={handleOpacity}
                className="w-full h-1 bg-gray-700 rounded-full appearance-none cursor-pointer accent-blue-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:shadow-blue-500/50"
                style={{
                  background: `linear-gradient(to right, #3b82f6 ${currentOpacity * 100}%, #374151 ${currentOpacity * 100}%)`,
                }}
              />
              <div className="flex justify-between text-[9px] text-gray-600 mt-0.5">
                <span>Ghost</span>
                <span>Full</span>
              </div>
            </div>

            {/* Theme */}
            <div className="mb-3">
              <div className="text-[11px] text-gray-400 mb-1.5">Background</div>
              <div className="flex gap-1.5">
                {[
                  { id: "dark" as StealthTheme, color: "#030712", label: "Dark" },
                  { id: "light" as StealthTheme, color: "#f8fafc", label: "Light" },
                  { id: "gray" as StealthTheme, color: "#374151", label: "Gray" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onThemeChange(t.id)}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-medium transition-all ${
                      currentTheme === t.id
                        ? "ring-2 ring-blue-500"
                        : "opacity-60 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: t.color }}
                  >
                    <span className={t.id === "light" ? "text-gray-800" : "text-gray-300"}>
                      {t.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Hide */}
            <button
              onClick={quickHide}
              className="w-full py-1.5 text-[10px] font-medium text-gray-400 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors"
            >
              {currentOpacity > 0.3 ? "Quick Hide (12%)" : "Restore (90%)"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
