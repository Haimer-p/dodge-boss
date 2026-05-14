import { Redis } from "@upstash/redis";
import { ChatMessage } from "@/lib/types";
import { getActiveTypers } from "@/lib/redis";
import { GAME_CHANNELS, readVersion } from "@/lib/game-redis";

const POLL_MS = 500;

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function typersSignature(typers: { userId: string; updatedAt: number }[]): string {
  return typers.map((t) => `${t.userId}:${t.updatedAt}`).sort().join("|");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");

  if (!roomId) {
    return new Response("Missing roomId", { status: 400 });
  }

  const url =
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.UPSTASH_REDIS_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.UPSTASH_REDIS_TOKEN;
  if (!url || !token) {
    return new Response("Server config error", { status: 500 });
  }

  const redis = new Redis({ url, token });
  const encoder = new TextEncoder();
  const NOTIFY_KEY = `room:${roomId}:notify`;

  let lastMessageCount = await redis.llen(NOTIFY_KEY);
  let lastTypingSig = "";
  const lastGameVersions: Record<string, number> = {};

  for (const channel of GAME_CHANNELS) {
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
                  GAME_CHANNELS.includes(data.type) &&
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

          for (const channel of GAME_CHANNELS) {
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
