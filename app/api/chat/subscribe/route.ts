import { getKvRedis } from "@/lib/redis-store";
import { ChatMessage } from "@/lib/types";
import { getActiveTypers, getRoomPresence } from "@/lib/redis";
import { REALTIME_CHANNELS, readVersion } from "@/lib/realtime-channels";

const POLL_MS = 500;

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function typersSignature(typers: { userId: string; updatedAt: number }[]): string {
  return typers.map((t) => `${t.userId}:${t.updatedAt}`).sort().join("|");
}

function presenceSignature(
  members: { userId: string; online: boolean; lastSeen: number }[]
): string {
  return members
    .map((m) => `${m.userId}:${m.online ? 1 : 0}:${m.lastSeen}`)
    .sort()
    .join("|");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");

  if (!roomId) {
    return new Response("Missing roomId", { status: 400 });
  }

  let redis;
  try {
    redis = getKvRedis();
  } catch {
    return new Response("Server config error", { status: 500 });
  }

  const encoder = new TextEncoder();
  const NOTIFY_KEY = `room:${roomId}:notify`;

  let lastMessageCount = await redis.llen(NOTIFY_KEY);
  let lastTypingSig = "";
  let lastPresenceSig = "";
  const lastGameVersions: Record<string, number> = {};

  for (const channel of REALTIME_CHANNELS) {
    const raw = await redis.get<string>(`room:${roomId}:${channel}`);
    if (raw) {
      try {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        lastGameVersions[channel] = readVersion(parsed);
      } catch {
        lastGameVersions[channel] = 0;
      }
    } else {
      lastGameVersions[channel] = 0;
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`)
      );

      const pollInterval = setInterval(async () => {
        try {
          const currentCount = await redis.llen(NOTIFY_KEY);

          if (currentCount > lastMessageCount) {
            const newItems = await redis.lrange(
              NOTIFY_KEY,
              lastMessageCount,
              currentCount - 1
            );

            lastMessageCount = currentCount;

            for (const item of newItems) {
              try {
                const data = typeof item === "string" ? JSON.parse(item) : item;
                if (
                  data?.type &&
                  REALTIME_CHANNELS.includes(
                    data.type as (typeof REALTIME_CHANNELS)[number]
                  ) &&
                  data.payload
                ) {
                  lastGameVersions[data.type] = readVersion(data.payload);
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: data.type, payload: data.payload })}\n\n`
                    )
                  );
                  continue;
                }
                const msg = data as ChatMessage;
                if (msg.id && msg.content) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify(msg)}\n\n`)
                  );
                }
              } catch {
                // skip bad messages
              }
            }
          }

          for (const channel of REALTIME_CHANNELS) {
            const raw = await redis.get<string>(`room:${roomId}:${channel}`);
            if (!raw) continue;
            try {
              const gameState = typeof raw === "string" ? JSON.parse(raw) : raw;
              const version = readVersion(gameState);
              if (version > (lastGameVersions[channel] ?? 0)) {
                lastGameVersions[channel] = version;
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: channel, payload: gameState })}\n\n`
                  )
                );
              }
            } catch {
              // ignore
            }
          }

          const typers = await getActiveTypers(roomId);
          const sig = typersSignature(typers);
          if (sig !== lastTypingSig) {
            lastTypingSig = sig;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "typing", payload: { typers } })}\n\n`
              )
            );
          }

          const members = await getRoomPresence(roomId);
          const presenceSig = presenceSignature(members);
          if (presenceSig !== lastPresenceSig) {
            lastPresenceSig = presenceSig;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "presence", payload: { members } })}\n\n`
              )
            );
          }
        } catch {
          // continue polling
        }
      }, POLL_MS);

      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          clearInterval(keepAlive);
        }
      }, 20000);

      req.signal.addEventListener("abort", () => {
        clearInterval(pollInterval);
        clearInterval(keepAlive);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
