export const CREDIT_PACKS = [
  {
    id: "nano",
    label: "Nano",
    priceCents: 500,
    walletValueCents: 200,
  },
  {
    id: "starter",
    label: "Starter",
    priceCents: 1000,
    walletValueCents: 500,
  },
  {
    id: "basic",
    label: "Basic",
    priceCents: 1500,
    walletValueCents: 800,
  },
  {
    id: "standard",
    label: "Standard",
    priceCents: 2000,
    walletValueCents: 1100,
  },
  {
    id: "pro",
    label: "Pro",
    priceCents: 3000,
    walletValueCents: 1700,
  },
  {
    id: "elite",
    label: "Elite",
    priceCents: 5000,
    walletValueCents: 3000,
  },
] as const;

export type CreditPackId = (typeof CREDIT_PACKS)[number]["id"];
export type CreditPack = (typeof CREDIT_PACKS)[number];
