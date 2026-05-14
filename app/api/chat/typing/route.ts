import { NextRequest, NextResponse } from "next/server";
import { setTyping, clearTyping } from "@/lib/redis";

export async function POST(req: NextRequest) {
  try {
    const { roomId, userId, username, isTyping } = await req.json();

    if (!roomId || !userId || !username) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (isTyping) {
      await setTyping(roomId, userId, username);
    } else {
      await clearTyping(roomId, userId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Typing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
