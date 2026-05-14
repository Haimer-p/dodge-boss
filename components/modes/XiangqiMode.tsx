"use client";

import { useState } from "react";
import {
  XIANGQI_COLS,
  XIANGQI_ROWS,
  XiangqiGameState,
  getXiangqiPlayerColor,
} from "@/lib/xiangqi";
import { useRoomGame } from "@/hooks/useRoomGame";
import XiangqiPiece from "./XiangqiPiece";

const CELL = 48;

interface XiangqiModeProps {
  roomId: string;
  userId: string;
  username: string;
}

export default function XiangqiMode({ roomId, userId, username }: XiangqiModeProps) {
  const { state, error, loading, postAction } = useRoomGame<XiangqiGameState>({
    roomId,
    channel: "xiangqi",
    apiPath: "/api/game/xiangqi",
    userId,
    username,
  });

  const [selected, setSelected] = useState<[number, number] | null>(null);
  const myColor = state ? getXiangqiPlayerColor(state, userId) : null;
  const isMyTurn =
    state?.status === "playing" &&
    myColor !== null &&
    state.turn === myColor;

  const lastMove = state?.lastMove;

  const handleCell = (row: number, col: number) => {
    if (!isMyTurn || !state) return;
    const piece = state.board[row][col];
    if (selected) {
      const [sr, sc] = selected;
      if (sr === row && sc === col) {
        setSelected(null);
        return;
      }
      postAction("move", { fromRow: sr, fromCol: sc, toRow: row, toCol: col });
      setSelected(null);
    } else if (piece && piece.startsWith(myColor)) {
      setSelected([row, col]);
    }
  };

  if (loading && !state) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#2c1810] text-amber-200/60 text-sm">
        Loading board…
      </div>
    );
  }

  const board = state?.board ?? [];
  const boardW = XIANGQI_COLS * CELL;
  const boardH = XIANGQI_ROWS * CELL;

  return (
    <div className="flex-1 flex flex-col bg-[#2c1810] rounded-lg overflow-hidden border border-amber-900/40 shadow-sm min-h-0">
      <div className="bg-[#3d2418] border-b border-amber-900/40 px-4 py-3 flex items-center justify-between gap-3 flex-wrap shrink-0">
        <span className="text-sm font-semibold text-amber-100">
          Cell War — Regional Grid Analysis
        </span>
        <button
          type="button"
          onClick={() => {
            postAction("reset");
            setSelected(null);
          }}
          className="btn-3d btn-3d-secondary px-3 py-2 text-xs rounded-xl min-h-[36px]"
        >
          New game
        </button>
      </div>

      <div className="px-4 py-2 border-b border-amber-900/30 text-xs flex flex-wrap gap-3 text-amber-200/70 shrink-0">
        {state?.status === "waiting" && <span className="text-yellow-400">Waiting for opponent…</span>}
        {state?.status === "playing" && (
          <span className={isMyTurn ? "text-green-400" : ""}>
            {isMyTurn ? "Your turn — chọn quân rồi chọn ô đích" : "Opponent's turn"}
          </span>
        )}
        {state?.status === "finished" && state.winner && (
          <span className="text-green-400">
            {state.winner === myColor ? "You win!" : "Opponent wins"}
          </span>
        )}
        {state?.players.map((p) => (
          <span key={p.userId}>
            {p.color === "r" ? "🔴 Đỏ" : "⚫ Đen"}: {p.username}
            {p.userId === userId ? " (you)" : ""}
          </span>
        ))}
      </div>

      {error && (
        <div className="px-4 py-2 text-xs text-red-400 bg-red-500/10 border-b border-red-500/20">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-auto thin-scrollbar p-4 flex items-center justify-center min-h-0">
        <div
          className="relative rounded-lg shadow-2xl border-4 border-amber-900"
          style={{
            width: boardW,
            height: boardH,
            background: "linear-gradient(145deg, #c9a66b 0%, #a67c3d 50%, #8b6530 100%)",
          }}
        >
          {/* Board grid lines */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={boardW}
            height={boardH}
            viewBox={`0 0 ${boardW} ${boardH}`}
          >
            {/* Horizontal lines */}
            {Array.from({ length: XIANGQI_ROWS }, (_, r) => (
              <line
                key={`h${r}`}
                x1={CELL / 2}
                y1={r * CELL + CELL / 2}
                x2={boardW - CELL / 2}
                y2={r * CELL + CELL / 2}
                stroke="#5c3d1e"
                strokeWidth="1.5"
              />
            ))}
            {/* Vertical lines */}
            {Array.from({ length: XIANGQI_COLS }, (_, c) => (
              <line
                key={`v${c}`}
                x1={c * CELL + CELL / 2}
                y1={CELL / 2}
                x2={c * CELL + CELL / 2}
                y2={boardH - CELL / 2}
                stroke="#5c3d1e"
                strokeWidth="1.5"
              />
            ))}
            {/* River label */}
            <text
              x={boardW / 2}
              y={4.5 * CELL + CELL / 2 + 4}
              textAnchor="middle"
              fill="#5c3d1e"
              fontSize="13"
              fontWeight="600"
              opacity="0.7"
            >
              楚河 · 漢界
            </text>
            {/* Red palace diagonals */}
            <line x1={3 * CELL + CELL / 2} y1={7 * CELL + CELL / 2} x2={5 * CELL + CELL / 2} y2={9 * CELL + CELL / 2} stroke="#5c3d1e" strokeWidth="1.2" />
            <line x1={5 * CELL + CELL / 2} y1={7 * CELL + CELL / 2} x2={3 * CELL + CELL / 2} y2={9 * CELL + CELL / 2} stroke="#5c3d1e" strokeWidth="1.2" />
            {/* Black palace diagonals */}
            <line x1={3 * CELL + CELL / 2} y1={0 * CELL + CELL / 2} x2={5 * CELL + CELL / 2} y2={2 * CELL + CELL / 2} stroke="#5c3d1e" strokeWidth="1.2" />
            <line x1={5 * CELL + CELL / 2} y1={0 * CELL + CELL / 2} x2={3 * CELL + CELL / 2} y2={2 * CELL + CELL / 2} stroke="#5c3d1e" strokeWidth="1.2" />
            {/* Last move highlight */}
            {lastMove && (
              <>
                <rect
                  x={lastMove.from[1] * CELL + 4}
                  y={lastMove.from[0] * CELL + 4}
                  width={CELL - 8}
                  height={CELL - 8}
                  fill="rgba(250,204,21,0.25)"
                  rx="4"
                />
                <rect
                  x={lastMove.to[1] * CELL + 4}
                  y={lastMove.to[0] * CELL + 4}
                  width={CELL - 8}
                  height={CELL - 8}
                  fill="rgba(250,204,21,0.4)"
                  rx="4"
                />
              </>
            )}
          </svg>

          {/* Intersection cells for clicks + pieces */}
          <div
            className="absolute inset-0 grid"
            style={{
              gridTemplateColumns: `repeat(${XIANGQI_COLS}, ${CELL}px)`,
              gridTemplateRows: `repeat(${XIANGQI_ROWS}, ${CELL}px)`,
            }}
          >
            {Array.from({ length: XIANGQI_ROWS }, (_, row) =>
              Array.from({ length: XIANGQI_COLS }, (_, col) => {
                const piece = board[row]?.[col] ?? "";
                const isSel = selected?.[0] === row && selected?.[1] === col;
                return (
                  <button
                    key={`${row}-${col}`}
                    type="button"
                    onClick={() => handleCell(row, col)}
                    className="flex items-center justify-center transition-colors hover:bg-black/10"
                    aria-label={piece ? `Piece at ${row},${col}` : `Empty ${row},${col}`}
                  >
                    {piece ? (
                      <XiangqiPiece code={piece} size={40} selected={isSel} />
                    ) : isSel ? (
                      <span className="w-3 h-3 rounded-full bg-yellow-400/60" />
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
