"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GameChannel } from "@/lib/game-redis";

export function useRoomGame<T extends { version: number }>({
  roomId,
  channel,
  apiPath,
  userId,
  username,
  autoJoin = true,
}: {
  roomId: string;
  channel: GameChannel;
  apiPath: string;
  userId: string;
  username: string;
  autoJoin?: boolean;
}) {
  const [state, setState] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const joinedRef = useRef(false);

  const loadState = useCallback(async () => {
    try {
      const res = await fetch(`${apiPath}?roomId=${encodeURIComponent(roomId)}`);
      const data = await res.json();
      if (data.state) setState(data.state);
    } catch {
      setError("Could not load game");
    } finally {
      setLoading(false);
    }
  }, [apiPath, roomId]);

  const postAction = useCallback(
    async (action: string, extra?: Record<string, unknown>) => {
      setError(null);
      try {
        const res = await fetch(apiPath, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId, userId, username, action, ...extra }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Action failed");
          return;
        }
        if (data.state) setState(data.state);
      } catch {
        setError("Network error");
      }
    },
    [apiPath, roomId, userId, username]
  );

  useEffect(() => {
    loadState();
  }, [loadState]);

  useEffect(() => {
    if (!autoJoin || joinedRef.current) return;
    joinedRef.current = true;
    postAction("join");
  }, [autoJoin, postAction]);

  useEffect(() => {
    const es = new EventSource(
      `/api/chat/subscribe?roomId=${encodeURIComponent(roomId)}`
    );
    es.onmessage = (event) => {
      try {
        if (!event.data) return;
        const data = JSON.parse(event.data);
        if (data.type === channel && data.payload) {
          setState(data.payload);
        }
      } catch {
        // ignore
      }
    };
    return () => es.close();
  }, [roomId, channel]);

  return { state, setState, error, loading, postAction };
}
