import { getKvRedis } from "./redis-store";
import { generateId } from "./utils";
import { roomExists } from "./redis";

export interface RoomMemberRecord {
  userId: string;
  username: string;
  avatar?: string;
  registeredAt: number;
}

function memberRegistryKey(roomId: string): string {
  return `room:${roomId}:member-registry`;
}

export function normalizeRoomUsername(username: string): string {
  return username.trim().toLowerCase();
}

export async function resolveRoomMember(
  roomId: string,
  username: string,
  avatar?: string
): Promise<{ record: RoomMemberRecord; isReturning: boolean }> {
  const trimmed = username.trim();
  if (!trimmed) {
    throw new Error("Username is required");
  }

  const exists = await roomExists(roomId);
  if (!exists) {
    throw new Error("Room not found");
  }

  const key = normalizeRoomUsername(trimmed);
  const redis = getKvRedis();
  const registryKey = memberRegistryKey(roomId);

  const raw = await redis.hget(registryKey, key);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as RoomMemberRecord;
      const updated: RoomMemberRecord = {
        ...parsed,
        username: trimmed,
        avatar: avatar ?? parsed.avatar,
      };
      await redis.hset(registryKey, {
        [key]: JSON.stringify(updated),
      });
      return { record: updated, isReturning: true };
    } catch {
      // fall through to re-register
    }
  }

  const record: RoomMemberRecord = {
    userId: generateId(),
    username: trimmed,
    avatar,
    registeredAt: Date.now(),
  };

  await redis.hset(registryKey, {
    [key]: JSON.stringify(record),
  });

  return { record, isReturning: false };
}

export async function getRoomMemberByUsername(
  roomId: string,
  username: string
): Promise<RoomMemberRecord | null> {
  const key = normalizeRoomUsername(username);
  const raw = await getKvRedis().hget(memberRegistryKey(roomId), key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RoomMemberRecord;
  } catch {
    return null;
  }
}
