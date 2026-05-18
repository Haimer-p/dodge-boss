"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import EmojiPicker from "./EmojiPicker";

interface MessageInputProps {
  onSend: (content: string, type?: "text" | "image") => void;
  onTypingChange?: (isTyping: boolean) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSend, onTypingChange, disabled }: MessageInputProps) {
  const [content, setContent] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isTypingRef = useRef(false);
  const isSendingRef = useRef(false);

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
    idleTimerRef.current = setTimeout(stopTyping, 2000);
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

  const insertEmoji = (emoji: string) => {
    const ta = textareaRef.current;
    if (ta) {
      const start = ta.selectionStart ?? content.length;
      const end = ta.selectionEnd ?? content.length;
      const next = content.slice(0, start) + emoji + content.slice(end);
      setContent(next);
      requestAnimationFrame(() => {
        ta.focus();
        const pos = start + emoji.length;
        ta.setSelectionRange(pos, pos);
      });
    } else {
      setContent((prev) => prev + emoji);
    }
    startTyping();
  };

  const submitMessage = useCallback(() => {
    const trimmed = content.trim();
    if (!trimmed || disabled || isSendingRef.current) return;

    isSendingRef.current = true;
    stopTyping();
    setShowEmoji(false);
    onSend(trimmed);
    setContent("");

    queueMicrotask(() => {
      isSendingRef.current = false;
    });
  }, [content, disabled, onSend, stopTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing || e.key === "Process") return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      submitMessage();
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
    <form onSubmit={handleSubmit} className="chat-input-bar">
      <div className="flex items-end gap-2.5">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEmoji((v) => !v)}
            disabled={disabled}
            aria-label="Insert emoji"
            className={`inline-flex items-center justify-center min-w-10 min-h-10 p-2.5 rounded-xl transition-all disabled:opacity-40 ${
              showEmoji ? "bg-white/15 text-yellow-300" : "text-gray-400 hover:text-gray-200 hover:bg-white/10"
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </button>
          {showEmoji && (
            <EmojiPicker
              onSelect={insertEmoji}
              onClose={() => setShowEmoji(false)}
            />
          )}
        </div>

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
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={stopTyping}
            placeholder="Type a message..."
            disabled={disabled}
            rows={1}
            className="textarea-3d textarea-3d-chat w-full"
            style={{ minHeight: "44px", maxHeight: "120px", overflowY: "hidden" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              const nextHeight = Math.min(target.scrollHeight, 120);
              target.style.height = nextHeight + "px";
              target.style.overflowY = target.scrollHeight > 120 ? "auto" : "hidden";
            }}
          />
        </div>

        <button
          type="button"
          onClick={submitMessage}
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
