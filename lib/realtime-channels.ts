export type GameChannel = "caro" | "chess" | "xiangqi" | "bowling";

export const GAME_CHANNELS: GameChannel[] = [
  "caro",
  "chess",
  "xiangqi",
  "bowling",
];

export const DOCS_CHANNEL = "docs" as const;

export type RoomRealtimeChannel = GameChannel | typeof DOCS_CHANNEL;

export const REALTIME_CHANNELS = [...GAME_CHANNELS, DOCS_CHANNEL] as const;

export function readVersion(state: unknown): number {
  if (state && typeof state === "object" && "version" in state) {
    return Number((state as { version: number }).version) || 0;
  }
  return 0;
}
