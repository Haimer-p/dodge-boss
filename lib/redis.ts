import { Redis } from "@upstash/redis";
import { ChatMessage, Room } from "./types";

function getRedis() {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.UPSTASH_REDIS_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.UPSTASH_REDIS_TOKEN;

  if (!url || !token) {
    throw new Error(
      "Missing Upstash Redis environment variables"
    );
  }

  return new Redis({ url, token });
}

const redis = () => getRedis();

export function getRedisClient(): Redis {
  return getRedis();
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
