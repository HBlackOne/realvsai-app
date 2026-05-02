export const LEGACY_COIN_TO_CENTS = 100;

export const LEGACY_PACK_TO_WALLET_CENTS = {
  50: 500,
  150: 1500,
  300: 3000,
  500: 5000,
} as const;

export type LegacyPackAmount = keyof typeof LEGACY_PACK_TO_WALLET_CENTS;
