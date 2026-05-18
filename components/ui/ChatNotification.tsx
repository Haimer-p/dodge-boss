"use client";

import { useEffect } from "react";
import { ChatMessage } from "@/lib/types";
import { getAvatarColor, getInitials } from "@/lib/utils";
import { previewMessage } from "@/lib/notifications";

export interface ToastItem {
  id: string;
  message: ChatMessage;
}

interface ChatNotificationProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  onClick: (message: ChatMessage) => void;
}

export default function ChatNotification({ toasts, onDismiss, onClick }: ChatNotificationProps) {
  return (
    <div className="fixed top-14 right-3 z-[100] flex flex-col gap-2 max-w-[min(100vw-1.5rem,22rem)] pointer-events-none">
      {toasts.map((toast) => (
        <ToastCard
          key={toast.id}
          message={toast.message}
          onDismiss={() => onDismiss(toast.id)}
          onClick={() => onClick(toast.message)}
        />
      ))}
    </div>
  );
}

function ToastCard({
  message,
  onDismiss,
  onClick,
}: {
  message: ChatMessage;
  onDismiss: () => void;
  onClick: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const preview = previewMessage(message.content, message.type);

  return (
    <button
      type="button"
      onClick={() => {
        onClick();
        onDismiss();
      }}
      className="pointer-events-auto w-full text-left glass rounded-xl px-3 py-2.5 shadow-xl border border-white/15 animate-fade-slide flex items-start gap-2.5 hover:bg-white/10 transition-colors"
    >
      {message.avatar ? (
        <img src={message.avatar} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
      ) : (
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ backgroundColor: getAvatarColor(message.username) }}
        >
          {getInitials(message.username)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-blue-300/90 font-medium">
          Tin nhắn mới
        </p>
        <p className="text-xs font-semibold text-gray-100 truncate">{message.username}</p>
        <p className="text-[11px] text-gray-400 truncate mt-0.5">{preview}</p>
      </div>
    </button>
  );
}
