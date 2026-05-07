import { CREDIT_PACKS } from "@/lib/billing/credit-packs";

export const BILLING_CURRENCY = "USD" as const;
export const PAYMENT_FEE_BPS = 800;

export const CREDIT_UNIT_CENTS = 1;
export const CREDITS_PER_USD = 100;

export const PRICING_MODES = {
  growth: {
    id: "growth",
    name: "Growth Mode",
    scanPrices: {
      image: 2,
      audio: 50,
      videoShort: 30,
      deepVideo: 80,
    },
    walletTopups: {
      nano: {
        id: "nano",
        label: "Nano",
        priceCents: 500,
        walletValueCents: 200,
      },
      starter: {
        id: "starter",
        label: "Starter",
        priceCents: 1000,
        walletValueCents: 500,
      },
      basic: {
        id: "basic",
        label: "Basic",
        priceCents: 1500,
        walletValueCents: 800,
      },
      standard: {
        id: "standard",
        label: "Standard",
        priceCents: 2000,
        walletValueCents: 1100,
      },
      pro: {
        id: "pro",
        label: "Pro",
        priceCents: 3000,
        walletValueCents: 1700,
      },
      elite: {
        id: "elite",
        label: "Elite",
        priceCents: 5000,
        walletValueCents: 3000,
      },
    },
    netRevenueCents: {
      basic: 550,
      proEA: 700,
      loyalty: 910,
      proNormal: 1050,
    },
    subscriptions: {
      basic: { deepVideoMonthlyLimit: 0 },
      proEarlyAccess: { deepVideoMonthlyLimit: 15 },
      proLoyalty: { deepVideoMonthlyLimit: 15 },
      proNormal: { deepVideoMonthlyLimit: 15 },
    },
  },
  transition: {
    id: "transition",
    name: "Transition Mode",
    scanPrices: {
      image: 2,
      audio: 50,
      videoShort: 30,
      deepVideo: 80,
    },
    walletTopups: {
      nano: {
        id: "nano",
        label: "Nano",
        priceCents: 500,
        walletValueCents: 200,
      },
      starter: {
        id: "starter",
        label: "Starter",
        priceCents: 1000,
        walletValueCents: 400,
      },
      basic: {
        id: "basic",
        label: "Basic",
        priceCents: 1500,
        walletValueCents: 650,
      },
      standard: {
        id: "standard",
        label: "Standard",
        priceCents: 2000,
        walletValueCents: 900,
      },
      pro: {
        id: "pro",
        label: "Pro",
        priceCents: 3000,
        walletValueCents: 1400,
      },
      elite: {
        id: "elite",
        label: "Elite",
        priceCents: 5000,
        walletValueCents: 2500,
      },
    },
    netRevenueCents: {
      basic: 550,
      proEA: 700,
      loyalty: 910,
      proNormal: 1050,
    },
    subscriptions: {
      basic: { deepVideoMonthlyLimit: 0 },
      proEarlyAccess: { deepVideoMonthlyLimit: 15 },
      proLoyalty: { deepVideoMonthlyLimit: 15 },
      proNormal: { deepVideoMonthlyLimit: 15 },
    },
  },
  safety: {
    id: "safety",
    name: "Safety Mode",
    scanPrices: {
      image: 3,
      audio: 50,
      videoShort: 40,
      deepVideo: 100,
    },
    walletTopups: {
      nano: {
        id: "nano",
        label: "Nano",
        priceCents: 500,
        walletValueCents: 200,
      },
      starter: {
        id: "starter",
        label: "Starter",
        priceCents: 1000,
        walletValueCents: 400,
      },
      basic: {
        id: "basic",
        label: "Basic",
        priceCents: 1500,
        walletValueCents: 650,
      },
      standard: {
        id: "standard",
        label: "Standard",
        priceCents: 2000,
        walletValueCents: 900,
      },
      pro: {
        id: "pro",
        label: "Pro",
        priceCents: 3000,
        walletValueCents: 1400,
      },
      elite: {
        id: "elite",
        label: "Elite",
        priceCents: 5000,
        walletValueCents: 2500,
      },
    },
    netRevenueCents: {
      basic: 550,
      loyalty: 910,
      proNormal: 1050,
    },
    subscriptions: {
      basic: { deepVideoMonthlyLimit: 1 },
      proEarlyAccess: { deepVideoMonthlyLimit: 15 },
      proLoyalty: { deepVideoMonthlyLimit: 15 },
      proNormal: { deepVideoMonthlyLimit: 15 },
    },
  },
} as const;

export type PricingMode = keyof typeof PRICING_MODES;

export const ACTIVE_PRICING_MODE: PricingMode = "growth";
export const ACTIVE_PRICING = PRICING_MODES[ACTIVE_PRICING_MODE];

export const SUBSCRIPTION_PHASES = {
  basicNormal: {
    id: "basic_normal",
    planId: "basic",
    name: "Basic",
    priceCents: 799,
    monthlyCredits: 300,
    deepVideoMonthlyLimit:
      ACTIVE_PRICING.subscriptions.basic.deepVideoMonthlyLimit,
  },
  proEarlyAccess: {
    id: "pro_early_access",
    planId: "pro",
    name: "Pro",
    priceCents: 999,
    monthlyCredits: 700,
    deepVideoMonthlyLimit:
      ACTIVE_PRICING.subscriptions.proEarlyAccess.deepVideoMonthlyLimit,
  },
  proLoyalty: {
    id: "pro_loyalty",
    planId: "pro",
    name: "Pro",
    priceCents: 1299,
    monthlyCredits: 600,
    deepVideoMonthlyLimit:
      ACTIVE_PRICING.subscriptions.proLoyalty.deepVideoMonthlyLimit,
  },
  proNormal: {
    id: "pro_normal",
    planId: "pro",
    name: "Pro",
    priceCents: 1499,
    monthlyCredits: 500,
    deepVideoMonthlyLimit:
      ACTIVE_PRICING.subscriptions.proNormal.deepVideoMonthlyLimit,
  },
} as const;

// Compatibility export used by the current app while V5 routing is wired in later steps.
export const EARLY_ACCESS_PLANS = {
  basic: {
    id: "basic" as const,
    name: "Basic",
    monthlyCredits: SUBSCRIPTION_PHASES.basicNormal.monthlyCredits,
    earlyAccessPriceCents: SUBSCRIPTION_PHASES.basicNormal.priceCents,
    currentPriceCents: SUBSCRIPTION_PHASES.basicNormal.priceCents,
    imageCost: ACTIVE_PRICING.scanPrices.image,
    audioCost: ACTIVE_PRICING.scanPrices.audio,
    videoShortCost: ACTIVE_PRICING.scanPrices.videoShort,
    deepVideoCost: ACTIVE_PRICING.scanPrices.deepVideo,
    deepVideoMonthlyLimit:
      SUBSCRIPTION_PHASES.basicNormal.deepVideoMonthlyLimit,
  },
  pro: {
    id: "pro" as const,
    name: "Pro",
    monthlyCredits: SUBSCRIPTION_PHASES.proEarlyAccess.monthlyCredits,
    earlyAccessPriceCents: SUBSCRIPTION_PHASES.proEarlyAccess.priceCents,
    currentPriceCents: SUBSCRIPTION_PHASES.proEarlyAccess.priceCents,
    imageCost: ACTIVE_PRICING.scanPrices.image,
    audioCost: ACTIVE_PRICING.scanPrices.audio,
    videoShortCost: ACTIVE_PRICING.scanPrices.videoShort,
    deepVideoCost: ACTIVE_PRICING.scanPrices.deepVideo,
    deepVideoMonthlyLimit:
      SUBSCRIPTION_PHASES.proEarlyAccess.deepVideoMonthlyLimit,
  },
} as const;

export type EarlyAccessPlanId = keyof typeof EARLY_ACCESS_PLANS;

export const WALLET_TOPUPS = Object.fromEntries(
  CREDIT_PACKS.map((pack) => [
    pack.id,
    {
      ...pack,
      bonusCents: pack.walletValueCents - pack.priceCents,
    },
  ]),
) as {
  readonly [Pack in (typeof CREDIT_PACKS)[number] as Pack["id"]]: Pack & {
    readonly bonusCents: number;
  };
};

export const WALLET_TOPUP_LIST = Object.values(WALLET_TOPUPS);
export type WalletTopupId = keyof typeof WALLET_TOPUPS;

export const SCAN_PRICES = {
  image: ACTIVE_PRICING.scanPrices.image,
  audio: ACTIVE_PRICING.scanPrices.audio,
  video15: ACTIVE_PRICING.scanPrices.videoShort,
  video30: ACTIVE_PRICING.scanPrices.videoShort,
  video60: ACTIVE_PRICING.scanPrices.deepVideo,
} as const;

export const FREE_SCAN_PRICES = {
  image: 5,
  audio: 80,
  video15: 60,
  video60: 0,
} as const;

export const PROTECTION_LIMITS = {
  maxDeepScansPerDay: 5,
  maxTotalScansPerDayTrial: 5,
  maxTotalScansPerDayWallet: 5,
  maxTotalScansPerDayBasic: 10,
  maxTotalScansPerDayPro: 10,
  maxDeepScansPerMonthEarlyAccessPro: 15,
  maxDeepScansPerMonthNormalPro: 15,
  maxAudioScansPerMonth: 15,
  maxShortVideoScansPerDay: 10,
  maxFailedRetriesPerDay: 5,
  costSoftAlertBps: 8000,
  costHardStopBps: 12000,
  hardStopDeepScansPerDay: 1,
  rolloverCapBps: 5000,
  creditExpiryAfterInactiveMonths: 12,
} as const;

export const HIVE_ESTIMATED_COSTS = {
  image: 0.6,
  audio: 33.4,
  video15: 9.0,
  video30: 9.0,
  video60: 36.0,
} as const;
