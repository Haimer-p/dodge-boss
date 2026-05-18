import { NextRequest, NextResponse } from "next/server";
import { resolveRoomMember } from "@/lib/room-members";

export async function POST(req: NextRequest) {
  try {
    const { roomId, username, avatar } = await req.json();

    if (!roomId || !username?.trim()) {
      return NextResponse.json(
        { error: "Missing roomId or username" },
        { status: 400 }
      );
    }

    const { record, isReturning } = await resolveRoomMember(
      roomId,
      username,
      avatar
    );

    return NextResponse.json({
      userId: record.userId,
      username: record.username,
      avatar: record.avatar,
      isReturning,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not resolve user";
    const status = message === "Room not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
