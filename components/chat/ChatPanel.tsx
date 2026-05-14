"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChatMessage, ChatAppearance, TypingUser } from "@/lib/types";
import {
  loadChatAppearance,
  saveChatAppearance,
  DEFAULT_CHAT_APPEARANCE,
  withOpacity,
} from "@/lib/chat-themes";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import TypingIndicator from "./TypingIndicator";
import ChatSettingsPanel from "./ChatSettingsPanel";
import IconButton from "@/components/ui/IconButton";
import { createMessage } from "@/lib/utils";

interface ChatPanelProps {
  roomId: string;
  userId: string;
  username: string;
  avatar?: string;
  className?: string;
  isChatVisible?: boolean;
  onIncomingMessage?: (msg: ChatMessage) => void;
  onTypingUpdate?: (typers: TypingUser[]) => void;
}

export default function ChatPanel({
  roomId,
  userId,
  username,
  avatar,
  className = "",
  isChatVisible = true,
  onIncomingMessage,
  onTypingUpdate,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typers, setTypers] = useState<TypingUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [appearance, setAppearance] = useState<ChatAppearance>(DEFAULT_CHAT_APPEARANCE);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const isChatVisibleRef = useRef(isChatVisible);

  useEffect(() => {
    isChatVisibleRef.current = isChatVisible;
  }, [isChatVisible]);

  useEffect(() => {
    setAppearance(loadChatAppearance());
  }, []);

  const handleAppearanceChange = useCallback((next: ChatAppearance) => {
    setAppearance(next);
    saveChatAppearance(next);
  }, []);

  useEffect(() => {
    fetch(`/api/chat/messages?roomId=${roomId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.messages) setMessages(data.messages);
      })
      .catch(console.error);
  }, [roomId]);

  const postTyping = useCallback(
    async (isTyping: boolean) => {
      try {
        await fetch("/api/chat/typing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId, userId, username, isTyping }),
        });
      } catch {
        // ignore
      }
    },
    [roomId, userId, username]
  );

  const connectSSE = useCallback(() => {
    if (eventSourceRef.current) eventSourceRef.current.close();
    const es = new EventSource(`/api/chat/subscribe?roomId=${roomId}`);
    eventSourceRef.current = es;

    es.onopen = () => {
      setIsConnected(true);
      setConnectionError(null);
    };
    es.onmessage = (event) => {
      try {
        if (!event.data) return;
        const data = JSON.parse(event.data);
        if (data.type === "connected" || data.type === "keepalive") return;

        if (data.type === "typing" && data.payload?.typers) {
          const others = (data.payload.typers as TypingUser[]).filter(
            (t) => t.userId !== userId
          );
          setTypers(others);
          onTypingUpdate?.(others);
          return;
        }

        const msg = (data.type === "message" ? data.payload : data) as ChatMessage;
        if (msg.id && msg.content) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          if (msg.userId !== userId && !isChatVisibleRef.current) {
            onIncomingMessage?.(msg);
          }
        }
      } catch {}
    };
    es.onerror = () => {
      setIsConnected(false);
      setConnectionError("Reconnecting...");
      es.close();
      setTimeout(() => connectSSE(), 3000);
    };
    return es;
  }, [roomId, userId, onIncomingMessage, onTypingUpdate]);

  useEffect(() => {
    const es = connectSSE();
    return () => {
      es.close();
      eventSourceRef.current = null;
      postTyping(false);
    };
  }, [connectSSE, postTyping]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typers]);

  const sendMessage = async (content: string, type: "text" | "image" = "text") => {
    const optimistic = createMessage(userId, username, content, type, avatar);
    setMessages((prev) => {
      if (prev.some((m) => m.id === optimistic.id)) return prev;
      return [...prev, optimistic];
    });

    try {
      await postTyping(false);
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, userId, username, avatar, content, type }),
      });
      if (!res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        return;
      }
      const data = await res.json();
      if (data.message) {
        const confirmed = data.message as ChatMessage;
        setMessages((prev) => {
          const withoutOptimistic = prev.filter((m) => m.id !== optimistic.id);
          if (withoutOptimistic.some((m) => m.id === confirmed.id)) return withoutOptimistic;
          return [...withoutOptimistic, confirmed];
        });
      }
    } catch (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      console.error("Send failed:", error);
    }
  };

  const chatColors = {
    own: appearance.ownBubble,
    other: appearance.otherBubble,
    ownText: appearance.ownText,
    otherText: appearance.otherText,
    ownName: appearance.ownName,
    otherName: appearance.otherName,
    time: appearance.timeColor,
  };

  return (
    <div
      className={`w-full md:w-[22rem] lg:w-[26rem] flex flex-col md:border-l border-white/10 backdrop-blur-md h-full ${className}`}
      style={{
        backgroundColor: withOpacity(appearance.panelBg, appearance.panelOpacity),
        color: appearance.panelText,
      }}
    >
      <div className="chat-panel-header border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
          </svg>
          <span className="text-base font-semibold">Chat</span>
          <span className="text-xs opacity-60">({messages.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <IconButton
              onClick={() => setShowSettings(!showSettings)}
              aria-label="Chat appearance settings"
              title="Chat appearance settings"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            </IconButton>
            <ChatSettingsPanel
              appearance={appearance}
              onChange={handleAppearanceChange}
              isOpen={showSettings}
              onClose={() => setShowSettings(false)}
            />
          </div>
          <span
            className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-green-400 shadow-sm shadow-green-400/50" : "bg-yellow-400"}`}
          />
          <span className="text-xs opacity-70">
            {isConnected ? "Live" : connectionError || "Offline"}
          </span>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto chat-messages thin-scrollbar"
        style={{
          scrollBehavior: "smooth",
          backgroundColor: withOpacity(appearance.messagesBg, appearance.panelOpacity),
        }}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-3">
              <svg className="w-7 h-7 opacity-40" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z" />
              </svg>
            </div>
            <p className="text-sm opacity-70">No messages yet</p>
            <p className="text-xs opacity-50 mt-1">Send a message to start</p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.userId === userId}
            chatColors={chatColors}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <TypingIndicator names={typers.map((t) => t.username)} />
      <MessageInput onSend={sendMessage} onTypingChange={postTyping} />
    </div>
  );
}
