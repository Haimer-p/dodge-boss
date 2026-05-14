"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { DisguiseMode, RoomSession, StealthTheme, ChatMessage, TypingUser } from "@/lib/types";
import ChatPanel from "@/components/chat/ChatPanel";
import ChatNotification, { ToastItem } from "@/components/ui/ChatNotification";
import ModeSelector from "@/components/modes/ModeSelector";
import DocumentMode from "@/components/modes/DocumentMode";
import CodeEditorMode from "@/components/modes/CodeEditorMode";
import TerminalMode from "@/components/modes/TerminalMode";
import KanbanMode from "@/components/modes/KanbanMode";
import SpreadsheetMode from "@/components/modes/SpreadsheetMode";
import EmailMode from "@/components/modes/EmailMode";
import DashboardMode from "@/components/modes/DashboardMode";
import MusicMode from "@/components/modes/MusicMode";
import YoutubeMode from "@/components/modes/YoutubeMode";
import GoogleMode from "@/components/modes/GoogleMode";
import CaroMode from "@/components/modes/CaroMode";
import ArcadeMode from "@/components/modes/ArcadeMode";
import ChessMode from "@/components/modes/ChessMode";
import XiangqiMode from "@/components/modes/XiangqiMode";
import BowlingMode from "@/components/modes/BowlingMode";
import PetCompanion from "@/components/ui/PetCompanion";
import ParticleBackground from "@/components/ui/ParticleBackground";
import StealthControls from "@/components/ui/StealthControls";
import ShareLink from "@/components/ui/ShareLink";
import IconButton from "@/components/ui/IconButton";
import { getDisguiseLabel, getStatusText } from "@/lib/utils";
import {
  requestNotificationPermission,
  showBrowserNotification,
  previewMessage,
} from "@/lib/notifications";

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
  const [isMobile, setIsMobile] = useState(false);
  const [mobileTab, setMobileTab] = useState<"chat" | "workspace">("chat");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [remoteTypers, setRemoteTypers] = useState<TypingUser[]>([]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => {
      const mobile = mq.matches;
      setIsMobile(mobile);
      if (mobile) {
        setShowChat(true);
        setIsChatMinimized(false);
        setMobileTab("chat");
      }
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

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

    requestNotificationPermission();
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

  const isChatVisible = isMobile
    ? mobileTab === "chat"
    : showChat && !isChatMinimized;

  const chatPanelProps = {
    roomId,
    userId: session.userId,
    username: session.username,
    avatar: session.avatar,
    isChatVisible,
    onIncomingMessage: (msg: ChatMessage) => {
      if (msg.userId === session.userId) return;
      setNewMessageCount((n) => n + 1);
      setToasts((prev) => [...prev, { id: msg.id, message: msg }].slice(-3));
      const preview = previewMessage(msg.content, msg.type);
      showBrowserNotification(msg.username, preview, () => {
        if (isMobile) setMobileTab("chat");
        else {
          setShowChat(true);
          setIsChatMinimized(false);
        }
        setNewMessageCount(0);
      });
    },
    onTypingUpdate: (typers: TypingUser[]) => setRemoteTypers(typers),
  };

  const openChat = () => {
    if (isMobile) {
      setMobileTab("chat");
    } else {
      setShowChat(true);
      setIsChatMinimized(false);
    }
    setNewMessageCount(0);
  };

  const toggleChat = () => {
    if (isMobile) {
      setMobileTab("chat");
      setShowChat(true);
      setIsChatMinimized(false);
      setNewMessageCount(0);
      return;
    }
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
      case "email": return <EmailMode />;
      case "dashboard": return <DashboardMode />;
      case "music": return <MusicMode />;
      case "youtube": return <YoutubeMode />;
      case "google": return <GoogleMode />;
      case "caro":
        return (
          <CaroMode
            roomId={roomId}
            userId={session.userId}
            username={session.username}
          />
        );
      case "arcade":
        return <ArcadeMode />;
      case "chess":
        return (
          <ChessMode
            roomId={roomId}
            userId={session.userId}
            username={session.username}
          />
        );
      case "xiangqi":
        return (
          <XiangqiMode
            roomId={roomId}
            userId={session.userId}
            username={session.username}
          />
        );
      case "bowling":
        return (
          <BowlingMode
            roomId={roomId}
            userId={session.userId}
            username={session.username}
          />
        );
      default: return <DocumentMode />;
    }
  };

  return (
    <div className="h-screen flex flex-col relative">
      <ParticleBackground />
      <PetCompanion />

      <header
        className="h-12 bg-gray-900/80 backdrop-blur-md border-b border-gray-800/80 flex items-center px-2 md:px-3 shrink-0 z-20 gap-1"
        style={getStealthStyles()}
      >
        <div className="flex items-center gap-1 md:gap-2.5 min-w-0 shrink">
          <IconButton
            onClick={() => {
              sessionStorage.removeItem(`chat:session:${roomId}`);
              router.push("/");
            }}
            aria-label="Leave room"
            title="Leave room"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M19 12H5m7-7l-7 7 7 7" />
            </svg>
          </IconButton>
          <div className="hidden sm:block h-4 w-px bg-gray-800" />
          <span className="hidden sm:inline text-xs font-mono text-gray-400 truncate max-w-[6rem] md:max-w-none">{roomId}</span>
          <div className="hidden md:block h-4 w-px bg-gray-800" />
          <span className="text-xs text-blue-400 font-medium truncate max-w-[4rem] sm:max-w-none">{session.username}</span>
        </div>

        <div className="flex-1 flex items-center justify-center min-w-0 px-1">
          <span className="text-[10px] sm:text-xs text-gray-400 font-medium truncate">{getDisguiseLabel(disguiseMode)}</span>
        </div>

        <div className="flex items-center gap-0.5 md:gap-1.5 shrink-0">
          <div className="hidden lg:block">
            <ModeSelector selected={disguiseMode} onSelect={handleModeChange} />
          </div>
          <div className="hidden lg:block h-5 w-px bg-gray-800" />
          <ShareLink roomId={roomId} />
          <StealthControls
            onOpacityChange={handleOpacityChange}
            onThemeChange={handleThemeChange}
            currentOpacity={opacity}
            currentTheme={stealthTheme}
          />
          {!isMobile && (
            <button
              type="button"
              onClick={toggleChat}
              className="btn-3d btn-3d-chat hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl relative"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Chat
              {remoteTypers.length > 0 && newMessageCount === 0 && (
                <span className="absolute -top-1.5 -right-1.5 text-[9px] text-blue-200 font-bold">…</span>
              )}
              {newMessageCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[1.1rem] h-[1.1rem] px-0.5 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full">
                  {newMessageCount}
                </span>
              )}
            </button>
          )}
        </div>
      </header>

      {isMobile && mobileTab === "workspace" && (
        <div className="shrink-0 px-2 py-2 bg-gray-900/70 border-b border-gray-800/80 overflow-x-auto z-20" style={getStealthStyles()}>
          <ModeSelector selected={disguiseMode} onSelect={handleModeChange} />
        </div>
      )}

      <div className="flex-1 flex overflow-hidden relative z-10 min-h-0">
        {isMobile ? (
          <>
            <div
              className={`flex-1 flex flex-col min-w-0 min-h-0 ${mobileTab === "workspace" ? "flex" : "hidden"}`}
              style={getStealthStyles()}
            >
              {renderMode()}
            </div>
            <div className={`flex-1 min-h-0 min-w-0 ${mobileTab === "chat" ? "flex flex-col" : "hidden"}`}>
              <ChatPanel {...chatPanelProps} className="border-l-0" />
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 flex flex-col min-w-0" style={getStealthStyles()}>
              {renderMode()}
            </div>
            <div
              className={`transition-all duration-200 shrink-0 ${
                !showChat || isChatMinimized ? "w-0 overflow-hidden border-0" : "w-[22rem] lg:w-[26rem]"
              }`}
            >
              <ChatPanel {...chatPanelProps} />
            </div>
          </>
        )}
      </div>

      <ChatNotification
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
        onClick={() => openChat()}
      />

      {isMobile && (
        <div className="shrink-0 z-50 flex gap-2.5 p-2.5 bg-gray-900/95 backdrop-blur-md border-t border-gray-800 safe-area-pb">
          <button
            type="button"
            onClick={() => setMobileTab("workspace")}
            className={`btn-3d flex-1 py-3 text-sm rounded-xl ${
              mobileTab === "workspace" ? "btn-3d-secondary ring-1 ring-white/20" : "btn-3d-secondary opacity-70"
            }`}
          >
            Workspace
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileTab("chat");
              setNewMessageCount(0);
            }}
            className={`btn-3d btn-3d-chat flex-1 py-3 text-sm rounded-xl relative ${
              mobileTab === "chat" ? "" : "opacity-90"
            }`}
          >
            Chat
            {remoteTypers.length > 0 && newMessageCount === 0 && (
              <span className="absolute top-1 right-3 text-[10px] text-blue-200 font-bold">…</span>
            )}
            {newMessageCount > 0 && (
              <span className="absolute -top-1 right-2 min-w-[1.25rem] h-5 px-1 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                {newMessageCount}
              </span>
            )}
          </button>
        </div>
      )}

      {!isMobile && showChat && isChatMinimized && (
        <div className="fixed right-4 bottom-10 z-50">
          <button
            type="button"
            onClick={toggleChat}
            aria-label="Open chat"
            className="btn-3d btn-3d-chat-fab inline-flex items-center justify-center relative"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {newMessageCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                {newMessageCount}
              </span>
            )}
          </button>
        </div>
      )}

      <div
        className="hidden md:flex h-7 bg-gray-900/80 backdrop-blur border-t border-gray-800/60 items-center px-3 shrink-0 z-20"
        style={getStealthStyles()}
      >
        <div className="flex items-center gap-2.5 text-xs text-gray-400 font-mono w-full">
          <span className="font-semibold text-gray-400">DODGE BOSS</span>
          <span className="text-gray-600">|</span>
          <span>auth-service / main</span>
          <span className="text-gray-600">|</span>
          <span className="text-green-500/80">Build: PASSED</span>
          <span className="text-gray-600">|</span>
          <span>v1.2.3</span>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-gray-500">{getStatusText(disguiseMode)}</span>
            <span className="text-gray-500">{(opacity * 100).toFixed(0)}%</span>
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
