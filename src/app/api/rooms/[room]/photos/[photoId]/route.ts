import { NextResponse } from "next/server";
import { rejectUnlessAuthorized } from "@/lib/auth";
import { ValidationError, deletePhoto, parseRoom } from "@/lib/room-store";

type RouteContext = {
  params: Promise<{ room: string; photoId: string }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const denied = rejectUnlessAuthorized(request.headers.get("x-upload-password"));
    if (denied) return denied;

    const params = await context.params;
    const room = parseRoom(decodeURIComponent(params.room));
    const view = await deletePhoto(room, params.photoId);
    return NextResponse.json({ room: view });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}
