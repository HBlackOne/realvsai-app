import "server-only";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export async function createAppMessage({
  userId,
  type,
  title,
  body,
  dedupeKey,
  metadata,
}: {
  userId: string;
  type: string;
  title: string;
  body: string;
  dedupeKey?: string | null;
  metadata?: Prisma.InputJsonValue | null;
}) {
  if (dedupeKey) {
    const existing = await db.appMessage.findUnique({ where: { dedupeKey } });
    if (existing) return existing;
  }

  return db.appMessage.create({
    data: {
      userId,
      type,
      title,
      body,
      dedupeKey: dedupeKey ?? null,
      metadata: metadata ?? undefined,
    },
  });
}

export async function createPurchaseRecapMessage({
  userId,
  orderId,
  credits,
  amount,
  currency,
}: {
  userId: string;
  orderId: string;
  credits: number;
  amount: number;
  currency?: string | null;
}) {
  const resolvedCurrency = currency || "USD";
  const amountText = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: resolvedCurrency,
  }).format(amount / 100);

  return createAppMessage({
    userId,
    type: "credits_purchased",
    title: "Credits added",
    body: `${credits} credits added to your wallet · ${amountText}`,
    dedupeKey: `credits_purchased:${orderId}`,
    metadata: {
      orderId,
      credits,
      amount,
      currency: resolvedCurrency,
    },
  });
}

export async function listMessagesByUserId(userId: string, limit = 20, cursor?: string | null) {
  return db.appMessage.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
    ...(cursor
      ? {
          skip: 1,
          cursor: { id: cursor },
        }
      : {}),
  });
}

export async function countUnreadMessagesByUserId(userId: string) {
  return db.appMessage.count({
    where: {
      userId,
      isRead: false,
    },
  });
}

export async function getMessageStatsByUserId(userId: string) {
  const [total, unread] = await Promise.all([
    db.appMessage.count({ where: { userId } }),
    db.appMessage.count({ where: { userId, isRead: false } }),
  ]);

  return { total, unread };
}

export async function markAllMessagesReadByUserId(userId: string) {
  return db.appMessage.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });
}

export function serializeAppMessage(message: Awaited<ReturnType<typeof listMessagesByUserId>>[number]) {
  return {
    id: message.id,
    type: message.type,
    title: message.title,
    body: message.body,
    isRead: message.isRead,
    metadata: message.metadata,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
}
