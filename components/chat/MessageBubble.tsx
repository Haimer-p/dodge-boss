"use client";

import { ChatMessage } from "@/lib/types";
import { formatTime, getAvatarColor, getInitials } from "@/lib/utils";
import { isEmojiOnly } from "@/lib/emojis";

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
        className="chat-avatar object-cover"
      />
    );
  }
  return (
    <div className={`chat-avatar bg-gradient-to-br ${getAvatarColor(username)}`}>
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
      <div className="chat-row chat-row--system message-enter">
        <span className="chat-bubble-system">{message.content}</span>
      </div>
    );
  }

  return (
    <div className={`chat-row message-enter ${isOwn ? "chat-row--own" : "chat-row--other"}`}>
      <div className="chat-row-inner">
        {!isOwn && (
          <Avatar username={message.username} avatar={message.avatar} />
        )}

        <div className="chat-bubble-wrap">
          {!isOwn && (
            <div
              className="chat-bubble-name"
              style={{ color: chatColors.otherName }}
            >
              {message.username}
            </div>
          )}

          <div
            className={`chat-bubble ${isOwn ? "chat-bubble--own" : "chat-bubble--other"}`}
            style={{
              background: isOwn ? chatColors.own : chatColors.other,
              color: isOwn ? chatColors.ownText : chatColors.otherText,
            }}
          >
            {message.type === "image" ? (
              <img
                src={message.content}
                alt="Shared image"
                className="max-w-full rounded-lg max-h-52 object-cover"
                loading="lazy"
              />
            ) : (
              <div
                className={
                  isEmojiOnly(message.content)
                    ? "chat-bubble-text chat-bubble-text--emoji"
                    : "chat-bubble-text"
                }
              >
                {message.content}
              </div>
            )}

            <div className="chat-bubble-meta" style={{ color: chatColors.time }}>
              {formatTime(message.timestamp)}
              {isOwn && (
                <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
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
