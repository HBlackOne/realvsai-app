export const BILLING_CURRENCY = "USD" as const;
export const PAYMENT_FEE_BPS = 800;

export const CREDIT_UNIT_CENTS = 1;
export const CREDITS_PER_USD = 100;

export const PRICING_MODES = {
  growth: {
    id: "growth",
    name: "Growth Mode",
    scanPrices: {
      image: 5,
      audio: 40,
      videoShort: 100,
      deepVideo: 240,
    },
    walletTopups: {
      starter: {
        id: "starter",
        label: "Starter",
        priceCents: 1000,
        walletValueCents: 1100,
      },
      basic: {
        id: "basic",
        label: "Basic",
        priceCents: 1500,
        walletValueCents: 1700,
      },
      standard: {
        id: "standard",
        label: "Standard",
        priceCents: 2000,
        walletValueCents: 2400,
      },
      pro: {
        id: "pro",
        label: "Pro",
        priceCents: 3000,
        walletValueCents: 3600,
      },
      elite: {
        id: "elite",
        label: "Elite",
        priceCents: 5000,
        walletValueCents: 6500,
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
      proEarlyAccess: { deepVideoMonthlyLimit: 12 },
      proLoyalty: { deepVideoMonthlyLimit: 12 },
      proNormal: { deepVideoMonthlyLimit: 20 },
    },
  },
  transition: {
    id: "transition",
    name: "Transition Mode",
    scanPrices: {
      image: 5,
      audio: 40,
      videoShort: 100,
      deepVideo: 240,
    },
    walletTopups: {
      starter: {
        id: "starter",
        label: "Starter",
        priceCents: 1000,
        walletValueCents: 950,
      },
      basic: {
        id: "basic",
        label: "Basic",
        priceCents: 1500,
        walletValueCents: 1450,
      },
      standard: {
        id: "standard",
        label: "Standard",
        priceCents: 2000,
        walletValueCents: 2000,
      },
      pro: {
        id: "pro",
        label: "Pro",
        priceCents: 3000,
        walletValueCents: 3000,
      },
      elite: {
        id: "elite",
        label: "Elite",
        priceCents: 5000,
        walletValueCents: 5200,
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
      proEarlyAccess: { deepVideoMonthlyLimit: 12 },
      proLoyalty: { deepVideoMonthlyLimit: 12 },
      proNormal: { deepVideoMonthlyLimit: 20 },
    },
  },
  safety: {
    id: "safety",
    name: "Safety Mode",
    scanPrices: {
      image: 6,
      audio: 45,
      videoShort: 110,
      deepVideo: 320,
    },
    walletTopups: {
      starter: {
        id: "starter",
        label: "Starter",
        priceCents: 1000,
        walletValueCents: 800,
      },
      basic: {
        id: "basic",
        label: "Basic",
        priceCents: 1500,
        walletValueCents: 1200,
      },
      standard: {
        id: "standard",
        label: "Standard",
        priceCents: 2000,
        walletValueCents: 1700,
      },
      pro: {
        id: "pro",
        label: "Pro",
        priceCents: 3000,
        walletValueCents: 2600,
      },
      elite: {
        id: "elite",
        label: "Elite",
        priceCents: 5000,
        walletValueCents: 4500,
      },
    },
    netRevenueCents: {
      basic: 550,
      loyalty: 910,
      proNormal: 1050,
    },
    subscriptions: {
      basic: { deepVideoMonthlyLimit: 1 },
      proEarlyAccess: { deepVideoMonthlyLimit: 12 },
      proLoyalty: { deepVideoMonthlyLimit: 12 },
      proNormal: { deepVideoMonthlyLimit: 20 },
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
    monthlyCredits: 600,
    deepVideoMonthlyLimit:
      ACTIVE_PRICING.subscriptions.basic.deepVideoMonthlyLimit,
  },
  proEarlyAccess: {
    id: "pro_early_access",
    planId: "pro",
    name: "Pro",
    priceCents: 999,
    monthlyCredits: 1400,
    deepVideoMonthlyLimit:
      ACTIVE_PRICING.subscriptions.proEarlyAccess.deepVideoMonthlyLimit,
  },
  proLoyalty: {
    id: "pro_loyalty",
    planId: "pro",
    name: "Pro",
    priceCents: 1299,
    monthlyCredits: 1100,
    deepVideoMonthlyLimit:
      ACTIVE_PRICING.subscriptions.proLoyalty.deepVideoMonthlyLimit,
  },
  proNormal: {
    id: "pro_normal",
    planId: "pro",
    name: "Pro",
    priceCents: 1499,
    monthlyCredits: 900,
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
    currentPriceCents: SUBSCRIPTION_PHASES.proNormal.priceCents,
    imageCost: ACTIVE_PRICING.scanPrices.image,
    audioCost: ACTIVE_PRICING.scanPrices.audio,
    videoShortCost: ACTIVE_PRICING.scanPrices.videoShort,
    deepVideoCost: ACTIVE_PRICING.scanPrices.deepVideo,
    deepVideoMonthlyLimit:
      SUBSCRIPTION_PHASES.proEarlyAccess.deepVideoMonthlyLimit,
  },
} as const;

export type EarlyAccessPlanId = keyof typeof EARLY_ACCESS_PLANS;

export const WALLET_TOPUPS = {
  starter: {
    ...ACTIVE_PRICING.walletTopups.starter,
    bonusCents:
      ACTIVE_PRICING.walletTopups.starter.walletValueCents -
      ACTIVE_PRICING.walletTopups.starter.priceCents,
  },
  basic: {
    ...ACTIVE_PRICING.walletTopups.basic,
    bonusCents:
      ACTIVE_PRICING.walletTopups.basic.walletValueCents -
      ACTIVE_PRICING.walletTopups.basic.priceCents,
  },
  standard: {
    ...ACTIVE_PRICING.walletTopups.standard,
    bonusCents:
      ACTIVE_PRICING.walletTopups.standard.walletValueCents -
      ACTIVE_PRICING.walletTopups.standard.priceCents,
  },
  pro: {
    ...ACTIVE_PRICING.walletTopups.pro,
    bonusCents:
      ACTIVE_PRICING.walletTopups.pro.walletValueCents -
      ACTIVE_PRICING.walletTopups.pro.priceCents,
  },
  elite: {
    ...ACTIVE_PRICING.walletTopups.elite,
    bonusCents:
      ACTIVE_PRICING.walletTopups.elite.walletValueCents -
      ACTIVE_PRICING.walletTopups.elite.priceCents,
  },
} as const;

export const WALLET_TOPUP_LIST = Object.values(WALLET_TOPUPS);
export type WalletTopupId = keyof typeof WALLET_TOPUPS;

export const SCAN_PRICES = {
  image: ACTIVE_PRICING.scanPrices.image,
  audio: ACTIVE_PRICING.scanPrices.audio,
  video15: ACTIVE_PRICING.scanPrices.videoShort,
  video30: ACTIVE_PRICING.scanPrices.videoShort,
  video60: ACTIVE_PRICING.scanPrices.deepVideo,
} as const;

export const PROTECTION_LIMITS = {
  maxDeepScansPerDay: 5,
  maxDeepScansPerMonthEarlyAccessPro: 12,
  maxDeepScansPerMonthNormalPro: 20,
  maxShortVideoScansPerDay: 10,
  maxFailedRetriesPerDay: 5,
  costSoftAlertBps: 8000,
  costHardStopBps: 12000,
  hardStopDeepScansPerDay: 1,
  rolloverCapBps: 5000,
  creditExpiryAfterInactiveMonths: 12,
} as const;

export const HIVE_ESTIMATED_COSTS = {
  image: 2,
  audio: 25,
  video15: 80,
  video30: 80,
  video60: 150,
} as const;
