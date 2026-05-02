import type { AppMeData } from "@/lib/api/me";
import type { MediaType } from "./types";

export type ScanUpsellKind = "deep-video-locked" | "low-credits" | "subscription-lite" | "trial";

export type ScanUpsellState = {
  kind: ScanUpsellKind;
  title: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
};

export function getScanUpsellState({
  me,
  activeTab,
  hasResult,
}: {
  me: AppMeData | null;
  activeTab: MediaType;
  hasResult: boolean;
}): ScanUpsellState | null {
  if (!hasResult || !me) return null;

  const isPaidUser = me.trial?.isPaidUser ?? false;
  const trialBalance = me.trial?.balance ?? 0;
  const subscriptionBalance = me.subscription?.subscriptionCreditBalance ?? 0;
  const walletBalance = me.wallet?.balance ?? 0;
  const totalBalance = trialBalance + subscriptionBalance + walletBalance;
  const currentPlanId = me.subscription?.subscriptionPlanId ?? null;
  const subscriptionDeepVideoCount = me.subscription?.subscriptionDeepVideoCount ?? 0;
  const isTrialUser = !isPaidUser;
  const isBasicPlan = currentPlanId === "basic";
  const isVideoResult = activeTab === "video" || activeTab === "video-deep";

  if (activeTab === "video" && !isPaidUser) {
    return {
      kind: "deep-video-locked",
      title: "Want a deeper analysis?",
      description: "Deep Video Scan is available with subscription plans.",
      primaryLabel: "Upgrade to Basic",
      primaryHref: "/subscription",
      secondaryLabel: "Compare plans",
      secondaryHref: "/subscription",
    };
  }

  if (totalBalance < 40) {
    return {
      kind: "low-credits",
      title: "You’re running low on credits",
      description: "Top up now to keep scanning without interruption.",
      primaryLabel: "Get credits",
      primaryHref: "/credits",
      secondaryLabel: "View plans",
      secondaryHref: "/subscription",
    };
  }

  if (isBasicPlan && isVideoResult && (subscriptionDeepVideoCount >= 1 || subscriptionBalance < 240)) {
    return {
      kind: "subscription-lite",
      title: "Need more deep scans each month?",
      description: "Upgrade to Pro for more monthly credits and deeper analysis.",
      primaryLabel: "Upgrade to Pro",
      primaryHref: "/subscription",
      secondaryLabel: "Review plan details",
      secondaryHref: "/subscription",
    };
  }

  if (isTrialUser) {
    return {
      kind: "trial",
      title: "Need more scans?",
      description: "Unlock more with credits or Early Access.",
      primaryLabel: "Buy credits",
      primaryHref: "/credits",
      secondaryLabel: "View plans",
      secondaryHref: "/subscription",
    };
  }

  return null;
}
