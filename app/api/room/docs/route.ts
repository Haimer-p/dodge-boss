import { NextRequest, NextResponse } from "next/server";
import {
  getDocsState,
  saveDocsState,
  broadcastDocsUpdate,
} from "@/lib/docs-redis";
import {
  createPage,
  updatePage,
  deletePage,
  deleteFile,
} from "@/lib/room-docs";

export async function GET(req: NextRequest) {
  const roomId = req.nextUrl.searchParams.get("roomId");
  if (!roomId) {
    return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
  }
  const state = await getDocsState(roomId);
  return NextResponse.json({ state });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomId, userId, username, action } = body;

    if (!roomId || !userId || !username || !action) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    let state = await getDocsState(roomId);

    if (action === "createPage") {
      state = createPage(
        state,
        userId,
        username,
        body.title ?? "Untitled",
        body.parentId ?? null
      );
    } else if (action === "updatePage") {
      const patch: { title?: string; content?: string } = {};
      if (body.title !== undefined) patch.title = body.title;
      if (body.content !== undefined) patch.content = body.content;
      const result = updatePage(state, body.pageId, userId, username, patch);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      state = result.state;
    } else if (action === "deletePage") {
      const result = deletePage(state, body.pageId);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      state = result.state;
    } else if (action === "deleteFile") {
      const result = deleteFile(state, body.fileId);
      state = result.state;
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    await saveDocsState(roomId, state);
    await broadcastDocsUpdate(roomId, state);

    return NextResponse.json({ state });
  } catch (error) {
    console.error("Docs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
