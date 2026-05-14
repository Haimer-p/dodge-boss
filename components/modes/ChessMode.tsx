"use client";

import { useCallback, useMemo, useState } from "react";
import { Chessboard } from "react-chessboard";
import { ChessGameState } from "@/lib/chess-game";
import { getChessPlayerColor } from "@/lib/chess-game";
import { useRoomGame } from "@/hooks/useRoomGame";

interface ChessModeProps {
  roomId: string;
  userId: string;
  username: string;
}

export default function ChessMode({ roomId, userId, username }: ChessModeProps) {
  const { state, error, loading, postAction } = useRoomGame<ChessGameState>({
    roomId,
    channel: "chess",
    apiPath: "/api/game/chess",
    userId,
    username,
  });

  const myColor = state ? getChessPlayerColor(state, userId) : null;
  const isMyTurn =
    state?.status === "playing" &&
    myColor !== null &&
    state.turn === myColor;

  const boardOrientation = myColor === "b" ? "black" : "white";

  const onDrop = useCallback(
    ({
      sourceSquare,
      targetSquare,
    }: {
      sourceSquare: string;
      targetSquare: string | null;
    }) => {
      if (!isMyTurn || !targetSquare) return false;
      postAction("move", { from: sourceSquare, to: targetSquare });
      return true;
    },
    [isMyTurn, postAction]
  );

  const statusText = useMemo(() => {
    if (!state) return "";
    if (state.status === "waiting") return "Waiting for opponent…";
    if (state.status === "finished") {
      if (state.winner === "draw") return "Draw";
      if (state.winner === myColor) return "You win!";
      return "Opponent wins";
    }
    return isMyTurn ? "Your turn" : "Opponent's turn";
  }, [state, isMyTurn, myColor]);

  if (loading && !state) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-950 text-gray-500 text-sm">
        Loading board…
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-950 rounded-lg overflow-hidden border border-gray-800 shadow-sm min-h-0">
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between gap-3 flex-wrap shrink-0">
        <span className="text-sm font-semibold text-gray-200">
          Strategy Matrix — Sprint Planning
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => postAction("resign")}
            className="btn-3d btn-3d-secondary px-3 py-2 text-xs rounded-xl min-h-[36px]"
          >
            Resign
          </button>
          <button
            type="button"
            onClick={() => postAction("reset")}
            className="btn-3d btn-3d-secondary px-3 py-2 text-xs rounded-xl min-h-[36px]"
          >
            New game
          </button>
        </div>
      </div>

      <div className="px-4 py-2 border-b border-gray-800 text-xs flex flex-wrap gap-3 shrink-0">
        <span className={isMyTurn ? "text-green-400" : "text-gray-400"}>{statusText}</span>
        {state?.players.map((p) => (
          <span key={p.userId} className="text-gray-500">
            {p.color === "w" ? "White" : "Black"}: {p.username}
            {p.userId === userId ? " (you)" : ""}
          </span>
        ))}
        {state?.lastMove && (
          <span className="text-gray-600">Last: {state.lastMove.san}</span>
        )}
      </div>

      {error && (
        <div className="px-4 py-2 text-xs text-red-400 bg-red-500/10 border-b border-red-500/20">
          {error}
        </div>
      )}

      <div className="flex-1 flex items-center justify-center p-4 min-h-0 overflow-auto">
        <div className="w-full max-w-[min(100%,480px)] aspect-square">
          <Chessboard
            options={{
              position: state?.fen ?? "start",
              boardOrientation,
              allowDragging: isMyTurn,
              onPieceDrop: onDrop,
              darkSquareStyle: { backgroundColor: "#374151" },
              lightSquareStyle: { backgroundColor: "#4b5563" },
            }}
          />
        </div>
      </div>
    </div>
  );
}
