import "server-only";
import {
  WALLET_TOPUPS,
  EARLY_ACCESS_PLANS,
  type WalletTopupId,
  type EarlyAccessPlanId,
} from "@/lib/billing/pricing.constants";

function env(primary: string, fallback?: string) {
  return process.env[primary] || (fallback ? process.env[fallback] : undefined);
}

const CREDIT_VARIANT_ENVS: Record<WalletTopupId, string | undefined> = {
  nano: env("LEMONSQUEEZY_VARIANT_CREDITS_NANO"),
  starter: env("LEMONSQUEEZY_VARIANT_CREDITS_STARTER"),
  basic: env("LEMONSQUEEZY_VARIANT_CREDITS_BASIC"),
  standard: env("LEMONSQUEEZY_VARIANT_CREDITS_STANDARD"),
  pro: env("LEMONSQUEEZY_VARIANT_CREDITS_PRO"),
  elite: env("LEMONSQUEEZY_VARIANT_CREDITS_ELITE"),
};

export const TOPUP_PRODUCT_LABELS: Record<WalletTopupId, string> = {
  nano: "Nano",
  starter: "Starter",
  basic: "Basic",
  standard: "Standard",
  pro: "Pro",
  elite: "Elite",
};

// Hybrid V5 LemonSqueezy subscription variants.
// Basic has no trial. Pro trial silently routes to EA or normal based on User.earlyAccessEligible.
export const SUBSCRIPTION_VARIANT_ENVS = {
  basicNormal: env(
    "LS_VARIANT_BASIC_NORMAL",
    "LEMONSQUEEZY_VARIANT_BASIC_NORMAL",
  ),
  proTrialEarlyAccess: env(
    "LS_VARIANT_PRO_TRIAL_EA",
    "LEMONSQUEEZY_VARIANT_PRO_TRIAL_EA",
  ),
  proTrialNormal: env(
    "LS_VARIANT_PRO_TRIAL_NORMAL",
    "LEMONSQUEEZY_VARIANT_PRO_TRIAL_NORMAL",
  ),
  proLoyalty: env("LS_VARIANT_PRO_LOYALTY", "LEMONSQUEEZY_VARIANT_PRO_LOYALTY"),
  proNormal: env("LS_VARIANT_PRO_NORMAL", "LEMONSQUEEZY_VARIANT_PRO_NORMAL"),
} as const;

export const SUBSCRIPTION_PLAN_LABELS: Record<EarlyAccessPlanId, string> = {
  basic: "Basic",
  pro: "Pro",
};

export function isEarlyAccessActive() {
  if (
    String(process.env.EARLY_ACCESS_ENABLED || "true").toLowerCase() !==
    "true"
  )
    return false;
  const endsAt = process.env.EARLY_ACCESS_ENDS_AT;
  if (!endsAt) return true;
  return new Date() < new Date(endsAt);
}

export function getLemonConfig() {
  return {
    apiKey: env("LS_API_KEY", "LEMONSQUEEZY_API_KEY") || "",
    storeId: env("LS_STORE_ID", "LEMONSQUEEZY_STORE_ID") || "",
    webhookSecret:
      env("LS_WEBHOOK_SECRET", "LEMONSQUEEZY_WEBHOOK_SECRET") || "",
    appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3021",
    premiumVariantId: process.env.LEMONSQUEEZY_VARIANT_PREMIUM || "",
  };
}

export function getCreditPackVariantId(packId: WalletTopupId): string {
  const variantId = CREDIT_VARIANT_ENVS[packId];

  if (!variantId) {
    throw new Error(
      `Missing LemonSqueezy variant id for ${TOPUP_PRODUCT_LABELS[packId]} top-up. Set LEMONSQUEEZY_VARIANT_CREDITS_${packId.toUpperCase()} env var.`,
    );
  }

  return variantId;
}

export function getCreditPackByVariantId(variantId: string | number) {
  const normalizedVariantId = String(variantId);

  const match = Object.entries(CREDIT_VARIANT_ENVS).find(
    ([, mappedVariantId]) =>
      mappedVariantId && String(mappedVariantId) === normalizedVariantId,
  );

  if (!match) {
    return null;
  }

  return match[0] as WalletTopupId;
}

function requireSubscriptionVariant(
  key: keyof typeof SUBSCRIPTION_VARIANT_ENVS,
  label: string,
): string {
  const variantId = SUBSCRIPTION_VARIANT_ENVS[key];

  if (!variantId) {
    throw new Error(
      `Missing LemonSqueezy variant id for ${label}. Set ${key} in V5 subscription env mapping.`,
    );
  }

  return variantId;
}

export function getBasicNormalVariantId(): string {
  return requireSubscriptionVariant("basicNormal", "Basic normal subscription");
}

export function getProTrialVariantId(earlyAccessEligible: boolean): string {
  return earlyAccessEligible
    ? requireSubscriptionVariant(
        "proTrialEarlyAccess",
        "Pro trial Early Access subscription",
      )
    : requireSubscriptionVariant(
        "proTrialNormal",
        "Pro trial normal subscription",
      );
}

export function getProLoyaltyVariantId(): string {
  return requireSubscriptionVariant("proLoyalty", "Pro loyalty subscription");
}

export function getProNormalVariantId(): string {
  return requireSubscriptionVariant("proNormal", "Pro normal subscription");
}

export function getSubscriptionVariantId(planId: EarlyAccessPlanId): string {
  if (planId === "basic") return getBasicNormalVariantId();
  return getProTrialVariantId(true);
}

export function getCurrentSubscriptionVariantId(
  planId: EarlyAccessPlanId,
): string {
  if (planId === "basic") return getBasicNormalVariantId();
  return getProNormalVariantId();
}

export function getCheckoutSubscriptionVariantId(
  planId: EarlyAccessPlanId,
): string {
  if (planId === "basic") return getBasicNormalVariantId();
  return getProNormalVariantId();
}

export function getSubscriptionPlanByVariantId(
  variantId: string | number,
): EarlyAccessPlanId | null {
  const normalizedVariantId = String(variantId);

  if (
    SUBSCRIPTION_VARIANT_ENVS.basicNormal &&
    String(SUBSCRIPTION_VARIANT_ENVS.basicNormal) === normalizedVariantId
  ) {
    return "basic";
  }

  const proVariantIds = [
    SUBSCRIPTION_VARIANT_ENVS.proTrialEarlyAccess,
    SUBSCRIPTION_VARIANT_ENVS.proTrialNormal,
    SUBSCRIPTION_VARIANT_ENVS.proLoyalty,
    SUBSCRIPTION_VARIANT_ENVS.proNormal,
  ];

  if (
    proVariantIds.some(
      (mappedVariantId) =>
        mappedVariantId && String(mappedVariantId) === normalizedVariantId,
    )
  ) {
    return "pro";
  }

  return null;
}

export function assertLemonConfig() {
  const config = getLemonConfig();

  if (!config.apiKey) throw new Error("Missing LEMONSQUEEZY_API_KEY.");
  if (!config.storeId) throw new Error("Missing LEMONSQUEEZY_STORE_ID.");

  return config;
}
