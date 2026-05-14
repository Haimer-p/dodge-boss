"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { RoomMemberPresence } from "@/lib/types";
import { getAvatarColor, getInitials } from "@/lib/utils";
import IconButton from "@/components/ui/IconButton";

interface MembersPanelProps {
  members: RoomMemberPresence[];
  currentUserId: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export default function MembersPanel({
  members,
  currentUserId,
  isOpen,
  onToggle,
  onClose,
}: MembersPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null);

  const onlineCount = members.filter((m) => m.online).length;

  useLayoutEffect(() => {
    if (!isOpen || !anchorRef.current) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      if (!anchorRef.current) return;
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, anchorRef]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, onClose, anchorRef]);

  const panel =
    isOpen && position ? (
      <div
        ref={panelRef}
        className="fixed w-64 rounded-xl border border-gray-700/80 bg-[#0f1219]/98 backdrop-blur-xl shadow-2xl shadow-black/50 z-[200] animate-fade-slide max-h-[min(70vh,24rem)] flex flex-col"
        style={{ top: position.top, right: position.right }}
      >
        <div className="px-4 py-3 border-b border-gray-800/80 shrink-0">
          <p className="text-xs font-semibold text-gray-200 uppercase tracking-wider">
            Thành viên
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">
            {onlineCount} online / {members.length} gần đây
          </p>
        </div>
        <div className="overflow-y-auto thin-scrollbar p-2">
          {members.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-6">Chưa có ai trong phòng</p>
          ) : (
            <ul className="space-y-1">
              {members.map((member) => {
                const isSelf = member.userId === currentUserId;
                return (
                  <li
                    key={member.userId}
                    className={`flex items-center gap-2.5 px-2 py-2 rounded-lg ${
                      isSelf ? "bg-blue-500/10 ring-1 ring-blue-500/20" : "hover:bg-white/5"
                    }`}
                  >
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ backgroundColor: getAvatarColor(member.username) }}
                      >
                        {getInitials(member.username)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200 truncate">
                        {member.username}
                        {isSelf && (
                          <span className="text-[10px] text-blue-400 ml-1">(bạn)</span>
                        )}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {member.online ? "Online" : "Offline"}
                      </p>
                    </div>
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        member.online
                          ? "bg-green-400 shadow-sm shadow-green-400/50"
                          : "bg-gray-600"
                      }`}
                      title={member.online ? "Online" : "Offline"}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    ) : null;

  return (
    <>
      <div className="relative" ref={anchorRef}>
        <IconButton
          onClick={onToggle}
          aria-label="Room members"
          title="Thành viên phòng"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </IconButton>
        {members.length > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[1rem] h-4 px-1 bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full pointer-events-none">
            {onlineCount}
          </span>
        )}
      </div>
      {typeof document !== "undefined" && panel
        ? createPortal(panel, document.body)
        : null}
    </>
  );
}
