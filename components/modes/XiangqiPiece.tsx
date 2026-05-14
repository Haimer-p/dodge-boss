"use client";

import type { FC, SVGProps } from "react";

interface PieceIconProps {
  className?: string;
}

type PieceIcon = FC<SVGProps<SVGSVGElement>>;

function IconKing({ className }: PieceIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 18h16v2H4v-2zm2-2l2-8h2l1 4 1-4h2l2 8H6zm2.2-6h7.6L12 6.5 8.2 10z" />
    </svg>
  );
}

function IconAdvisor({ className }: PieceIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2 4h4l-3 3 1 5-4-2-4 2 1-5-3-3h4L12 2z" />
    </svg>
  );
}

function IconElephant({ className }: PieceIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3c-2 0-4 1.5-4 4v1H6c-1 0-2 1-2 2v2h2v6h2v-4h1v4h2v-4h1v4h2v-6h2v-2c0-1-1-2-2-2h-2V7c0-2.5-2-4-4-4zm0 2c1.1 0 2 .9 2 2v1h-4V7c0-1.1.9-2 2-2z" />
    </svg>
  );
}

function IconHorse({ className }: PieceIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 20c0-1.5 1-3 2.5-3.5L8 10l3-4 4 1 3 5v2h-2l-1 6H7zm3.2-9.8L9 12.5c1.5.3 2.7 1.3 3.2 2.7l.3-1.5 2-3.2-3.3-1.5z" />
    </svg>
  );
}

function IconRook({ className }: PieceIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 6h2V4h2v2h2V4h2v2h2V4h2v2h2v14H5V6zm2 2v10h10V8H7z" />
    </svg>
  );
}

function IconCannon({ className }: PieceIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 16h3v2H4v-2zm13 0h3v2h-3v-2zM8 10h8l1 6H7l1-6zm1-2 1-4h4l1 4H9z" />
    </svg>
  );
}

function IconPawn({ className }: PieceIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3c-1.5 0-3 1-3 3v2H7v2h2v1H7v2h10v-2h-2v-1h2v-2h-2V6c0-2-1.5-3-3-3zm-1 14h2v3h-2v-3z" />
    </svg>
  );
}

const ICONS: Record<string, PieceIcon> = {
  K: IconKing,
  A: IconAdvisor,
  B: IconElephant,
  N: IconHorse,
  R: IconRook,
  C: IconCannon,
  P: IconPawn,
};

export interface XiangqiPieceMeta {
  label: string;
  short: string;
  side: "red" | "black";
}

export const XIANGQI_PIECE_META: Record<string, XiangqiPieceMeta> = {
  rK: { label: "帥", short: "Tướng", side: "red" },
  rA: { label: "仕", short: "Sĩ", side: "red" },
  rB: { label: "相", short: "Tượng", side: "red" },
  rN: { label: "傌", short: "Mã", side: "red" },
  rR: { label: "車", short: "Xe", side: "red" },
  rC: { label: "炮", short: "Pháo", side: "red" },
  rP: { label: "兵", short: "Tốt", side: "red" },
  bK: { label: "將", short: "Tướng", side: "black" },
  bA: { label: "士", short: "Sĩ", side: "black" },
  bB: { label: "象", short: "Tượng", side: "black" },
  bN: { label: "馬", short: "Mã", side: "black" },
  bR: { label: "車", short: "Xe", side: "black" },
  bC: { label: "砲", short: "Pháo", side: "black" },
  bP: { label: "卒", short: "Tốt", side: "black" },
};

interface XiangqiPieceProps {
  code: string;
  size?: number;
  selected?: boolean;
}

export default function XiangqiPiece({ code, size = 38, selected }: XiangqiPieceProps) {
  const meta = XIANGQI_PIECE_META[code];
  if (!meta) return null;

  const type = code.slice(1);
  const Icon = ICONS[type] ?? IconPawn;
  const isRed = meta.side === "red";

  return (
    <div
      className={`relative flex flex-col items-center justify-center rounded-full shadow-md transition-transform ${
        selected ? "scale-110 ring-2 ring-yellow-300 ring-offset-1 ring-offset-amber-900" : ""
      }`}
      style={{
        width: size,
        height: size,
        background: "radial-gradient(circle at 35% 30%, #fffef5 0%, #f5e6c8 55%, #e8d4a8 100%)",
        border: `2.5px solid ${isRed ? "#c41e1e" : "#1a1a1a"}`,
        boxShadow: isRed
          ? "0 2px 4px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.8)"
          : "0 2px 4px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.6)",
      }}
      title={`${meta.short} (${meta.label})`}
    >
      <Icon
        className={`w-[42%] h-[42%] mb-0.5 ${isRed ? "text-red-700" : "text-gray-900"}`}
      />
      <span
        className={`text-[11px] font-bold leading-none ${isRed ? "text-red-700" : "text-gray-900"}`}
        style={{ fontFamily: "serif" }}
      >
        {meta.label}
      </span>
    </div>
  );
}
