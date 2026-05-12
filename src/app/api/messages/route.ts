import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateCurrentUser } from "@/lib/auth/get-or-create-user";
import { countUnreadMessagesByUserId, getMessageStatsByUserId, listMessagesByUserId, serializeAppMessage } from "@/lib/services/messages";

const CATEGORY_TYPES: Record<string, string[]> = {
  scans: ["scan_complete", "scan_failed"],
  billing: [
    "credits_purchased",
    "purchase_recap",
    "subscription_start",
    "subscription_renew",
    "subscription_cancel",
    "trial_ending",
    "trial_expired",
    "credits_low",
  ],
  system: ["product_update", "announcement", "maintenance"],
};

export async function GET(request: Request) {
  try {
    const user = await getOrCreateCurrentUser();
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";

    if (unreadOnly) {
      const unreadCount = await countUnreadMessagesByUserId(user.id);
      return NextResponse.json({ unreadCount });
    }

    const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 20), 1), 50);
    const cursor = searchParams.get("cursor");
    const category = searchParams.get("category");
    const types = category ? CATEGORY_TYPES[category] : null;

    const [messages, stats] = types
      ? await Promise.all([
          db.appMessage.findMany({
            where: { userId: user.id, type: { in: types } },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            take: limit + 1,
            ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
          }),
          Promise.all([
            db.appMessage.count({ where: { userId: user.id, type: { in: types } } }),
            db.appMessage.count({ where: { userId: user.id, type: { in: types }, isRead: false } }),
          ]).then(([total, unread]) => ({ total, unread })),
        ])
      : await Promise.all([
          listMessagesByUserId(user.id, limit + 1, cursor),
          getMessageStatsByUserId(user.id),
        ]);
    const hasMore = messages.length > limit;
    const page = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor = hasMore ? (page[page.length - 1]?.id ?? null) : null;
    const data = page.map((message: Awaited<ReturnType<typeof listMessagesByUserId>>[number]) => {
      const serialized = serializeAppMessage(message);
      return {
        ...serialized,
        createdAt: serialized.createdAt.toISOString(),
        updatedAt: serialized.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      data,
      messages: data,
      nextCursor,
      meta: { nextCursor, stats },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
