import type { UserStateKind } from "@/lib/user-state";

export type GrowthContext =
  | "after_scan"
  | "low_credits"
  | "trial_day_5"
  | "trial_day_7"
  | "deep_video_blocked"
  | "daily_limit_reached"
  | "monthly_limit_reached"
  | "first_login"
  | "idle_30days";

type GrowthMessage = {
  title: string;
  body: string;
  cta: string;
  ctaHref: string;
};

const PLAN_HREF = "/subscription";
const CREDITS_HREF = "/credits";
const SCAN_HREF = "/scan";
const WELCOME_HREF = "/welcome";

export function getGrowthMessage(
  context: GrowthContext,
  userState: UserStateKind,
  extras?: {
    creditsLeft?: number;
    trialDaysLeft?: number;
    totalCredits?: number;
  },
): GrowthMessage | null {
  const { creditsLeft = 0, trialDaysLeft = 0, totalCredits = 0 } = extras ?? {};

  switch (context) {
    case "after_scan":
      if (userState === "ea_trial") {
        return {
          title: "Your trial is active",
          body: `${creditsLeft} credits left. Upgrade to EA Pro to keep scanning at $9.99/mo.`,
          cta: "Activate EA Pro",
          ctaHref: PLAN_HREF,
        };
      }
      if (userState === "free") {
        return {
          title: "Start your free 7-day trial.",
          body: "500 credits included, cancel anytime.",
          cta: "Start Free Trial",
          ctaHref: WELCOME_HREF,
        };
      }
      return null;

    case "low_credits":
      if (userState === "wallet_only") {
        return {
          title: "Running low",
          body: `${creditsLeft} credits left. Top up now to keep scanning.`,
          cta: "Buy Credits",
          ctaHref: CREDITS_HREF,
        };
      }
      if (userState === "basic") {
        return {
          title: `Only ${creditsLeft} credits left this month.`,
          body: "Upgrade to Pro for 700 credits/month.",
          cta: "Upgrade to Pro",
          ctaHref: PLAN_HREF,
        };
      }
      return null;

    case "deep_video_blocked":
      if (userState === "basic") {
        return {
          title: "Deep video requires Pro.",
          body: "Upgrade to unlock deep analysis.",
          cta: "Upgrade to Pro",
          ctaHref: PLAN_HREF,
        };
      }
      if (userState === "free") {
        return {
          title: "Deep video requires a Pro plan.",
          body: "Start your free trial to try it.",
          cta: "Start Free Trial",
          ctaHref: WELCOME_HREF,
        };
      }
      return null;

    case "daily_limit_reached":
      if (userState === "ea_trial") {
        return {
          title: "You've used your 5 trial scans today.",
          body: "Upgrade to get 20 scans/day.",
          cta: "Upgrade Now",
          ctaHref: PLAN_HREF,
        };
      }
      return null;

    case "trial_day_5":
      if (trialDaysLeft <= 2) {
        return {
          title: `${trialDaysLeft} days left on your trial.`,
          body: `You've used ${totalCredits > 0 ? totalCredits : "some"} of 500 credits. Keep scanning?`,
          cta: "Activate Plan",
          ctaHref: PLAN_HREF,
        };
      }
      return null;

    case "trial_day_7":
      return {
        title: "Your trial ends tonight.",
        body: "Don't lose your scanning access.",
        cta: "Activate Plan Now",
        ctaHref: PLAN_HREF,
      };

    default:
      return null;
  }
}
