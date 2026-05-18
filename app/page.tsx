"use client";

import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DisguiseMode, RoomListItem } from "@/lib/types";
import ModeSelector from "@/components/modes/ModeSelector";
import ModeIcon from "@/components/modes/ModeIcon";
import Modal from "@/components/ui/Modal";
import PetCompanion from "@/components/ui/PetCompanion";
import ParticleBackground from "@/components/ui/ParticleBackground";
import { getAvatarColor, getInitials } from "@/lib/utils";

interface RoomHistoryEntry {
  roomId: string;
  roomName: string;
  lastAccessed: number;
  disguiseMode: DisguiseMode;
}

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
  const [roomHistory, setRoomHistory] = useState<RoomHistoryEntry[]>([]);
  const [createdRoomInfo, setCreatedRoomInfo] = useState<{ id: string; password: string } | null>(null);
  const [allRooms, setAllRooms] = useState<RoomListItem[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoomName, setSelectedRoomName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load room history
  useEffect(() => {
    const history = localStorage.getItem("dodgeboss:rooms");
    if (history) {
      try {
        setRoomHistory(JSON.parse(history));
      } catch {}
    }
  }, []);

  // Pre-fill room ID from URL
  useEffect(() => {
    const joinRoomId = searchParams.get("join");
    if (joinRoomId) {
      setRoomId(joinRoomId);
      setShowJoinModal(true);
    }
  }, [searchParams]);

  const fetchRooms = useCallback(async () => {
    setRoomsLoading(true);
    try {
      const res = await fetch("/api/room/list");
      const data = await res.json();
      if (res.ok) setAllRooms(data.rooms ?? []);
    } catch {
      // ignore
    } finally {
      setRoomsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const saveRoomToHistory = useCallback((rid: string, rname: string, mode: DisguiseMode) => {
    const entry: RoomHistoryEntry = {
      roomId: rid,
      roomName: rname,
      lastAccessed: Date.now(),
      disguiseMode: mode,
    };
    setRoomHistory((prev) => {
      const filtered = prev.filter((r) => r.roomId !== rid);
      const updated = [entry, ...filtered].slice(0, 10); // keep last 10
      localStorage.setItem("dodgeboss:rooms", JSON.stringify(updated));
      return updated;
    });
  }, []);

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

  const storeSession = async (rid: string) => {
    const res = await fetch("/api/room/resolve-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: rid,
        username: username.trim(),
        avatar: avatar ?? undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Could not resolve user");
    }
    sessionStorage.setItem(
      `chat:session:${rid}`,
      JSON.stringify({
        username: data.username,
        userId: data.userId,
        avatar: data.avatar ?? avatar,
        disguiseMode,
      })
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCreatedRoomInfo(null);
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

      // Save to history
      saveRoomToHistory(generatedId, roomName, disguiseMode);
      await storeSession(generatedId);

      // Show room info briefly before redirect
      setCreatedRoomInfo({ id: generatedId, password });
      fetchRooms();
      setTimeout(() => {
        router.push(`/room/${generatedId}?mode=${disguiseMode}`);
      }, 2000);
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
      setError("Please enter the Room ID");
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

      saveRoomToHistory(roomId.trim(), data.roomName || selectedRoomName || roomId.trim(), disguiseMode);
      await storeSession(roomId.trim());
      router.push(`/room/${roomId.trim()}?mode=${disguiseMode}`);
    } catch {
      setError("Failed to join workspace. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryClick = (entry: RoomHistoryEntry) => {
    setRoomId(entry.roomId);
    setSelectedRoomName(entry.roomName);
    setDisguiseMode(entry.disguiseMode);
    setError("");
    setShowJoinModal(true);
  };

  const handleRoomClick = (room: RoomListItem) => {
    setRoomId(room.roomId);
    setSelectedRoomName(room.name);
    setError("");
    setPassword("");
    setShowJoinModal(true);
  };

  const filteredRooms = allRooms.filter((room) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      room.name.toLowerCase().includes(q) ||
      room.roomId.toLowerCase().includes(q)
    );
  });

  const formatDate = (ts: number) => {
    if (!ts) return "";
    return new Date(ts).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="h-[100dvh] min-h-screen flex flex-col items-center justify-start md:justify-center bg-mesh px-4 py-6 md:py-4 relative overflow-x-hidden overflow-y-auto">
      <ParticleBackground />
      <PetCompanion />

      <div className="absolute inset-0 z-[1] opacity-[0.03]" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />

      <div className="max-w-xl w-full flex flex-col gap-6 relative z-10">
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
        <div className="glass rounded-2xl p-5 flex flex-col gap-4 shadow-xl shadow-black/20">
          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
            </svg>
            Disguise Mode
          </label>
          <ModeSelector selected={disguiseMode} onSelect={setDisguiseMode} />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4">
          <button onClick={() => { setError(""); setShowJoinModal(true); }}
            className="btn-3d btn-3d-primary w-full py-3.5 px-4 text-sm rounded-xl">
            Join Workspace
          </button>
          <button onClick={() => { setError(""); setShowCreateModal(true); }}
            className="btn-3d btn-3d-secondary w-full py-3.5 px-4 text-sm rounded-xl">
            Create New Workspace
          </button>
        </div>

        {/* All Workspaces */}
        <div className="glass rounded-2xl p-5 shadow-xl shadow-black/20 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              All Workspaces
            </div>
            <button
              type="button"
              onClick={fetchRooms}
              disabled={roomsLoading}
              className="btn-3d btn-3d-secondary px-3 py-1.5 text-[10px] rounded-lg min-h-0 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or Room ID..."
              className="input-3d w-full pl-9 pr-4 py-2.5 text-sm"
            />
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
            {roomsLoading ? (
              <div className="py-8 text-center text-xs text-gray-500 animate-pulse">Loading workspaces...</div>
            ) : filteredRooms.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-500">
                {searchQuery.trim() ? "No workspaces match your search" : "No workspaces yet — create one to get started"}
              </div>
            ) : (
              filteredRooms.map((room) => (
                <div
                  key={room.roomId}
                  className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 shrink-0">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-200 truncate font-medium group-hover:text-white transition-colors">
                      {room.name}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-600 font-mono truncate">{room.roomId}</span>
                      {room.createdAt > 0 && (
                        <span className="text-[10px] text-gray-700 shrink-0">{formatDate(room.createdAt)}</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRoomClick(room)}
                    className="btn-3d btn-3d-join shrink-0"
                  >
                    Join
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Workspaces */}
        {roomHistory.length > 0 && (
          <div className="glass rounded-xl p-4 space-y-2">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              Recent Workspaces
            </div>
            <div className="space-y-1">
              {roomHistory.map((entry) => (
                <div
                  key={entry.roomId}
                  className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-300">
                    <ModeIcon mode={entry.disguiseMode} className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-200 truncate font-medium">{entry.roomName}</div>
                    <div className="text-[10px] text-gray-600 font-mono truncate">{entry.roomId}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleHistoryClick(entry)}
                    className="btn-3d btn-3d-join shrink-0 min-h-[34px] px-3"
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center">
          <p className="text-xs text-blue-300/40">Click the companion for a morale boost!</p>
        </div>
      </div>

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); setCreatedRoomInfo(null); }} title="Create Workspace">
        {createdRoomInfo ? (
          <div className="space-y-3 text-center py-4">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-sm text-green-400 font-medium">Workspace Created!</p>
            <div className="glass rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500">Room ID:</span>
                <span className="text-blue-300 font-mono font-medium">{createdRoomInfo.id}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500">Password:</span>
                <span className="text-yellow-300 font-mono">{createdRoomInfo.password}</span>
              </div>
            </div>
            <p className="text-[10px] text-gray-500">Share the Room ID and password with your teammate</p>
            <div className="text-[10px] text-gray-600 animate-pulse">Redirecting to workspace...</div>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-3">
            {/* Avatar + Nickname */}
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="relative w-14 h-14 rounded-full overflow-hidden bg-gray-800 border-2 border-dashed border-gray-600 hover:border-blue-500 transition-colors group shrink-0">
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
                <label className="block text-[11px] font-medium text-gray-400 mb-1">Your Nickname</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. developer_01"
                  className="input-3d w-full" />
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />

            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1">Workspace Name</label>
              <input type="text" value={roomName} onChange={(e) => setRoomName(e.target.value)}
                placeholder="e.g. Auth Service Review"
                className="input-3d w-full" />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1">
                Room ID
                <span className="text-gray-600 font-normal ml-1">(leave blank for auto-generate)</span>
              </label>
              <input type="text" value={roomId} onChange={(e) => setRoomId(e.target.value)}
                placeholder="e.g. auth-review"
                  className="input-3d w-full font-mono" />
              <p className="text-[9px] text-gray-600 mt-1">Share this Room ID with teammates so they can join</p>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="minimum 4 characters"
                className="input-3d w-full" />
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-900/30 px-3 py-2 rounded border border-red-800/50">{error}</p>
            )}

            <button type="submit" disabled={loading}
              className="btn-3d btn-3d-accent w-full py-2.5 text-sm rounded-xl disabled:opacity-50">
              {loading ? "Creating..." : "Create Workspace"}
            </button>
          </form>
        )}
      </Modal>

      {/* Join Modal */}
      <Modal isOpen={showJoinModal} onClose={() => { setShowJoinModal(false); setSelectedRoomName(""); }} title="Join Workspace">
        <form onSubmit={handleJoin} className="space-y-3">
          {selectedRoomName && (
            <div className="glass rounded-lg px-3 py-2.5 border border-white/10">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Workspace</p>
              <p className="text-sm text-gray-100 font-medium">{selectedRoomName}</p>
              <p className="text-[10px] text-gray-600 font-mono mt-0.5">{roomId}</p>
            </div>
          )}
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="relative w-14 h-14 rounded-full overflow-hidden bg-gray-800 border-2 border-dashed border-gray-600 hover:border-blue-500 transition-colors group shrink-0">
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
              <label className="block text-[11px] font-medium text-gray-400 mb-1">Your Nickname</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. developer_02"
                className="input-3d w-full" />
            </div>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />

          {!selectedRoomName && (
            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1">Room ID</label>
              <input type="text" value={roomId} onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter the Room ID (e.g. auth-review-abc123)"
                  className="input-3d w-full font-mono" />
              <p className="text-[9px] text-gray-600 mt-1">
                Room ID is the code shown when the workspace was created
              </p>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-gray-400 mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter the room password"
              className="input-3d w-full" />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-900/30 px-3 py-2 rounded border border-red-800/50">{error}</p>
          )}

          <button type="submit" disabled={loading}
            className="btn-3d btn-3d-accent w-full py-2.5 text-sm rounded-xl disabled:opacity-50">
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
