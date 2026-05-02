import "server-only";

import { db } from "@/lib/db";

const CHECKOUT_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function createCheckoutToken({
  userId,
  variantId,
}: {
  userId: string;
  variantId: string;
}) {
  const expiresAt = new Date(Date.now() + CHECKOUT_TOKEN_TTL_MS);

  const token = await db.checkoutToken.create({
    data: {
      userId,
      variantId,
      expiresAt,
    },
  });

  return token.token;
}
