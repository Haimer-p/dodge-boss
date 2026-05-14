import "server-only";

import { getKvRedis, KvRedis } from "./redis-store";
import {
  ChatMessage,
  RoomListItem,
  TypingUser,
  RoomMemberPresence,
  CaroGameState,
} from "./types";
import { createInitialCaroState, normalizeCaroState } from "./caro";

const ROOM_INDEX_KEY = "rooms:index";

const redis = () => getKvRedis();

export function getRedisClient(): KvRedis {
  return getKvRedis();
}

// Room methods
export async function createRoom(
  roomId: string,
  name: string,
  password: string
): Promise<boolean> {
  const exists = await redis().exists(`room:${roomId}:meta`);
  if (exists) return false;

  await redis().hset(`room:${roomId}:meta`, {
    name: String(name),
    password: String(password),
    created_at: String(Date.now()),
  });
  await redis().sadd(ROOM_INDEX_KEY, roomId);
  return true;
}

export async function verifyRoom(
  roomId: string,
  password: string
): Promise<{ name: string } | null> {
  const room = await redis().hgetall<Record<string, string>>(`room:${roomId}:meta`);
  if (!room) return null;
  if (String(room.password ?? "") !== String(password)) return null;
  return { name: room.name };
}

export async function roomExists(roomId: string): Promise<boolean> {
  const exists = await redis().exists(`room:${roomId}:meta`);
  return exists === 1;
}

async function scanRoomIds(): Promise<string[]> {
  const ids: string[] = [];
  let cursor = 0;

  do {
    const [nextCursor, keys] = await redis().scan(cursor, {
      match: "room:*:meta",
      count: 100,
    });
    cursor = Number(nextCursor);
    for (const key of keys) {
      const match = String(key).match(/^room:(.+):meta$/);
      if (match) ids.push(match[1]);
    }
  } while (cursor !== 0);

  if (ids.length > 0) {
    await redis().sadd(ROOM_INDEX_KEY, ...ids);
  }

  return ids;
}

export async function listRooms(): Promise<RoomListItem[]> {
  let roomIds = await redis().smembers<string[]>(ROOM_INDEX_KEY);

  if (!roomIds?.length) {
    roomIds = await scanRoomIds();
  }

  const rooms: RoomListItem[] = [];

  for (const roomId of roomIds) {
    const meta = await redis().hgetall<Record<string, string>>(
      `room:${roomId}:meta`
    );
    if (!meta?.name) {
      await redis().srem(ROOM_INDEX_KEY, roomId);
      continue;
    }
    rooms.push({
      roomId,
      name: meta.name,
      createdAt: Number(meta.created_at) || 0,
    });
  }

  return rooms.sort((a, b) => b.createdAt - a.createdAt);
}

// Message methods
export async function saveMessage(
  roomId: string,
  message: ChatMessage
): Promise<void> {
  await redis().rpush(
    `room:${roomId}:messages`,
    JSON.stringify(message)
  );
  // Keep only last 500 messages to save space on free tier
  await redis().ltrim(`room:${roomId}:messages`, -500, -1);
}

export async function getMessages(
  roomId: string,
  limit = 50
): Promise<ChatMessage[]> {
  const messages = await redis().lrange(
    `room:${roomId}:messages`,
    -limit,
    -1
  );
  return messages
    .map((m) => {
      if (typeof m === "string") {
        try {
          return JSON.parse(m) as ChatMessage;
        } catch {
          return null;
        }
      }
      return m as unknown as ChatMessage;
    })
    .filter(Boolean) as ChatMessage[];
}

// Pub/Sub methods - using notification list pattern for SSE
export function getChannelName(roomId: string): string {
  return `room:channel:${roomId}`;
}

function typingKey(roomId: string): string {
  return `room:${roomId}:typing`;
}

export async function setTyping(
  roomId: string,
  userId: string,
  username: string
): Promise<void> {
  await redis().hset(typingKey(roomId), {
    [userId]: JSON.stringify({ username, updatedAt: Date.now() }),
  });
}

export async function clearTyping(
  roomId: string,
  userId: string
): Promise<void> {
  await redis().hdel(typingKey(roomId), userId);
}

export async function getActiveTypers(
  roomId: string,
  maxAgeMs = 5000
): Promise<TypingUser[]> {
  const raw = await redis().hgetall<Record<string, string>>(typingKey(roomId));
  if (!raw) return [];

  const now = Date.now();
  const typers: TypingUser[] = [];
  const staleIds: string[] = [];

  for (const [uid, value] of Object.entries(raw)) {
    try {
      const parsed = typeof value === "string" ? JSON.parse(value) : value;
      const updatedAt = Number(parsed.updatedAt) || 0;
      if (now - updatedAt > maxAgeMs) {
        staleIds.push(uid);
        continue;
      }
      typers.push({
        userId: uid,
        username: parsed.username || "Someone",
        updatedAt,
      });
    } catch {
      staleIds.push(uid);
    }
  }

  if (staleIds.length > 0) {
    await redis().hdel(typingKey(roomId), ...staleIds);
  }

  return typers;
}

function presenceKey(roomId: string): string {
  return `room:${roomId}:presence`;
}

export async function upsertPresence(
  roomId: string,
  userId: string,
  username: string,
  avatar?: string
): Promise<void> {
  const payload: RoomMemberPresence = {
    userId,
    username,
    avatar,
    online: true,
    lastSeen: Date.now(),
  };
  await redis().hset(presenceKey(roomId), {
    [userId]: JSON.stringify(payload),
  });
}

export async function markPresenceOffline(
  roomId: string,
  userId: string
): Promise<void> {
  const raw = await redis().hget(presenceKey(roomId), userId);
  const now = Date.now();
  let payload: RoomMemberPresence;

  if (raw) {
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      payload = {
        userId,
        username: parsed.username || "Someone",
        avatar: parsed.avatar,
        online: false,
        lastSeen: now,
      };
    } catch {
      payload = {
        userId,
        username: "Someone",
        online: false,
        lastSeen: now,
      };
    }
  } else {
    payload = {
      userId,
      username: "Someone",
      online: false,
      lastSeen: now,
    };
  }

  await redis().hset(presenceKey(roomId), {
    [userId]: JSON.stringify(payload),
  });
}

export async function getRoomPresence(
  roomId: string,
  options?: { onlineTtlMs?: number; memberTtlMs?: number }
): Promise<RoomMemberPresence[]> {
  const onlineTtlMs = options?.onlineTtlMs ?? 45_000;
  const memberTtlMs = options?.memberTtlMs ?? 86_400_000;

  const raw = await redis().hgetall<Record<string, string>>(presenceKey(roomId));
  if (!raw) return [];

  const now = Date.now();
  const members: RoomMemberPresence[] = [];
  const staleIds: string[] = [];

  for (const [uid, value] of Object.entries(raw)) {
    try {
      const parsed = typeof value === "string" ? JSON.parse(value) : value;
      const lastSeen = Number(parsed.lastSeen) || 0;

      if (now - lastSeen > memberTtlMs) {
        staleIds.push(uid);
        continue;
      }

      const flaggedOnline = parsed.online !== false;
      const isOnline = flaggedOnline && now - lastSeen <= onlineTtlMs;

      members.push({
        userId: uid,
        username: parsed.username || "Someone",
        avatar: parsed.avatar,
        online: isOnline,
        lastSeen,
      });
    } catch {
      staleIds.push(uid);
    }
  }

  if (staleIds.length > 0) {
    await redis().hdel(presenceKey(roomId), ...staleIds);
  }

  members.sort((a, b) => {
    if (a.online !== b.online) return a.online ? -1 : 1;
    return b.lastSeen - a.lastSeen;
  });

  return members;
}

function caroKey(roomId: string): string {
  return `room:${roomId}:caro`;
}

export async function getCaroState(roomId: string): Promise<CaroGameState> {
  const raw = await redis().get<string>(caroKey(roomId));
  if (!raw) return createInitialCaroState();
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return normalizeCaroState(parsed as CaroGameState);
  } catch {
    return createInitialCaroState();
  }
}

export async function saveCaroState(
  roomId: string,
  state: CaroGameState
): Promise<void> {
  const normalized = normalizeCaroState(state);
  const { board: _legacy, ...clean } = normalized;
  await redis().set(caroKey(roomId), JSON.stringify(clean));
}
