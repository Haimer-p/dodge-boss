import "server-only";

import { getRedisClient } from "./redis";
import { RoomDocsState, createInitialDocsState } from "./room-docs";
import { DOCS_CHANNEL } from "./realtime-channels";

export { DOCS_CHANNEL };

function docsKey(roomId: string): string {
  return `room:${roomId}:docs`;
}

export async function getDocsState(roomId: string): Promise<RoomDocsState> {
  const raw = await getRedisClient().get<string>(docsKey(roomId));
  if (!raw) return createInitialDocsState();
  try {
    return (typeof raw === "string" ? JSON.parse(raw) : raw) as RoomDocsState;
  } catch {
    return createInitialDocsState();
  }
}

export async function saveDocsState(
  roomId: string,
  state: RoomDocsState
): Promise<void> {
  await getRedisClient().set(docsKey(roomId), JSON.stringify(state));
}

export async function broadcastDocsUpdate(
  roomId: string,
  state: RoomDocsState
): Promise<void> {
  const redis = getRedisClient();
  const notifyKey = `room:${roomId}:notify`;
  await redis.rpush(
    notifyKey,
    JSON.stringify({ type: DOCS_CHANNEL, payload: state })
  );
  await redis.ltrim(notifyKey, -100, -1);
}
