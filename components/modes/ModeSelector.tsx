"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DisguiseMode } from "@/lib/types";
import { GAME_MODES, WORK_MODES, getModeShortLabel, isGameMode } from "@/lib/modes";
import ModeIcon from "./ModeIcon";

interface ModeSelectorProps {
  selected: DisguiseMode;
  onSelect: (mode: DisguiseMode) => void;
}

function ModeOption({
  mode,
  selected,
  onSelect,
}: {
  mode: DisguiseMode;
  selected: DisguiseMode;
  onSelect: (mode: DisguiseMode) => void;
}) {
  const item = [...WORK_MODES, ...GAME_MODES].find((m) => m.id === mode);
  if (!item) return null;

  return (
    <button
      type="button"
      onClick={() => onSelect(mode)}
      className={`flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-medium text-left transition-colors min-h-[48px] touch-manipulation ${
        selected === mode
          ? "bg-blue-600/25 text-white ring-1 ring-blue-500/50"
          : "text-gray-300 bg-white/5 active:bg-white/10"
      }`}
    >
      <ModeIcon mode={mode} className="w-5 h-5 shrink-0" />
      <span>{item.label}</span>
    </button>
  );
}

function ModeGrid({
  modes,
  selected,
  onSelect,
}: {
  modes: { id: DisguiseMode; label: string }[];
  selected: DisguiseMode;
  onSelect: (mode: DisguiseMode) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {modes.map((mode) => (
        <ModeOption
          key={mode.id}
          mode={mode.id}
          selected={selected}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

export default function ModeSelector({ selected, onSelect }: ModeSelectorProps) {
  const [gamesOpen, setGamesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [playMenuPos, setPlayMenuPos] = useState<{ top: number; left: number } | null>(null);
  const playBtnRef = useRef<HTMLButtonElement>(null);
  const playMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useLayoutEffect(() => {
    if (!gamesOpen || isMobile || !playBtnRef.current) {
      setPlayMenuPos(null);
      return;
    }

    const update = () => {
      if (!playBtnRef.current) return;
      const rect = playBtnRef.current.getBoundingClientRect();
      setPlayMenuPos({
        top: rect.bottom + 6,
        left: rect.left,
      });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [gamesOpen, isMobile]);

  useEffect(() => {
    if (!gamesOpen || isMobile) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (playMenuRef.current?.contains(target)) return;
      if (playBtnRef.current?.contains(target)) return;
      setGamesOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [gamesOpen, isMobile]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const selectMode = (mode: DisguiseMode) => {
    onSelect(mode);
    setGamesOpen(false);
    setMobileOpen(false);
  };

  const mobileSheet =
    mobileOpen &&
    createPortal(
      <div className="fixed inset-0 z-[200] flex flex-col justify-end">
        <button
          type="button"
          className="absolute inset-0 bg-black/60 touch-manipulation"
          aria-label="Đóng menu chế độ"
          onClick={() => setMobileOpen(false)}
        />
        <div
          className="relative rounded-t-2xl border-t border-gray-700 bg-[#0f1219] shadow-2xl safe-area-pb max-h-[min(85vh,520px)] flex flex-col animate-fade-slide"
          role="dialog"
          aria-modal="true"
          aria-label="Chọn chế độ"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
            <span className="text-sm font-semibold text-gray-200">Chọn chế độ</span>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="p-2 -mr-2 text-gray-400 hover:text-white rounded-lg touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Đóng"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="overflow-y-auto thin-scrollbar p-4 space-y-5">
            <section>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
                Công việc
              </p>
              <ModeGrid modes={WORK_MODES} selected={selected} onSelect={selectMode} />
            </section>
            <section>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
                Play
              </p>
              <ModeGrid modes={GAME_MODES} selected={selected} onSelect={selectMode} />
            </section>
          </div>
        </div>
      </div>,
      document.body
    );

  const playMenu =
    gamesOpen &&
    playMenuPos &&
    !isMobile &&
    createPortal(
      <div
        ref={playMenuRef}
        className="fixed z-[200] min-w-[168px] rounded-xl border border-gray-700 bg-[#0f1219]/98 backdrop-blur-xl shadow-2xl p-1.5 animate-fade-slide"
        style={{ top: playMenuPos.top, left: playMenuPos.left }}
      >
        {GAME_MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => selectMode(mode.id)}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium text-left transition-colors min-h-[44px] touch-manipulation ${
              selected === mode.id
                ? "bg-white/10 text-white"
                : "text-gray-300 hover:bg-white/5 hover:text-gray-200"
            }`}
          >
            <ModeIcon mode={mode.id} className="w-4 h-4 shrink-0" />
            {mode.label}
          </button>
        ))}
      </div>,
      document.body
    );

  if (isMobile) {
    return (
      <>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="btn-3d btn-3d-secondary flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white min-h-[44px] touch-manipulation w-full"
        >
          <ModeIcon mode={selected} className="w-5 h-5 shrink-0" />
          <span className="truncate flex-1 text-left">{getModeShortLabel(selected)}</span>
          <svg className="w-4 h-4 shrink-0 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {mobileSheet}
      </>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {WORK_MODES.map((mode) => (
        <button
          key={mode.id}
          type="button"
          onClick={() => onSelect(mode.id)}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap min-h-[44px] touch-manipulation ${
            selected === mode.id
              ? "btn-3d btn-3d-secondary text-white ring-1 ring-white/20"
              : "text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent"
          }`}
        >
          <ModeIcon mode={mode.id} className="w-4 h-4 shrink-0" />
          <span>{mode.label}</span>
        </button>
      ))}

      <div className="relative">
        <button
          ref={playBtnRef}
          type="button"
          onClick={() => setGamesOpen((v) => !v)}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap min-h-[44px] touch-manipulation ${
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
          <svg
            className={`w-3 h-3 transition-transform ${gamesOpen ? "rotate-180" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {playMenu}
      </div>
    </div>
  );
}
