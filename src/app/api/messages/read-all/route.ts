import { NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/auth/get-or-create-user";
import { markAllMessagesReadByUserId } from "@/lib/services/messages";

export async function POST() {
  try {
    const user = await getOrCreateCurrentUser();
    await markAllMessagesReadByUserId(user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
