import "server-only";

import { auth } from "@clerk/nextjs/server";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

const MAX_FILE_SIZE: Record<string, number> = {
  image: 10 * 1024 * 1024,
  audio: 50 * 1024 * 1024,
  short_video: 100 * 1024 * 1024,
  deep_video: 500 * 1024 * 1024,
};

const ALLOWED_MEDIA_TYPES = new Set([
  "image",
  "audio",
  "short_video",
  "deep_video",
]);

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Upload failed." }, { status: 400 });
  }

  const file = formData.get("file");

  if (!file || typeof file !== "object") {
    return NextResponse.json({ error: "Upload failed." }, { status: 400 });
  }

  const mediaType = String(formData.get("mediaType") ?? "");

  if (!ALLOWED_MEDIA_TYPES.has(mediaType)) {
    return NextResponse.json({ error: "Upload failed." }, { status: 400 });
  }

  if (!file.size || file.size > MAX_FILE_SIZE[mediaType]) {
    return NextResponse.json({ error: "File too large." }, { status: 400 });
  }

  let blobPathname: string;
  let blobUrl: string;

  try {
    const blob = await put(`uploads/${userId}/${crypto.randomUUID()}`, file, {
      access: "public",
    });
    blobUrl = blob.url;
    blobPathname = blob.pathname;
  } catch {
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }

  return NextResponse.json({ blobUrl, blobPathname });
}
