import "server-only";

import { WALLET_TOPUPS, type WalletTopupId } from "@/lib/billing/pricing.constants";

export const CREDIT_PACK_IDS = Object.keys(WALLET_TOPUPS) as WalletTopupId[];

export function isValidCreditPackId(id: unknown): id is WalletTopupId {
  return CREDIT_PACK_IDS.includes(id as WalletTopupId);
}

export function parseCreditPackId(input: unknown): WalletTopupId {
  if (isValidCreditPackId(input)) {
    return input;
  }
  throw new Error("Invalid credit pack.");
}

export function getWalletValueForPack(packId: WalletTopupId) {
  return WALLET_TOPUPS[packId].walletValueCents;
}
