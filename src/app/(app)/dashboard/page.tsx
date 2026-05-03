"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { UsageOverview } from "@/components/dashboard/UsageOverview";
import { Last7DaysCard } from "@/components/dashboard/Last7DaysCard";
import { QuickScan } from "@/components/dashboard/QuickScan";
import { RecentScans, type Scan } from "@/components/dashboard/RecentScans";
import { AppSectionHeader } from "@/components/app-shell/AppPage";
import { GrowthNudge } from "@/components/dashboard/GrowthNudge";
import { SkeletonText } from "@/components/ui/Skeleton";
import { useAppMe } from "@/hooks/use-app-me";
import { useDashboardScans } from "@/hooks/use-dashboard-scans";
import { resolveUserState, getPlanLabel } from "@/lib/user-state";
import { getGrowthMessage } from "@/lib/growth-messages";

function buildChartData(createdAtValues: string[]) {
  const labels = ["S", "M", "T", "W", "T", "F", "S"];
  const today = new Date();
  const dates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - (6 - index));
    return date;
  });

  const counts = new Map(dates.map((date) => [date.toDateString(), 0]));
  for (const value of createdAtValues) {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    const key = date.toDateString();
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return dates.map((date, index) => ({ day: labels[date.getDay()] ?? labels[index] ?? "-", v: counts.get(date.toDateString()) ?? 0 }));
}

function mapScanType(mediaType: string): Scan["type"] {
  if (mediaType === "AUDIO") return "Audio";
  if (mediaType === "VIDEO") return "Video";
  return "Image";
}

function mapScanStatus(status: string, verdict: string | null): Scan["status"] {
  if (status !== "COMPLETED") return "Processing";
  if (verdict === "AI Generated") return "AI";
  return "Real";
}

function SectionTitle({ children, icon, action }: { children: React.ReactNode; icon: string; action?: React.ReactNode }) {
  return <AppSectionHeader title={children} icon={icon} action={action} />;
}

function buildQuickScanFooter(me: ReturnType<typeof useAppMe>["me"], spendableCredits: number) {
  const trialActive = Boolean(me?.subscription?.status === "ON_TRIAL" || me?.trial?.trialEndsAt);
  const hasSubscription = Boolean(me?.subscription && me.subscription.status !== "ON_TRIAL");

  if (spendableCredits > 0) {
    if (trialActive) {
      return {
        text: "Free trial active",
        primaryHref: "/credits",
        primaryLabel: "Open billing",
      };
    }

    if (hasSubscription) {
      return {
        text: "Subscription active",
        primaryHref: "/subscription",
        primaryLabel: "Manage subscription",
        secondaryHref: "/credits",
        secondaryLabel: "Open billing",
      };
    }

    return null;
  }

  if (trialActive) {
    return {
      text: "Trial active, but no credits available",
      primaryHref: "/credits",
      primaryLabel: "Open billing",
      secondaryHref: "/subscription",
      secondaryLabel: "View plans",
    };
  }

  if (hasSubscription) {
    return {
      text: "Subscription active, but no credits available",
      primaryHref: "/credits",
      primaryLabel: "Add credits",
      secondaryHref: "/subscription",
      secondaryLabel: "Manage subscription",
    };
  }

  return {
    text: "No credits available right now",
    primaryHref: "/credits",
    primaryLabel: "Open billing",
    secondaryHref: "/subscription",
    secondaryLabel: "View plans",
  };
}

function DashboardPlaceholderCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section className="rounded-[18px] border border-border/70 bg-surface p-4">
      <div className="flex min-h-[148px] flex-col items-center justify-center gap-2.5 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-[11px] border border-border bg-surface2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-dim)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7h16M4 12h10M4 17h13" />
          </svg>
        </div>
        <p className="text-[14px] font-semibold text-text-muted">{title}</p>
        <p className="max-w-[260px] text-[13px] text-text-dim">{subtitle}</p>
      </div>
    </section>
  );
}

function buildUsageState(me: ReturnType<typeof useAppMe>["me"], spendableCredits: number) {
  const subscription = me?.subscription;
  const trialActive = Boolean(subscription?.status === "ON_TRIAL" || me?.trial?.trialEndsAt);
  const hasActiveSubscription = Boolean(subscription && subscription.status !== "ON_TRIAL");

  if (hasActiveSubscription && subscription) {
    const monthly = subscription.subscriptionMonthlyCredits;
    const remaining = subscription.subscriptionCreditBalance;
    if (monthly > 0) {
      const used = Math.max(monthly - remaining, 0);
      return {
        usageText: `${used} of ${monthly} monthly credits used`,
        progressPercent: (used / monthly) * 100,
      };
    }

    return {
      usageText: "Subscription is active",
      progressPercent: null,
    };
  }

  if (trialActive) {
    return {
      usageText: "Trial access is active",
      progressPercent: null,
    };
  }

  if (spendableCredits > 0) {
    return {
      usageText: "Credits available to scan",
      progressPercent: null,
    };
  }

  return {
    usageText: "No active usage limit available",
    progressPercent: null,
  };
}

export default function DashboardPage() {
  const { user } = useUser();
  const { me } = useAppMe();
  const { recentScans, usage } = useDashboardScans();

  const userState = resolveUserState(me);
  const spendableCredits =
    (me?.trial?.balance ?? 0) +
    (me?.subscription?.subscriptionCreditBalance ?? 0) +
    (me?.wallet?.balance ?? 0);
  const growthNudge = getGrowthMessage("low_credits", userState, {
    creditsLeft: spendableCredits,
  });

  const firstName = me?.firstName || user?.firstName || "there";
  const planLabel = getPlanLabel(me);

  const uiScans = useMemo<Scan[]>(() => {
    return recentScans.slice(0, 5).map((scan) => ({
      id: scan.id,
      name: scan.sourceLabel,
      type: mapScanType(scan.mediaType),
      date: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(scan.createdAt)),
      status: mapScanStatus(scan.status, scan.verdict),
      confidence: scan.confidence,
    }));
  }, [recentScans]);

  const aiDetected = useMemo(() => recentScans.filter((scan) => scan.verdict === "AI Generated").length, [recentScans]);
  const realMedia = useMemo(() => recentScans.filter((scan) => scan.verdict === "Authentic").length, [recentScans]);
  const chartData = useMemo(() => buildChartData(recentScans.map((scan) => scan.createdAt)), [recentScans]);
  const quickScanFooter = useMemo(() => buildQuickScanFooter(me, spendableCredits), [me, spendableCredits]);
  const usageState = useMemo(() => buildUsageState(me, spendableCredits), [me, spendableCredits]);

  const isPaidSubscriber = userState === "ea_pro" || userState === "loyalty_pro" || userState === "normal_pro" || userState === "basic";
  const showGrowthNudge = growthNudge && !isPaidSubscriber;

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-16 pt-5 md:px-6 md:pt-6 lg:px-8">
      {showGrowthNudge ? (
        <div className="mb-4">
          <GrowthNudge message={growthNudge} />
        </div>
      ) : null}

      <div className="mb-4 lg:hidden">
        <h1 className="text-xl font-semibold text-text">Welcome back, {firstName}</h1>
        {!me ? (
          <SkeletonText className="mt-1 w-32" />
        ) : (
          <p className="mt-1 text-sm text-text-dim">
            ⚡ {spendableCredits} credits • {planLabel}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-8 lg:hidden">
        <div>
          <SectionTitle icon="M12 20V10M18 20V4M6 20v-4">Usage Overview</SectionTitle>
          <UsageOverview
            credits={spendableCredits}
            scansUsed={usage.completedScans}
            aiDetected={aiDetected}
            realMedia={realMedia}
            planLabel={planLabel}
            usageText={usageState.usageText}
            progressPercent={usageState.progressPercent}
          />
        </div>

        <div>
          <SectionTitle
            icon="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0"
            action={
              uiScans.length > 0 ? (
                <Link href="/history" className="text-[12.5px] text-primary transition-colors hover:text-primary-hover">
                  View all →
                </Link>
              ) : undefined
            }
          >
            Recent Scans
          </SectionTitle>
          <div className="h-[280px]">
            <RecentScans scans={uiScans} />
          </div>
        </div>

        <div>
          <SectionTitle icon="M3 3v18h18M7 14l3-3 3 2 4-5">Last 7 days</SectionTitle>
          <Last7DaysCard chartData={chartData} />
        </div>

        <div>
          <SectionTitle icon="M4 7h16M4 12h10M4 17h13">Last checked profiles/pages/channels</SectionTitle>
          <DashboardPlaceholderCard title="No checks yet" subtitle="Recent checked profiles, pages, and channels will appear here." />
        </div>

        <div>
          <SectionTitle icon="M13 2L3 14h9l-1 8 10-12h-9l1-8z">Quick Scan</SectionTitle>
          <QuickScan credits={spendableCredits} footer={quickScanFooter} />
        </div>
      </div>

      <div className="mb-4 hidden lg:block">
        {!me ? (
          <SkeletonText className="w-32" />
        ) : (
          <p className="text-sm text-text-dim">
            ⚡ {spendableCredits} credits • {planLabel}
          </p>
        )}
      </div>

      <div className="hidden gap-8 lg:grid lg:grid-cols-[minmax(0,1.2fr)_320px]">
        <div className="flex flex-col gap-8">
          <div>
            <SectionTitle
              icon="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0"
              action={
                uiScans.length > 0 ? (
                  <Link href="/history" className="text-[12.5px] text-primary transition-colors hover:text-primary-hover">
                    View all →
                  </Link>
                ) : undefined
              }
            >
              Recent Scans
            </SectionTitle>
            <div className="h-[420px]">
              <RecentScans scans={uiScans} />
            </div>
          </div>

          <div>
            <SectionTitle icon="M13 2L3 14h9l-1 8 10-12h-9l1-8z">Quick Scan</SectionTitle>
            <QuickScan credits={spendableCredits} footer={quickScanFooter} />
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div>
            <SectionTitle icon="M12 20V10M18 20V4M6 20v-4">Usage Overview</SectionTitle>
            <UsageOverview
              credits={spendableCredits}
              scansUsed={usage.completedScans}
              aiDetected={aiDetected}
              realMedia={realMedia}
              planLabel={planLabel}
              usageText={usageState.usageText}
              progressPercent={usageState.progressPercent}
            />
          </div>

          <div>
            <SectionTitle icon="M3 3v18h18M7 14l3-3 3 2 4-5">Last 7 days</SectionTitle>
            <Last7DaysCard chartData={chartData} />
          </div>

          <div>
            <SectionTitle icon="M4 7h16M4 12h10M4 17h13">Last checked profiles/pages/channels</SectionTitle>
            <DashboardPlaceholderCard title="No checks yet" subtitle="Recent checked profiles, pages, and channels will appear here." />
          </div>
        </div>
      </div>
    </div>
  );
}
