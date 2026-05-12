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

export function getSubscriptionState(me: AppMeData | null) {
  const status = me?.subscription?.status ?? null;
  const now = Date.now();

  const renewsAt = me?.subscription?.renewsAt ? new Date(me.subscription.renewsAt) : null;
  const endsAt = me?.subscription?.endsAt ? new Date(me.subscription.endsAt) : null;
  const trialEndsAt = me?.subscription?.trialEndsAt ? new Date(me.subscription.trialEndsAt) : null;

  const daysUntilRenewal = renewsAt ? Math.ceil((renewsAt.getTime() - now) / 86400000) : null;
  const daysUntilTrialEnd = trialEndsAt ? Math.ceil((trialEndsAt.getTime() - now) / 86400000) : null;
  const daysUntilEnd = endsAt ? Math.ceil((endsAt.getTime() - now) / 86400000) : null;
  const isCancelledStatus = status === "CANCELLED" || status === "CANCELED";

  return {
    status,
    isActive: status === "ACTIVE",
    isTrial: status === "ON_TRIAL",
    isCancelled: isCancelledStatus,
    isExpired: status === "EXPIRED",
    isPastDue: status === "PAST_DUE",
    isPro: status === "ACTIVE" || status === "ON_TRIAL" || isCancelledStatus,
    isFree: !status || status === "EXPIRED",
    renewsAt,
    endsAt,
    trialEndsAt,
    daysUntilRenewal,
    daysUntilTrialEnd,
    daysUntilEnd,
    renewalSoon: daysUntilRenewal !== null && daysUntilRenewal <= 7 && status === "ACTIVE",
    trialEndingSoon: daysUntilTrialEnd !== null && daysUntilTrialEnd <= 3 && status === "ON_TRIAL",
    cancelledSoon: daysUntilEnd !== null && daysUntilEnd <= 7 && isCancelledStatus,
  };
}

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
