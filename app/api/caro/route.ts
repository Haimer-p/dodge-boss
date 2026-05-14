import { NextRequest, NextResponse } from "next/server";
import { getCaroState, saveCaroState } from "@/lib/redis";
import {
  applyCaroMove,
  joinCaroGame,
  resetCaroGame,
} from "@/lib/caro";

export async function GET(req: NextRequest) {
  const roomId = req.nextUrl.searchParams.get("roomId");
  if (!roomId) {
    return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
  }

  const state = await getCaroState(roomId);
  return NextResponse.json({ state });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomId, userId, username, action, row, col } = body;

    if (!roomId || !userId || !username || !action) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    let state = await getCaroState(roomId);

    if (action === "join") {
      state = joinCaroGame(state, userId, username);
    } else if (action === "move") {
      const result = applyCaroMove(state, userId, Number(row), Number(col));
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      state = result.state;
    } else if (action === "reset") {
      state = resetCaroGame(state);
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    await saveCaroState(roomId, state);

    const redis = (await import("@/lib/redis")).getRedisClient();
    await redis.rpush(
      `room:${roomId}:notify`,
      JSON.stringify({ type: "caro", payload: state })
    );
    await redis.ltrim(`room:${roomId}:notify`, -100, -1);

    return NextResponse.json({ success: true, state });
  } catch (error) {
    console.error("Caro action error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
