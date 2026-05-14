"use client";

import { useState } from "react";
import { ARCADE_GAMES } from "@/lib/game-embeds";
import BackButton from "@/components/ui/BackButton";

export default function ArcadeMode() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = ARCADE_GAMES.find((g) => g.id === activeId);

  if (active) {
    return (
      <div className="flex-1 flex flex-col bg-[#1a1a2e] rounded-lg overflow-hidden border border-gray-800 shadow-sm min-h-0">
        <div className="shrink-0 px-4 py-3 border-b border-gray-800 flex items-center gap-3 bg-[#252526]">
          <BackButton onClick={() => setActiveId(null)} label="Back to library" />
          <span className="text-sm font-semibold text-gray-200 truncate">
            {active.disguiseLabel}
          </span>
        </div>
        <iframe
          src={active.url}
          title={active.title}
          className="flex-1 w-full border-0 bg-black min-h-0"
          sandbox="allow-scripts allow-same-origin allow-popups"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#1a1a2e] rounded-lg overflow-hidden border border-gray-800 shadow-sm min-h-0">
      <div className="bg-[#252526] border-b border-gray-800 px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h10v2H4v-2z" />
          </svg>
          <span className="text-sm font-semibold text-gray-200">
            Training Modules — Interactive Library
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Self-hosted drills and approved external streams. No ROM / pirated games.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto thin-scrollbar p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ARCADE_GAMES.map((game) => (
          <button
            key={game.id}
            type="button"
            onClick={() => setActiveId(game.id)}
            className="text-left p-4 rounded-xl border border-gray-800 bg-gray-900/80 hover:border-purple-500/40 hover:bg-gray-900 transition-all"
          >
            <p className="text-sm font-semibold text-gray-200">{game.title}</p>
            <p className="text-xs text-gray-500 mt-1">{game.description}</p>
            {game.external && (
              <span className="inline-block mt-2 text-[10px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                External
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
