import { NextRequest, NextResponse } from "next/server";
import {
  broadcastGameEvent,
  getGameState,
  saveGameState,
} from "@/lib/game-redis";
import {
  applyXiangqiMove,
  createInitialXiangqiState,
  joinXiangqiGame,
  resetXiangqiGame,
  XiangqiGameState,
} from "@/lib/xiangqi";

export async function GET(req: NextRequest) {
  const roomId = req.nextUrl.searchParams.get("roomId");
  if (!roomId) {
    return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
  }
  const state = await getGameState(roomId, "xiangqi", createInitialXiangqiState);
  return NextResponse.json({ state });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      roomId,
      userId,
      username,
      action,
      fromRow,
      fromCol,
      toRow,
      toCol,
    } = body;

    if (!roomId || !userId || !username || !action) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    let state = await getGameState<XiangqiGameState>(
      roomId,
      "xiangqi",
      createInitialXiangqiState
    );

    if (action === "join") {
      state = joinXiangqiGame(state, userId, username);
    } else if (action === "move") {
      const result = applyXiangqiMove(
        state,
        userId,
        Number(fromRow),
        Number(fromCol),
        Number(toRow),
        Number(toCol)
      );
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      state = result.state;
    } else if (action === "reset") {
      state = resetXiangqiGame(state);
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    await saveGameState(roomId, "xiangqi", state);
    await broadcastGameEvent(roomId, "xiangqi", state);

    return NextResponse.json({ success: true, state });
  } catch (error) {
    console.error("Xiangqi action error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
