import { NextRequest, NextResponse } from "next/server";
import { createRoom } from "@/lib/redis";

export async function POST(req: NextRequest) {
  try {
    const { roomId, name, password } = await req.json();

    if (!roomId || !name || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (roomId.length < 3 || roomId.length > 20) {
      return NextResponse.json(
        { error: "Room ID must be 3-20 characters" },
        { status: 400 }
      );
    }

    const success = await createRoom(roomId, name, password);

    if (!success) {
      return NextResponse.json(
        { error: "Room already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true, roomId });
  } catch (error) {
    console.error("Create room error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
