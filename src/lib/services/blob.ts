import "server-only";

import { del } from "@vercel/blob";

export async function deleteBlob(blobPathname: string): Promise<void> {
  if (!blobPathname) return;

  try {
    await del(blobPathname);
  } catch (error) {
    console.error("[blob] delete failed", error);
  }
}
