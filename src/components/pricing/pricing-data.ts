import { SCAN_PRICES, WALLET_TOPUP_LIST } from "@/lib/billing/pricing.constants";

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export const CREDIT_PACKS = WALLET_TOPUP_LIST.map((topup) => ({
  id: topup.id,
  amount: topup.walletValueCents,
  label: topup.label,
  price: moneyFormatter.format(topup.priceCents / 100),
  per: moneyFormatter.format((topup.walletValueCents / topup.priceCents) * 100) + "/100 credits",
  valueLabel: `${topup.walletValueCents} credits`,
  popular: topup.id === "standard",
}));

export const PREMIUM_FEATURES = [
  "Start with the limited free trial",
  "Continue with wallet-based usage after trial",
  "Saved results and billing visibility",
  "Expanded tools as the product grows",
];

export const SCAN_COSTS = [
  { label: "Image", cost: `${SCAN_PRICES.image} credits` },
  { label: "Audio", cost: `${SCAN_PRICES.audio} credits` },
  { label: "Video", cost: `${SCAN_PRICES.video15} credits+` },
];
