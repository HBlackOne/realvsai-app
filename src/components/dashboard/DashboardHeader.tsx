"use client";

import { useAppMe } from "@/hooks/use-app-me";
import { resolveUserState, type UserStateKind } from "@/lib/user-state";
import { SkeletonText } from "@/components/ui/Skeleton";

interface DashboardHeaderProps {
  onHamburger?: () => void;
  onUpgrade?: () => void;
}

function getPlanLabel(userState: UserStateKind, trialDaysLeft?: number): string {
  switch (userState) {
    case "ea_trial":
      return `Free Trial · EA${trialDaysLeft !== undefined ? ` · ${trialDaysLeft}d left` : ""}`;
    case "normal_trial":
      return `Free Trial${trialDaysLeft !== undefined ? ` · ${trialDaysLeft}d left` : ""}`;
    case "ea_pro":
      return "EA Pro · $9.99";
    case "loyalty_pro":
      return "Loyalty Pro · $12.99";
    case "normal_pro":
      return "Pro";
    case "basic":
      return "Basic";
    case "wallet_only":
      return "Pay as you go";
    case "trial_expired":
      return "Trial ended";
    case "free":
    default:
      return "No active plan";
  }
}

function getCreditColor(credits: number): string {
  if (credits > 200) return "text-text";
  if (credits >= 50) return "text-warning";
  return "text-danger animate-pulse";
}

export function DashboardHeader({ onHamburger, onUpgrade }: DashboardHeaderProps) {
  const { me, loading } = useAppMe();

  const userState = resolveUserState(me);
  const spendableCredits =
    (me?.trial?.balance ?? 0) +
    (me?.subscription?.subscriptionCreditBalance ?? 0) +
    (me?.wallet?.balance ?? 0);

  const trialDaysLeft = me?.trial?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(me.trial.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : undefined;

  const planLabel = getPlanLabel(userState, trialDaysLeft);
  const creditColor = getCreditColor(spendableCredits);

  return (
    <header className="fixed top-0 left-0 right-0 z-30 flex h-16 flex-shrink-0 items-center justify-between border-b border-border bg-surface px-4 md:px-8 lg:left-[220px]">
      <div className="flex items-center gap-3">
        <button
          onClick={onHamburger}
          className="hidden p-2 text-text-dim transition-colors hover:text-text lg:inline-flex"
          aria-label="Open navigation"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex flex-col leading-none">
          <span className="text-[17px] font-bold tracking-tight text-text">RealvsAI</span>
          <span className="mt-1 text-[11px] font-medium text-text-dim">AI Authenticity scanner</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onUpgrade}
          className="cursor-pointer rounded-full border-none bg-primary px-4 py-2 text-[14px] font-bold text-bg shadow-[0_0_16px_rgba(138,180,248,0.25)] transition-colors hover:bg-primary-hover"
        >
          Upgrade
        </button>

        <div className="flex items-center gap-2 rounded-full border border-border bg-surface2 px-3.5 py-1.5">
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="var(--color-warning)"
            stroke="none"
          >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          {loading ? (
            <SkeletonText className="w-12" />
          ) : (
            <span className={`text-[14px] font-bold ${creditColor}`}>{spendableCredits}</span>
          )}
          <span className="hidden text-[13px] text-text-dim sm:inline">credits</span>
        </div>
      </div>
    </header>
  );
}
