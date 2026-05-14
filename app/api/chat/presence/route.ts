import { NextRequest, NextResponse } from "next/server";
import { upsertPresence, markPresenceOffline } from "@/lib/redis";

type PresenceAction = "join" | "heartbeat" | "leave";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomId, userId, username, avatar, action } = body as {
      roomId?: string;
      userId?: string;
      username?: string;
      avatar?: string;
      action?: PresenceAction;
    };

    if (!roomId || !userId || !username || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (action === "leave") {
      await markPresenceOffline(roomId, userId);
    } else if (action === "join" || action === "heartbeat") {
      await upsertPresence(roomId, userId, username, avatar);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Presence error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
