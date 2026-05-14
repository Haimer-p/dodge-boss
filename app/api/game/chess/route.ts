import { NextRequest, NextResponse } from "next/server";
import {
  broadcastGameEvent,
  getGameState,
  saveGameState,
} from "@/lib/game-redis";
import {
  applyChessMove,
  createInitialChessState,
  joinChessGame,
  resignChess,
  resetChessGame,
  ChessGameState,
} from "@/lib/chess-game";

export async function GET(req: NextRequest) {
  const roomId = req.nextUrl.searchParams.get("roomId");
  if (!roomId) {
    return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
  }
  const state = await getGameState(roomId, "chess", createInitialChessState);
  return NextResponse.json({ state });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomId, userId, username, action, from, to, promotion } = body;

    if (!roomId || !userId || !username || !action) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    let state = await getGameState<ChessGameState>(
      roomId,
      "chess",
      createInitialChessState
    );

    if (action === "join") {
      state = joinChessGame(state, userId, username);
    } else if (action === "move") {
      const result = applyChessMove(state, userId, from, to, promotion);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      state = result.state;
    } else if (action === "resign") {
      const result = resignChess(state, userId);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      state = result.state;
    } else if (action === "reset") {
      state = resetChessGame(state);
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    await saveGameState(roomId, "chess", state);
    await broadcastGameEvent(roomId, "chess", state);

    return NextResponse.json({ success: true, state });
  } catch (error) {
    console.error("Chess action error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
