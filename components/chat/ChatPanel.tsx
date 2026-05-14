"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChatMessage } from "@/lib/types";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";

interface ChatPanelProps {
  roomId: string;
  userId: string;
  username: string;
  avatar?: string;
}

interface ChatColorScheme {
  id: string;
  name: string;
  own: string;
  other: string;
  ownText: string;
  otherText: string;
  ownName: string;
  otherName: string;
  time: string;
}

const COLOR_SCHEMES: ChatColorScheme[] = [
  {
    id: "default",
    name: "Default",
    own: "linear-gradient(135deg, #3b82f6, #6366f1)",
    other: "#1f2937",
    ownText: "#ffffff",
    otherText: "#e5e7eb",
    ownName: "#60a5fa",
    otherName: "#60a5fa",
    time: "rgba(255,255,255,0.5)",
  },
  {
    id: "mono",
    name: "Monochrome",
    own: "#374151",
    other: "#1f2937",
    ownText: "#d1d5db",
    otherText: "#9ca3af",
    ownName: "#9ca3af",
    otherName: "#6b7280",
    time: "rgba(255,255,255,0.25)",
  },
  {
    id: "green",
    name: "Forest",
    own: "linear-gradient(135deg, #059669, #10b981)",
    other: "#064e3b",
    ownText: "#ffffff",
    otherText: "#a7f3d0",
    ownName: "#34d399",
    otherName: "#34d399",
    time: "rgba(255,255,255,0.5)",
  },
  {
    id: "purple",
    name: "Night Sky",
    own: "linear-gradient(135deg, #7c3aed, #a855f7)",
    other: "#2e1065",
    ownText: "#ffffff",
    otherText: "#e9d5ff",
    ownName: "#c084fc",
    otherName: "#c084fc",
    time: "rgba(255,255,255,0.5)",
  },
  {
    id: "warm",
    name: "Warm",
    own: "linear-gradient(135deg, #d97706, #f59e0b)",
    other: "#451a03",
    ownText: "#ffffff",
    otherText: "#fde68a",
    ownName: "#fbbf24",
    otherName: "#fbbf24",
    time: "rgba(255,255,255,0.5)",
  },
  {
    id: "minimal",
    name: "Minimal",
    own: "rgba(59,130,246,0.15)",
    other: "rgba(255,255,255,0.05)",
    ownText: "#93c5fd",
    otherText: "#9ca3af",
    ownName: "#60a5fa",
    otherName: "#6b7280",
    time: "rgba(255,255,255,0.2)",
  },
  {
    id: "retro",
    name: "Retro",
    own: "#2563eb",
    other: "#1e293b",
    ownText: "#ffffff",
    otherText: "#cbd5e1",
    ownName: "#3b82f6",
    otherName: "#94a3b8",
    time: "rgba(255,255,255,0.4)",
  },
  {
    id: "cyber",
    name: "Cyber",
    own: "linear-gradient(135deg, #06b6d4, #22d3ee)",
    other: "#083344",
    ownText: "#000000",
    otherText: "#67e8f9",
    ownName: "#22d3ee",
    otherName: "#22d3ee",
    time: "rgba(255,255,255,0.4)",
  },
];

export default function ChatPanel({ roomId, userId, username, avatar }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [colorScheme, setColorScheme] = useState<ChatColorScheme>(COLOR_SCHEMES[0]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Load saved color scheme
  useEffect(() => {
    const saved = localStorage.getItem("dodgeboss:chatColor");
    if (saved) {
      const found = COLOR_SCHEMES.find((c) => c.id === saved);
      if (found) setColorScheme(found);
    }
  }, []);

  // Load messages
  useEffect(() => {
    fetch(`/api/chat/messages?roomId=${roomId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.messages) setMessages(data.messages);
      })
      .catch(console.error);
  }, [roomId]);

  // SSE
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
        if (data.id && data.content) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === data.id)) return prev;
            return [...prev, data];
          });
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
  }, [roomId]);

  useEffect(() => {
    const es = connectSSE();
    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [connectSSE]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (content: string, type: "text" | "image" = "text") => {
    try {
      await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, userId, username, avatar, content, type }),
      });
    } catch (error) {
      console.error("Send failed:", error);
    }
  };

  const handleColorChange = (scheme: ChatColorScheme) => {
    setColorScheme(scheme);
    localStorage.setItem("dodgeboss:chatColor", scheme.id);
    setShowColorPicker(false);
  };

  return (
    <div className="w-80 lg:w-96 flex flex-col border-l border-gray-800 bg-gray-900/90 backdrop-blur-md h-full">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-800 flex items-center justify-between bg-gray-900/60">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
          </svg>
          <span className="text-sm font-semibold text-gray-200">Chat</span>
          <span className="text-[10px] text-gray-600">({messages.length})</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Color picker */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-5 h-5 rounded-full border border-gray-600 hover:border-gray-400 transition-colors overflow-hidden"
              title="Chat color theme"
              style={{
                background: colorScheme.own.includes("gradient")
                  ? colorScheme.own
                  : colorScheme.own,
              }}
            />
            {showColorPicker && (
              <div className="absolute bottom-full right-0 mb-2 p-2 glass rounded-xl border border-white/10 shadow-2xl z-50">
                <div className="text-[10px] text-gray-400 mb-2 font-semibold uppercase tracking-wider px-1">
                  Color Theme
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {COLOR_SCHEMES.map((scheme) => (
                    <button
                      key={scheme.id}
                      onClick={() => handleColorChange(scheme)}
                      className={`w-7 h-7 rounded-lg border transition-all ${
                        colorScheme.id === scheme.id
                          ? "ring-2 ring-blue-500 scale-110"
                          : "border-gray-700 hover:border-gray-500"
                      }`}
                      title={scheme.name}
                      style={{
                        background: scheme.own.includes("gradient")
                          ? scheme.own
                          : scheme.own,
                      }}
                    />
                  ))}
                </div>
                <div className="text-[9px] text-gray-500 mt-1.5 text-center">
                  {colorScheme.name}
                </div>
              </div>
            )}
          </div>
          <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400 shadow-sm shadow-green-400/50" : "bg-yellow-400"}`} />
          <span className="text-[10px] text-gray-500">{isConnected ? "Live" : connectionError || "Offline"}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 hide-scrollbar" style={{ scrollBehavior: "smooth" }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z" />
              </svg>
            </div>
            <p className="text-xs text-gray-600">No messages yet</p>
            <p className="text-[10px] text-gray-700 mt-1">Send a message to start</p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.userId === userId}
            chatColors={{
              own: colorScheme.own,
              other: colorScheme.other,
              ownText: colorScheme.ownText,
              otherText: colorScheme.otherText,
              ownName: colorScheme.ownName,
              otherName: colorScheme.otherName,
              time: colorScheme.time,
            }}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput onSend={sendMessage} />
    </div>
  );
}
