"use client";

import { useState, useCallback } from "react";

interface ShareLinkProps {
  roomId: string;
}

export default function ShareLink({ roomId }: ShareLinkProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/?join=${roomId}`
      : "";

  const handleCopy = useCallback(async () => {
    try {
      const shareText = [
        "Join my workspace on Dodge Boss!",
        "",
        `Room ID: ${roomId}`,
        `Link: ${shareUrl}`,
        "",
        "Password: (share separately)",
      ].join("\n");
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [roomId, shareUrl]);

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-all text-xs"
      title="Copy share link"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
      <span className="text-[11px]">{copied ? "Copied!" : "Share"}</span>
    </button>
  );
}
