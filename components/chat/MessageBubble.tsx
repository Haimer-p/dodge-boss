"use client";

import { ChatMessage } from "@/lib/types";
import { formatTime, getAvatarColor, getInitials } from "@/lib/utils";

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  chatColors: {
    own: string;
    other: string;
    ownText: string;
    otherText: string;
    ownName: string;
    otherName: string;
    time: string;
  };
}

function Avatar({ username, avatar }: { username: string; avatar?: string }) {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={username}
        className="w-7 h-7 rounded-full object-cover shrink-0 border border-gray-700/50 shadow-sm"
      />
    );
  }
  return (
    <div
      className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-br ${getAvatarColor(username)} border border-white/10 shadow-sm`}
    >
      {getInitials(username)}
    </div>
  );
}

export default function MessageBubble({
  message,
  isOwn,
  chatColors,
}: MessageBubbleProps) {
  const isSystem = message.type === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center my-2.5 message-enter">
        <div className="text-[11px] text-gray-500 bg-gray-800/60 px-3 py-1 rounded-full border border-gray-700/40">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex mb-2.5 message-enter ${
        isOwn ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`flex gap-2 max-w-[88%] ${
          isOwn ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {/* Avatar */}
        <div className="flex-shrink-0 mt-0.5">
          <Avatar username={message.username} avatar={message.avatar} />
        </div>

        {/* Bubble */}
        <div>
          {!isOwn && (
            <div
              className="text-[11px] font-semibold mb-0.5 ml-1"
              style={{ color: chatColors.otherName }}
            >
              {message.username}
            </div>
          )}
          <div
            className="rounded-xl px-3.5 py-2.5 shadow-sm"
            style={{
              backgroundColor: isOwn ? chatColors.own : chatColors.other,
              color: isOwn ? chatColors.ownText : chatColors.otherText,
              borderTopRightRadius: isOwn ? "4px" : "12px",
              borderTopLeftRadius: isOwn ? "12px" : "4px",
            }}
          >
            {message.type === "image" ? (
              <div>
                <img
                  src={message.content}
                  alt="Shared image"
                  className="max-w-full rounded-lg max-h-52 object-cover"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {message.content}
              </div>
            )}
            <div className="text-[10px] mt-1.5 flex items-center gap-1" style={{ color: chatColors.time }}>
              {formatTime(message.timestamp)}
              {isOwn && (
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor" opacity={0.6}>
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
