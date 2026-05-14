"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { StealthTheme } from "@/lib/types";
import IconButton from "@/components/ui/IconButton";
import Button from "@/components/ui/Button";

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
  const containerRef = useRef<HTMLDivElement>(null);

  const handleOpacity = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onOpacityChange(parseFloat(e.target.value));
    },
    [onOpacityChange]
  );

  const quickHide = useCallback(() => {
    onOpacityChange(currentOpacity > 0.3 ? 0.12 : 0.9);
  }, [currentOpacity, onOpacityChange]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <IconButton
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Stealth settings"
        title="Stealth settings"
        className="relative"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
        {currentOpacity < 0.5 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-sm shadow-yellow-400/50" />
        )}
      </IconButton>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 z-50 min-w-[240px]">
          <div className="glass rounded-xl p-4 shadow-2xl border border-white/10 animate-fade-slide">
            <div className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">
              Stealth Mode
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">Opacity</span>
                <span className="text-xs text-gray-500 font-mono">
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
                className="range-3d w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Ghost</span>
                <span>Full</span>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-xs text-gray-400 mb-2">Background</div>
              <div className="flex gap-2">
                {[
                  { id: "dark" as StealthTheme, color: "#030712", label: "Dark" },
                  { id: "light" as StealthTheme, color: "#f8fafc", label: "Light" },
                  { id: "gray" as StealthTheme, color: "#1f2937", label: "Gray" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onThemeChange(t.id)}
                    className={`flex-1 py-3 rounded-lg text-xs font-medium transition-all ${
                      currentTheme === t.id
                        ? "ring-2 ring-blue-500"
                        : "opacity-70 hover:opacity-100"
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

            <Button variant="ghost" fullWidth onClick={quickHide}>
              {currentOpacity > 0.3 ? "Quick Hide (12%)" : "Restore (90%)"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
