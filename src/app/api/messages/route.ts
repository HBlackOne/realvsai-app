import { NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/auth/get-or-create-user";
import { listMessagesByUserId, serializeAppMessage } from "@/lib/services/messages";

export async function GET() {
  try {
    const user = await getOrCreateCurrentUser();
    const messages = await listMessagesByUserId(user.id, 20);

    return NextResponse.json({
      success: true,
      data: messages.map((message: Awaited<ReturnType<typeof listMessagesByUserId>>[number]) => {
        const serialized = serializeAppMessage(message);
        return {
          ...serialized,
          createdAt: serialized.createdAt.toISOString(),
          updatedAt: serialized.updatedAt.toISOString(),
        };
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
