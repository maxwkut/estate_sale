import { NextResponse, connection, type NextRequest } from "next/server";
import { listRooms } from "@/lib/room-store";

export async function GET(request: NextRequest) {
  await connection();
  const fresh = request.nextUrl.searchParams.has("fresh");
  return NextResponse.json({ rooms: await listRooms({ fresh }) });
}
