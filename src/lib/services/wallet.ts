import "server-only";

import { db } from "@/lib/db";
import { TRIAL_INTERNAL_VALUE_CENTS } from "@/lib/billing/trial.constants";

export async function ensureUserWallet(userId: string) {
  const existingWallet = await db.wallet.findUnique({
    where: { userId },
  });

  if (existingWallet) {
    return existingWallet;
  }

  await db.user.update({
    where: { id: userId },
    data: { trialScanBalance: TRIAL_INTERNAL_VALUE_CENTS },
  });

  return db.wallet.create({
    data: {
      userId,
      balance: 0,
    },
  });
}

export async function getWalletByUserId(userId: string) {
  return db.wallet.findUnique({
    where: { userId },
  });
}

export function serializeWallet(wallet: Awaited<ReturnType<typeof getWalletByUserId>>) {
  if (!wallet) return null;

  return {
    id: wallet.id,
    balance: wallet.balance,
    currency: wallet.currency,
    createdAt: wallet.createdAt,
    updatedAt: wallet.updatedAt,
  };
}
