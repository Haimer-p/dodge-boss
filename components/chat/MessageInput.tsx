"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface MessageInputProps {
  onSend: (content: string, type?: "text" | "image") => void;
  onTypingChange?: (isTyping: boolean) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSend, onTypingChange, disabled }: MessageInputProps) {
  const [content, setContent] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isTypingRef = useRef(false);

  const stopTyping = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    idleTimerRef.current = null;
    heartbeatRef.current = null;
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTypingChange?.(false);
    }
  }, [onTypingChange]);

  const startTyping = useCallback(() => {
    if (!onTypingChange) return;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      onTypingChange(true);
    }
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    heartbeatRef.current = setInterval(() => {
      if (isTypingRef.current) onTypingChange(true);
    }, 2000);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(stopTyping, 3000);
  }, [onTypingChange, stopTyping]);

  useEffect(() => () => stopTyping(), [stopTyping]);

  const handleContentChange = (value: string) => {
    setContent(value);
    if (value.trim()) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    stopTyping();
    onSend(content.trim());
    setContent("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      stopTyping();
      onSend(event.target?.result as string, "image");
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 border-t border-white/10">
      <div className="flex items-end gap-2.5">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          aria-label="Upload image"
          className="inline-flex items-center justify-center min-w-10 min-h-10 p-2.5 rounded-xl text-gray-400 hover:text-gray-200 hover:bg-white/10 transition-all disabled:opacity-40"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </button>
        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={stopTyping}
            placeholder="Type a message..."
            disabled={disabled}
            rows={1}
            className="textarea-3d w-full"
            style={{ minHeight: "44px", maxHeight: "120px" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 120) + "px";
            }}
          />
        </div>

        <button
          type="submit"
          disabled={disabled || !content.trim()}
          aria-label="Send message"
          className="inline-flex items-center justify-center min-w-10 min-h-10 p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 disabled:from-gray-700 disabled:to-gray-700 disabled:opacity-40 transition-all active:scale-95"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </form>
  );
}
