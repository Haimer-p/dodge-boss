import { NextResponse } from "next/server";
import { listRooms } from "@/lib/redis";

export async function GET() {
  try {
    const rooms = await listRooms();
    return NextResponse.json({ rooms });
  } catch (error) {
    console.error("List rooms error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
