import { NextRequest, NextResponse } from "next/server";
import {
  broadcastGameEvent,
  getGameState,
  saveGameState,
} from "@/lib/game-redis";
import {
  applyBowlingRoll,
  createInitialBowlingState,
  joinBowlingGame,
  resetBowlingGame,
  BowlingGameState,
} from "@/lib/bowling";

export async function GET(req: NextRequest) {
  const roomId = req.nextUrl.searchParams.get("roomId");
  if (!roomId) {
    return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
  }
  const state = await getGameState(roomId, "bowling", createInitialBowlingState);
  return NextResponse.json({ state });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomId, userId, username, action, power, angle } = body;

    if (!roomId || !userId || !username || !action) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    let state = await getGameState<BowlingGameState>(
      roomId,
      "bowling",
      createInitialBowlingState
    );

    if (action === "join") {
      state = joinBowlingGame(state, userId, username);
    } else if (action === "roll") {
      const result = applyBowlingRoll(
        state,
        userId,
        Number(power),
        Number(angle)
      );
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      state = result.state;
    } else if (action === "reset") {
      state = resetBowlingGame(state);
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    await saveGameState(roomId, "bowling", state);
    await broadcastGameEvent(roomId, "bowling", state);

    return NextResponse.json({ success: true, state });
  } catch (error) {
    console.error("Bowling action error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
