import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { rejectUnlessAuthorized } from "@/lib/auth";
import { MAX_PHOTO_BYTES, PHOTO_CONTENT_TYPES, PHOTO_PREFIX } from "@/lib/room-store";

// Photos go straight from the browser to Blob storage because Vercel functions
// reject request bodies over 4.5 MB; this route only hands out upload tokens.
export async function POST(request: Request) {
  const denied = rejectUnlessAuthorized(request.headers.get("x-upload-password"));
  if (denied) return denied;

  try {
    const result = await handleUpload({
      request,
      body: (await request.json()) as HandleUploadBody,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith(PHOTO_PREFIX)) throw new Error("Invalid upload path.");
        return {
          allowedContentTypes: PHOTO_CONTENT_TYPES,
          maximumSizeInBytes: MAX_PHOTO_BYTES,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
