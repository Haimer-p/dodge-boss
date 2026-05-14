import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import {
  getDocsState,
  saveDocsState,
  broadcastDocsUpdate,
} from "@/lib/docs-redis";
import { addFile, deleteFile as removeDocFile } from "@/lib/room-docs";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/json",
  "application/zip",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const roomId = String(form.get("roomId") || "");
    const userId = String(form.get("userId") || "");
    const username = String(form.get("username") || "");
    const pageId = form.get("pageId") ? String(form.get("pageId")) : null;
    const file = form.get("file");

    if (!roomId || !userId || !username || !(file instanceof File)) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File too large (max 5MB)" },
        { status: 400 }
      );
    }

    const mimeType = file.type || "application/octet-stream";
    if (!ALLOWED_TYPES.has(mimeType)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
    }

    const fileId = crypto.randomUUID();
    const safeName = sanitizeFilename(file.name || "file");
    const storedName = `${fileId}-${safeName}`;
    const relDir = path.posix.join("uploads", "rooms", roomId);
    const absDir = path.join(process.cwd(), "public", relDir);
    await mkdir(absDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const absPath = path.join(absDir, storedName);
    await writeFile(absPath, buffer);

    const url = `/${relDir}/${storedName}`;
    let state = await getDocsState(roomId);
    state = addFile(state, {
      pageId,
      name: file.name,
      mimeType,
      size: file.size,
      url,
      uploadedBy: { userId, username },
    });

    await saveDocsState(roomId, state);
    await broadcastDocsUpdate(roomId, state);

    const uploaded = state.files[state.files.length - 1];
    return NextResponse.json({ state, file: uploaded });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomId, userId, username, fileId } = body;

    if (!roomId || !userId || !username || !fileId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    let state = await getDocsState(roomId);
    const result = removeDocFile(state, fileId);
    state = result.state;

    if (result.file?.url) {
      const rel = result.file.url.replace(/^\//, "");
      const absPath = path.join(process.cwd(), "public", rel);
      await unlink(absPath).catch(() => {});
    }

    await saveDocsState(roomId, state);
    await broadcastDocsUpdate(roomId, state);

    return NextResponse.json({ state });
  } catch (error) {
    console.error("Delete file error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
