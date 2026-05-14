"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CaroGameState } from "@/lib/types";
import {
  computeViewport,
  getPlayerSymbol,
  getStone,
  initialViewport,
  panViewport,
  CARO_VIEW_EXPAND,
} from "@/lib/caro";
import BackButton from "@/components/ui/BackButton";

const CELL_PX = 34;
const PAN_STEP = Math.floor(CARO_VIEW_EXPAND / 2);

interface CaroModeProps {
  roomId: string;
  userId: string;
  username: string;
}

export default function CaroMode({ roomId, userId, username }: CaroModeProps) {
  const [state, setState] = useState<CaroGameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [viewport, setViewport] = useState(initialViewport);
  const joinedRef = useRef(false);
  const boardRef = useRef<HTMLDivElement>(null);

  const loadState = useCallback(async () => {
    try {
      const res = await fetch(`/api/caro?roomId=${encodeURIComponent(roomId)}`);
      const data = await res.json();
      if (data.state) setState(data.state);
    } catch {
      setError("Could not load game");
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  const postAction = useCallback(
    async (action: string, extra?: Record<string, unknown>) => {
      setError(null);
      try {
        const res = await fetch("/api/caro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId, userId, username, action, ...extra }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Action failed");
          return;
        }
        if (data.state) setState(data.state);
      } catch {
        setError("Network error");
      }
    },
    [roomId, userId, username]
  );

  useEffect(() => {
    loadState();
  }, [loadState]);

  useEffect(() => {
    if (joinedRef.current) return;
    joinedRef.current = true;
    postAction("join");
  }, [postAction]);

  useEffect(() => {
    const es = new EventSource(
      `/api/chat/subscribe?roomId=${encodeURIComponent(roomId)}`
    );
    es.onmessage = (event) => {
      try {
        if (!event.data) return;
        const data = JSON.parse(event.data);
        if (data.type === "caro" && data.payload) {
          setState(data.payload);
        }
      } catch {
        // ignore
      }
    };
    return () => es.close();
  }, [roomId]);

  useEffect(() => {
    if (!state) return;
    setViewport((prev) =>
      computeViewport(prev, state.stones, state.lastMove)
    );
  }, [state?.stones, state?.lastMove, state?.version]);

  const mySymbol = state ? getPlayerSymbol(state, userId) : null;
  const isMyTurn =
    state?.status === "playing" &&
    mySymbol !== null &&
    state.currentTurn === mySymbol;

  const opponent = state?.players.find((p) => p.userId !== userId);
  const stones = state?.stones ?? {};
  const stoneCount = Object.keys(stones).length;

  const handleCellClick = (row: number, col: number) => {
    if (!isMyTurn) return;
    postAction("move", { row, col });
  };

  const winningSet = new Set(
    (state?.winningCells ?? []).map(([r, c]) => `${r},${c}`)
  );
  const last = state?.lastMove;

  const { originRow, originCol, size } = viewport;
  const rows = Array.from({ length: size }, (_, i) => originRow + i);
  const cols = Array.from({ length: size }, (_, i) => originCol + i);

  const centerBoard = () => {
    if (!state) return;
    setViewport(computeViewport(initialViewport(), stones, state.lastMove));
    boardRef.current?.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  if (loading && !state) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#1e1e1e] rounded-lg border border-gray-800 text-gray-500 text-sm">
        Loading grid...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#1e1e1e] rounded-lg overflow-hidden border border-gray-800 shadow-sm min-h-0">
      <div className="bg-[#252526] border-b border-gray-800 px-4 py-3 flex items-center justify-between gap-3 flex-wrap shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-5 h-5 text-green-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
          </svg>
          <span className="text-sm font-semibold text-gray-200 truncate">
            Team Grid — Unlimited Board
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={centerBoard}
            className="btn-3d btn-3d-secondary px-3 py-2 text-xs rounded-xl min-h-[36px]"
          >
            Center
          </button>
          <button
            type="button"
            onClick={() => setShowHelp((v) => !v)}
            className="btn-3d btn-3d-secondary px-3 py-2 text-xs rounded-xl min-h-[36px]"
          >
            {showHelp ? "Hide rules" : "Rules"}
          </button>
          <button
            type="button"
            onClick={() => {
              postAction("reset");
              setViewport(initialViewport());
            }}
            className="btn-3d btn-3d-secondary px-3 py-2 text-xs rounded-xl min-h-[36px]"
          >
            New game
          </button>
        </div>
      </div>

      {showHelp && (
        <div className="px-4 py-3 bg-[#2d2d30] border-b border-gray-800 text-xs text-gray-400 leading-relaxed">
          <BackButton onClick={() => setShowHelp(false)} label="Close" className="mb-2" />
          Bàn cờ <strong className="text-gray-300">không giới hạn</strong> — đánh ở bất kỳ ô trống nào trên lưới.
          Lưới tự mở rộng khi bạn đánh gần mép; dùng nút mũi tên hoặc <strong className="text-gray-300">Center</strong> để di chuyển vùng nhìn.
          Ai nối được 5 quân trước thì thắng.
        </div>
      )}

      <div className="px-4 py-2.5 bg-[#1a1a1a] border-b border-gray-800 flex flex-wrap items-center gap-3 text-xs shrink-0">
        <span className="text-gray-500">Status:</span>
        {state?.status === "waiting" && (
          <span className="text-yellow-400">Waiting for opponent…</span>
        )}
        {state?.status === "playing" && (
          <span className={isMyTurn ? "text-green-400 font-medium" : "text-gray-400"}>
            {isMyTurn
              ? "Your turn"
              : `${state.currentTurn === "X" ? "Player X" : "Player O"}'s turn`}
          </span>
        )}
        {state?.status === "finished" && state.winner && (
          <span className="text-green-400 font-medium">
            {state.winner === mySymbol ? "You win!" : `${state.winner} wins`}
          </span>
        )}
        <span className="text-gray-600">
          View {size}×{size} · {stoneCount} stones · ∞ board
        </span>
        {state?.players.map((p) => (
          <span
            key={p.userId}
            className={`px-2 py-0.5 rounded-md ${
              p.userId === userId ? "bg-white/10 text-gray-200" : "text-gray-500"
            }`}
          >
            {p.symbol}: {p.username}
            {p.userId === userId ? " (you)" : ""}
          </span>
        ))}
        {opponent && <span className="text-gray-600">vs {opponent.username}</span>}
      </div>

      {error && (
        <div className="px-4 py-2 text-xs text-red-400 bg-red-500/10 border-b border-red-500/20">
          {error}
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        <div className="flex flex-col justify-center gap-1 px-1 py-3 shrink-0 border-r border-gray-800/80">
          {(
            [
              ["↑", 0, -PAN_STEP],
              ["←", -PAN_STEP, 0],
              ["·", 0, 0],
              ["→", PAN_STEP, 0],
              ["↓", PAN_STEP, 0],
            ] as const
          ).map(([label, dr, dc]) => (
            <button
              key={label}
              type="button"
              disabled={label === "·"}
              onClick={() => label !== "·" && setViewport((v) => panViewport(v, dr, dc))}
              className={`w-8 h-8 text-xs rounded-lg border border-gray-700 ${
                label === "·"
                  ? "opacity-30 cursor-default"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
              }`}
              aria-label={label === "·" ? "Pan pad" : `Pan ${label}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div
          ref={boardRef}
          className="flex-1 overflow-auto thin-scrollbar p-4 min-h-0"
        >
          <div
            className="caro-board inline-grid gap-0 border border-gray-700 bg-[#107c41]/20 rounded-lg overflow-hidden shadow-lg mx-auto"
            style={{
              gridTemplateColumns: `repeat(${size}, ${CELL_PX}px)`,
            }}
          >
            {rows.map((row) =>
              cols.map((col) => {
                const cell = getStone(stones, row, col);
                const isWin = winningSet.has(`${row},${col}`);
                const isLast = last?.row === row && last?.col === col;
                const canPlay = isMyTurn && !cell;

                return (
                  <button
                    key={`${row}-${col}`}
                    type="button"
                    disabled={!canPlay}
                    onClick={() => handleCellClick(row, col)}
                    className={`caro-cell border border-[#2d5a3d]/60 flex items-center justify-center transition-colors ${
                      isWin
                        ? "bg-yellow-500/30 ring-1 ring-yellow-400/60"
                        : isLast
                        ? "bg-white/10"
                        : "bg-[#1a3d2a]/40 hover:bg-[#1f4d35]/60"
                    } ${canPlay ? "cursor-pointer hover:ring-1 hover:ring-green-400/40" : "cursor-default"}`}
                    style={{ width: CELL_PX, height: CELL_PX }}
                    aria-label={`Cell ${row}, ${col}`}
                  >
                    {cell === "X" && (
                      <span className="text-blue-400 font-bold text-base leading-none">✕</span>
                    )}
                    {cell === "O" && (
                      <span className="text-amber-400 font-bold text-base leading-none">○</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-2 border-t border-gray-800 text-[10px] text-gray-600 flex justify-between shrink-0">
        <span>
          Origin ({originRow}, {originCol}) · scroll or pan to explore
        </span>
        <span>{mySymbol ? `You are ${mySymbol}` : "Joining…"}</span>
      </div>
    </div>
  );
}
