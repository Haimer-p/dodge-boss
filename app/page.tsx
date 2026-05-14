"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DisguiseMode } from "@/lib/types";
import ModeSelector from "@/components/modes/ModeSelector";
import Modal from "@/components/ui/Modal";
import PetCompanion from "@/components/ui/PetCompanion";
import ParticleBackground from "@/components/ui/ParticleBackground";
import { getAvatarColor, getInitials } from "@/lib/utils";

function LandingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [disguiseMode, setDisguiseMode] = useState<DisguiseMode>("document");
  const [username, setUsername] = useState("");
  const [roomName, setRoomName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-fill room ID from URL query param ?join=xxx
  useEffect(() => {
    const joinRoomId = searchParams.get("join");
    if (joinRoomId) {
      setRoomId(joinRoomId);
      setShowJoinModal(true);
    }
  }, [searchParams]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatar(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const validateUsername = () => {
    if (!username.trim()) {
      setError("Please enter a nickname");
      return false;
    }
    return true;
  };

  const createSession = (rid: string) => {
    const userId = crypto.randomUUID();
    sessionStorage.setItem(
      `chat:session:${rid}`,
      JSON.stringify({ username, userId, avatar, disguiseMode })
    );
    return userId;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validateUsername()) return;
    if (!roomName.trim()) {
      setError("Please enter a workspace name");
      return;
    }
    if (!password.trim()) {
      setError("Please enter a password");
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }

    setLoading(true);
    try {
      const generatedId =
        roomId.trim() ||
        roomName.toLowerCase().replace(/\s+/g, "-") +
          "-" +
          Math.random().toString(36).slice(2, 6);

      const res = await fetch("/api/room/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: generatedId, name: roomName, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }

      createSession(generatedId);
      router.push(`/room/${generatedId}?mode=${disguiseMode}`);
    } catch {
      setError("Failed to create workspace. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validateUsername()) return;
    if (!roomId.trim()) {
      setError("Please enter a Room ID");
      return;
    }
    if (!password.trim()) {
      setError("Please enter the room password");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/room/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: roomId.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }

      createSession(roomId.trim());
      router.push(`/room/${roomId.trim()}?mode=${disguiseMode}`);
    } catch {
      setError("Failed to join workspace. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-mesh p-4 relative overflow-hidden">
      <ParticleBackground />
      <PetCompanion />

      <div
        className="absolute inset-0 z-[1] opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="max-w-md w-full space-y-6 relative z-10">
        {/* Logo / Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20 mb-4 animate-float">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white drop-shadow-lg">Dodge Boss</h1>
          <p className="text-sm text-blue-200/70">Stealth workplace collaboration</p>
        </div>

        {/* Disguise Mode Selector */}
        <div className="glass rounded-2xl p-5 space-y-3 shadow-xl shadow-blue-500/5">
          <label className="text-[10px] font-semibold text-blue-200/80 uppercase tracking-widest flex items-center gap-2">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
            </svg>
            Disguise Mode
          </label>
          <ModeSelector selected={disguiseMode} onSelect={setDisguiseMode} />
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => {
              setError("");
              setShowJoinModal(true);
            }}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 active:scale-[0.98]"
          >
            Join Workspace
          </button>
          <button
            onClick={() => {
              setError("");
              setShowCreateModal(true);
            }}
            className="w-full py-3 px-4 glass hover:bg-white/20 text-gray-200 hover:text-white rounded-xl font-medium transition-all border border-white/10 active:scale-[0.98]"
          >
            Create New Workspace
          </button>
        </div>

        <div className="text-center">
          <p className="text-xs text-blue-300/40">Click the companion for a morale boost!</p>
        </div>
      </div>

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Workspace">
        <form onSubmit={handleCreate} className="space-y-3">
          {/* Avatar upload */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative w-14 h-14 rounded-full overflow-hidden bg-gray-800 border-2 border-dashed border-gray-600 hover:border-blue-500 transition-colors group"
            >
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 group-hover:text-blue-400 transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
              )}
            </button>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-400 mb-1">Your Nickname</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. developer_01"
                className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarUpload}
            accept="image/*"
            className="hidden"
          />

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Workspace Name</label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g. Auth Service Review"
              className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Room ID (optional)</label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="leave blank for auto"
              className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="minimum 4 characters"
              className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          {error && (
            <p className="text-xs text-red-400 bg-red-900/30 px-3 py-2 rounded border border-red-800/50">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg text-sm font-medium transition-all disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Workspace"}
          </button>
        </form>
      </Modal>

      {/* Join Modal */}
      <Modal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} title="Join Workspace">
        <form onSubmit={handleJoin} className="space-y-3">
          {/* Avatar upload */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative w-14 h-14 rounded-full overflow-hidden bg-gray-800 border-2 border-dashed border-gray-600 hover:border-blue-500 transition-colors group"
            >
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 group-hover:text-blue-400 transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
              )}
            </button>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-400 mb-1">Your Nickname</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. developer_02"
                className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarUpload}
            accept="image/*"
            className="hidden"
          />
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Room ID</label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter the room ID to join"
              className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter room password"
              className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          {error && (
            <p className="text-xs text-red-400 bg-red-900/30 px-3 py-2 rounded border border-red-800/50">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg text-sm font-medium transition-all disabled:cursor-not-allowed"
          >
            {loading ? "Joining..." : "Join Workspace"}
          </button>
        </form>
      </Modal>
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-mesh">
        <div className="text-blue-300/60 animate-pulse">Loading...</div>
      </div>
    }>
      <LandingContent />
    </Suspense>
  );
}
