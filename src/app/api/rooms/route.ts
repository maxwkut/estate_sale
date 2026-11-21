import { NextResponse, type NextRequest } from "next/server";
import { listRooms } from "@/lib/room-store";

export async function GET(request: NextRequest) {
  const fresh = request.nextUrl.searchParams.has("fresh");
  return NextResponse.json({ rooms: await listRooms({ fresh }) });
}
