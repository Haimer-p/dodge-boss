import { getRedisClient } from "./redis";

export type GameChannel = "caro" | "chess" | "xiangqi" | "bowling";

export const GAME_CHANNELS: GameChannel[] = [
  "caro",
  "chess",
  "xiangqi",
  "bowling",
];

export function gameRedisKey(roomId: string, channel: GameChannel): string {
  return `room:${roomId}:${channel}`;
}

export async function getGameState<T>(
  roomId: string,
  channel: GameChannel,
  initial: () => T
): Promise<T> {
  const raw = await getRedisClient().get<string>(gameRedisKey(roomId, channel));
  if (!raw) return initial();
  try {
    return (typeof raw === "string" ? JSON.parse(raw) : raw) as T;
  } catch {
    return initial();
  }
}

export async function saveGameState<T extends { version: number }>(
  roomId: string,
  channel: GameChannel,
  state: T
): Promise<void> {
  await getRedisClient().set(
    gameRedisKey(roomId, channel),
    JSON.stringify(state)
  );
}

export async function broadcastGameEvent(
  roomId: string,
  channel: GameChannel,
  payload: unknown
): Promise<void> {
  const redis = getRedisClient();
  const notifyKey = `room:${roomId}:notify`;
  await redis.rpush(
    notifyKey,
    JSON.stringify({ type: channel, payload })
  );
  await redis.ltrim(notifyKey, -100, -1);
}

export function readVersion(state: unknown): number {
  if (state && typeof state === "object" && "version" in state) {
    return Number((state as { version: number }).version) || 0;
  }
  return 0;
}
