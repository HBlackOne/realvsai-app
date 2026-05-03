import type { AppMeData } from "@/lib/api/me";

export type UserStateKind =
  | "ea_trial"
  | "normal_trial"
  | "ea_pro"
  | "loyalty_pro"
  | "normal_pro"
  | "basic"
  | "wallet_only"
  | "free"
  | "trial_expired";

export function getPlanLabel(me: AppMeData | null): string {
  if (!me?.subscription) {
    return me?.trial?.balance || me?.trial?.trialEndsAt ? "Free Trial" : "No active plan";
  }
  const variant = me.subscription.variantName?.trim();
  if (variant) return variant;
  const product = me.subscription.productName?.trim();
  if (product) return product;
  return me.subscription.status === "ON_TRIAL" ? "Free Trial" : "No active plan";
}

export function resolveUserState(me: AppMeData | null): UserStateKind {
  if (!me) return "free";

  const sub = me.subscription;

  if (sub?.status === "ON_TRIAL") {
    return me.earlyAccessEligible ? "ea_trial" : "normal_trial";
  }

  if (sub?.status === "ACTIVE") {
    if (sub.subscriptionPlanId === "basic") return "basic";
    if (sub.subscriptionPriceLocked && sub.pricingPhase === "GROWTH") return "ea_pro";
    if (sub.pricingPhase === "TRANSITION") return "loyalty_pro";
    return "normal_pro";
  }

  if (sub?.status === "CANCELED" || sub?.status === "EXPIRED") {
    return "trial_expired";
  }

  if ((me.wallet?.balance ?? 0) > 0) return "wallet_only";

  return "free";
}
