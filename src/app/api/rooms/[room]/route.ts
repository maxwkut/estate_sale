import { NextResponse } from "next/server";
import { rejectUnlessAuthorized } from "@/lib/auth";
import { ValidationError, parseRoom, updateRoom } from "@/lib/room-store";

type RouteContext = {
  params: Promise<{ room: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const form = await request.formData();
    const denied = rejectUnlessAuthorized(String(form.get("password") ?? ""));
    if (denied) return denied;

    const room = parseRoom(decodeURIComponent((await context.params).room));
    const description = form.get("description");
    const imageUrl = form.get("imageUrl");

    const view = await updateRoom(room, {
      description: typeof description === "string" ? description : undefined,
      imageUrl: typeof imageUrl === "string" && imageUrl ? imageUrl : undefined,
    });
    return NextResponse.json({ room: view });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
