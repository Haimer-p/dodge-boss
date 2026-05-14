"use client";

import { useEffect, useRef, useState } from "react";
import { BowlingGameState } from "@/lib/bowling";
import { useRoomGame } from "@/hooks/useRoomGame";

interface BowlingModeProps {
  roomId: string;
  userId: string;
  username: string;
}

export default function BowlingMode({ roomId, userId, username }: BowlingModeProps) {
  const { state, error, loading, postAction } = useRoomGame<BowlingGameState>({
    roomId,
    channel: "bowling",
    apiPath: "/api/game/bowling",
    userId,
    username,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [power, setPower] = useState(0.65);
  const [angle, setAngle] = useState(0);

  const current = state?.players[state?.currentPlayerIndex ?? 0];
  const isMyTurn = state?.status === "playing" && current?.userId === userId;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !state) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#334155";
    ctx.fillRect(W * 0.35, H * 0.15, W * 0.3, H * 0.7);

    const pinY = H * 0.22;
    const pinSpacing = W * 0.04;
    const startX = W / 2 - pinSpacing * 1.5;
    const layout = [
      [0, 1, 2, 3],
      [0, 1, 2],
      [0, 1],
      [0],
    ];
    let pinIdx = 0;
    layout.forEach((row, ri) => {
      const rowW = (row.length - 1) * pinSpacing;
      const rowStart = W / 2 - rowW / 2;
      row.forEach((_, ci) => {
        const standing = state.pins[pinIdx] ?? true;
        if (standing) {
          ctx.fillStyle = "#f8fafc";
          ctx.beginPath();
          ctx.arc(rowStart + ci * pinSpacing, pinY + ri * pinSpacing * 1.2, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#94a3b8";
          ctx.stroke();
        }
        pinIdx++;
      });
    });

    const ballY = H * 0.88;
    const ballX = W / 2 + angle * 2;
    ctx.fillStyle = "#3b82f6";
    ctx.beginPath();
    ctx.arc(ballX, ballY, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#60a5fa";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ballX, ballY);
    ctx.lineTo(ballX + angle * 3, ballY - power * H * 0.35);
    ctx.stroke();
  }, [state, power, angle]);

  if (loading && !state) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-500 text-sm">
        Loading lane…
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-950 rounded-lg overflow-hidden border border-slate-800 shadow-sm min-h-0">
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between gap-3 flex-wrap shrink-0">
        <span className="text-sm font-semibold text-slate-200">
          Lane Metrics — Throughput Simulator
        </span>
        <button
          type="button"
          onClick={() => postAction("reset")}
          className="btn-3d btn-3d-secondary px-3 py-2 text-xs rounded-xl min-h-[36px]"
        >
          New game
        </button>
      </div>

      <div className="px-4 py-2 border-b border-slate-800 text-xs flex flex-wrap gap-3 shrink-0">
        {state?.status === "waiting" && (
          <span className="text-yellow-400">Waiting for opponent…</span>
        )}
        {state?.status === "playing" && (
          <span className={isMyTurn ? "text-green-400" : "text-slate-400"}>
            Frame {state.frame}/10 · Roll {state.rollInFrame} ·{" "}
            {isMyTurn ? "Your roll" : `${current?.username}'s roll`}
          </span>
        )}
        {state?.players.map((p) => (
          <span key={p.userId} className="text-slate-500">
            {p.username}: {state.totalScores[p.userId] ?? 0}
            {p.userId === userId ? " (you)" : ""}
          </span>
        ))}
        {state?.lastRoll && (
          <span className="text-slate-600">
            Last: {state.lastRoll.pinsKnocked} pins
          </span>
        )}
      </div>

      {error && (
        <div className="px-4 py-2 text-xs text-red-400 bg-red-500/10 border-b border-red-500/20">
          {error}
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4 min-h-0">
        <canvas ref={canvasRef} width={320} height={400} className="rounded-xl border border-slate-700 max-w-full" />

        <div className="w-full max-w-xs space-y-3">
          <label className="block text-xs text-slate-400">
            Power
            <input
              type="range"
              min="0.2"
              max="1"
              step="0.05"
              value={power}
              onChange={(e) => setPower(parseFloat(e.target.value))}
              disabled={!isMyTurn}
              className="range-3d w-full mt-1"
            />
          </label>
          <label className="block text-xs text-slate-400">
            Angle
            <input
              type="range"
              min="-30"
              max="30"
              step="1"
              value={angle}
              onChange={(e) => setAngle(parseFloat(e.target.value))}
              disabled={!isMyTurn}
              className="range-3d w-full mt-1"
            />
          </label>
          <button
            type="button"
            disabled={!isMyTurn}
            onClick={() => postAction("roll", { power, angle })}
            className="btn-3d btn-3d-primary w-full py-3 text-sm rounded-xl disabled:opacity-40"
          >
            Roll
          </button>
        </div>
      </div>
    </div>
  );
}
