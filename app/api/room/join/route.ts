import { NextRequest, NextResponse } from "next/server";
import { verifyRoom } from "@/lib/redis";

export async function POST(req: NextRequest) {
  try {
    const { roomId, password } = await req.json();

    if (!roomId || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const room = await verifyRoom(roomId, password);

    if (!room) {
      return NextResponse.json(
        { error: "Room not found or incorrect password" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      roomId,
      roomName: room.name,
    });
  } catch (error) {
    console.error("Join room error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
