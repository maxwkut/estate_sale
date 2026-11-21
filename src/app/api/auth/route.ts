import { NextResponse } from "next/server";
import { rejectUnlessAuthorized } from "@/lib/auth";

export async function POST(request: Request) {
  const { password } = (await request.json().catch(() => ({}))) as {
    password?: string;
  };
  return rejectUnlessAuthorized(password ?? null) ?? NextResponse.json({ ok: true });
}
