"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { DisguiseMode, RoomSession, StealthTheme } from "@/lib/types";
import ChatPanel from "@/components/chat/ChatPanel";
import ModeSelector from "@/components/modes/ModeSelector";
import DocumentMode from "@/components/modes/DocumentMode";
import CodeEditorMode from "@/components/modes/CodeEditorMode";
import TerminalMode from "@/components/modes/TerminalMode";
import KanbanMode from "@/components/modes/KanbanMode";
import SpreadsheetMode from "@/components/modes/SpreadsheetMode";
import PetCompanion from "@/components/ui/PetCompanion";
import ParticleBackground from "@/components/ui/ParticleBackground";
import StealthControls from "@/components/ui/StealthControls";
import ShareLink from "@/components/ui/ShareLink";
import { getDisguiseLabel, getStatusText } from "@/lib/utils";

function RoomContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomId = params.id as string;

  const [session, setSession] = useState<RoomSession | null>(null);
  const [disguiseMode, setDisguiseMode] = useState<DisguiseMode>("document");
  const [showChat, setShowChat] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const [stealthTheme, setStealthTheme] = useState<StealthTheme>("dark");

  useEffect(() => {
    const stored = sessionStorage.getItem(`chat:session:${roomId}`);
    if (!stored) {
      router.push("/");
      return;
    }

    const parsed = JSON.parse(stored) as RoomSession;
    setSession({ ...parsed, roomId });

    const mode = (searchParams.get("mode") as DisguiseMode) || "document";
    setDisguiseMode(mode);

    const savedOpacity = localStorage.getItem("dodgeboss:opacity");
    const savedTheme = localStorage.getItem("dodgeboss:theme");
    if (savedOpacity) setOpacity(parseFloat(savedOpacity));
    if (savedTheme) setStealthTheme(savedTheme as StealthTheme);
  }, [roomId, searchParams, router]);

  const handleModeChange = (mode: DisguiseMode) => {
    setDisguiseMode(mode);
    window.history.replaceState({}, "", `/room/${roomId}?mode=${mode}`);
    if (session) {
      const updated = { ...session, disguiseMode: mode };
      sessionStorage.setItem(`chat:session:${roomId}`, JSON.stringify(updated));
      setSession(updated);
    }
  };

  const handleOpacityChange = useCallback((value: number) => {
    setOpacity(value);
    localStorage.setItem("dodgeboss:opacity", String(value));
  }, []);

  const handleThemeChange = useCallback((theme: StealthTheme) => {
    setStealthTheme(theme);
    localStorage.setItem("dodgeboss:theme", theme);
  }, []);

  const getStealthStyles = (): React.CSSProperties => {
    const bgMap: Record<StealthTheme, string> = {
      dark: "#030712",
      light: "#f8fafc",
      gray: "#1f2937",
    };
    return {
      opacity,
      backgroundColor: bgMap[stealthTheme],
      transition: "opacity 0.3s ease, background-color 0.3s ease",
    };
  };

  if (!session) {
    return (
      <div className="h-screen flex items-center justify-center" style={getStealthStyles()}>
        <ParticleBackground />
        <div className="text-blue-300/60 animate-pulse z-10">Loading workspace...</div>
      </div>
    );
  }

  const toggleChat = () => {
    if (!showChat) {
      setShowChat(true);
      setIsChatMinimized(false);
      setNewMessageCount(0);
    } else if (isChatMinimized) {
      setIsChatMinimized(false);
      setNewMessageCount(0);
    } else {
      setIsChatMinimized(true);
    }
  };

  const renderMode = () => {
    switch (disguiseMode) {
      case "document": return <DocumentMode />;
      case "code-editor": return <CodeEditorMode />;
      case "terminal": return <TerminalMode />;
      case "kanban": return <KanbanMode />;
      case "spreadsheet": return <SpreadsheetMode />;
      default: return <DocumentMode />;
    }
  };

  return (
    <div className="h-screen flex flex-col" style={getStealthStyles()}>
      <ParticleBackground />
      <PetCompanion />

      {/* Top Bar */}
      <header className="h-11 bg-gray-900/80 backdrop-blur-md border-b border-gray-800/80 flex items-center px-3 shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              sessionStorage.removeItem(`chat:session:${roomId}`);
              router.push("/");
            }}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M19 12H5m7-7l-7 7 7 7" />
            </svg>
          </button>
          <div className="h-4 w-px bg-gray-800" />
          <span className="text-xs font-mono text-gray-400">{roomId}</span>
          <div className="h-4 w-px bg-gray-800" />
          <span className="text-xs text-blue-400 font-medium">{session.username}</span>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <span className="text-[11px] text-gray-500 font-medium">{getDisguiseLabel(disguiseMode)}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <ModeSelector selected={disguiseMode} onSelect={handleModeChange} />
          <div className="h-5 w-px bg-gray-800" />
          <ShareLink roomId={roomId} />
          <div className="relative">
            <StealthControls
              onOpacityChange={handleOpacityChange}
              onThemeChange={handleThemeChange}
              currentOpacity={opacity}
              currentTheme={stealthTheme}
            />
          </div>
          <button
            onClick={toggleChat}
            className="relative p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {newMessageCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full shadow-sm shadow-blue-500/50">
                {newMessageCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        <div className="flex-1 flex flex-col min-w-0">{renderMode()}</div>

        {showChat && (
          <div
            className={`transition-all duration-200 ${
              isChatMinimized ? "w-0 overflow-hidden border-0" : "w-80 lg:w-96"
            }`}
          >
            <ChatPanel
              roomId={roomId}
              userId={session.userId}
              username={session.username}
              avatar={session.avatar}
            />
          </div>
        )}
      </div>

      {/* Minimized Chat */}
      {showChat && isChatMinimized && (
        <button
          onClick={toggleChat}
          className="fixed right-4 bottom-16 w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full shadow-lg shadow-blue-500/20 flex items-center justify-center transition-all z-50 hover:scale-105 active:scale-95"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {newMessageCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-sm">
              {newMessageCount}
            </span>
          )}
        </button>
      )}

      {/* Bottom Status Bar */}
      <div className="h-6 bg-gray-900/80 backdrop-blur border-t border-gray-800/60 flex items-center px-3 shrink-0 z-20">
        <div className="flex items-center gap-2.5 text-[10px] text-gray-600 font-mono w-full">
          <span className="font-semibold text-gray-500">DODGE BOSS</span>
          <span className="text-gray-700">|</span>
          <span>auth-service / main</span>
          <span className="text-gray-700">|</span>
          <span className="text-green-700">Build: PASSED</span>
          <span className="text-gray-700">|</span>
          <span>v1.2.3</span>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-gray-700">{getStatusText(disguiseMode)}</span>
            <span className="text-gray-700/60">{(opacity * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RoomPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-gray-950">
          <div className="text-blue-300/60 animate-pulse">Loading workspace...</div>
        </div>
      }
    >
      <RoomContent />
    </Suspense>
  );
}
