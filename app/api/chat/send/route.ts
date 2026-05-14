import { NextRequest, NextResponse } from "next/server";
import { saveMessage, getRedisClient } from "@/lib/redis";
import { createMessage } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { roomId, userId, username, avatar, content, type } = await req.json();

    if (!roomId || !userId || !username || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const message = createMessage(
      userId,
      username,
      content,
      type || "text",
      avatar
    );

    // Save to Redis message history
    await saveMessage(roomId, message);

    // Push to notification list for SSE polling
    const redis = getRedisClient();
    await redis.rpush(`room:${roomId}:notify`, JSON.stringify(message));
    // Keep notify list small (last 100)
    await redis.ltrim(`room:${roomId}:notify`, -100, -1);

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
