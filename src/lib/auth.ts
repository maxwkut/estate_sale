import { NextResponse } from "next/server";

export function rejectUnlessAuthorized(password: string | null) {
  const expected = process.env.UPLOAD_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { error: "Upload password is not configured." },
      { status: 500 },
    );
  }
  if (password !== expected) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }
  return null;
}
