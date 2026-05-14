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
        className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-700/50 shadow-sm"
      />
    );
  }
  return (
    <div
      className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br ${getAvatarColor(username)} border border-white/10 shadow-sm`}
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
      <div className="flex justify-center my-3 message-enter">
        <div className="text-xs text-gray-400 bg-white/5 px-4 py-1.5 rounded-full border border-white/10">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex mb-3 message-enter ${
        isOwn ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`flex gap-2.5 max-w-[88%] ${
          isOwn ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <div className="flex-shrink-0 mt-0.5">
          <Avatar username={message.username} avatar={message.avatar} />
        </div>

        <div>
          {!isOwn && (
            <div
              className="text-xs font-semibold mb-1 ml-1"
              style={{ color: chatColors.otherName }}
            >
              {message.username}
            </div>
          )}
          <div
            className="rounded-xl px-4 py-3 shadow-sm"
            style={{
              background: isOwn ? chatColors.own : chatColors.other,
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
              <div className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                {message.content}
              </div>
            )}
            <div
              className="text-xs mt-2 flex items-center gap-1"
              style={{ color: chatColors.time }}
            >
              {formatTime(message.timestamp)}
              {isOwn && (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" opacity={0.7}>
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
