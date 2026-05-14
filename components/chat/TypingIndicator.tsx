"use client";

interface TypingIndicatorProps {
  names: string[];
}

export default function TypingIndicator({ names }: TypingIndicatorProps) {
  if (names.length === 0) return null;

  const label =
    names.length === 1
      ? `${names[0]} đang nhập`
      : names.length === 2
        ? `${names[0]} và ${names[1]} đang nhập`
        : `${names[0]} và ${names.length - 1} người khác đang nhập`;

  return (
    <div className="px-4 py-1.5 text-xs opacity-70 flex items-center gap-1.5">
      <span>{label}</span>
      <span className="inline-flex gap-0.5">
        <span className="typing-dot" />
        <span className="typing-dot typing-dot-2" />
        <span className="typing-dot typing-dot-3" />
      </span>
    </div>
  );
}
