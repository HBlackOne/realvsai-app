"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAppMe } from "@/hooks/use-app-me";
import { useCheckout } from "@/hooks/use-checkout";
import { CREDIT_PACKS } from "@/lib/billing/credit-packs";
import { PLANS } from "@/lib/billing/plans";
import { FREE_SCAN_PRICES, SCAN_PRICES } from "@/lib/billing/pricing.constants";
import { resolveUserState } from "@/lib/user-state";
import { AppSectionHeader } from "@/components/app-shell/AppPage";
import { SmartButton } from "@/components/ui/SmartButton";
import { SkeletonText } from "@/components/ui/Skeleton";


type PaymentItem = {
  id: string;
  createdAt: string;
  amount: number;
  currency: string | null;
  credits: number | null;
  status: "COMPLETED" | "FAILED" | string;
};

function fmt(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function SectionLabel({ icon, label }: { icon: string; label: string }) {
  return <AppSectionHeader title={label} icon={icon} />;
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const previousValueRef = useRef(value);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const from = previousValueRef.current;
    const to = value;
    previousValueRef.current = to;
    if (from === to) return;

    const durationMs = 320;
    const startTime = performance.now();

    function tick(now: number) {
      const progress = Math.min((now - startTime) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [value]);

  return <>{display.toLocaleString()}</>;
}

function WalletTopup({ onCheckout, isStarting, error }: { onCheckout: (packId: string) => Promise<void> | void; isStarting: boolean; error: string | null }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const pack = CREDIT_PACKS[selectedIndex] ?? CREDIT_PACKS[0];

  const positionRatio = selectedIndex / (CREDIT_PACKS.length - 1);
  const positionPercent = Math.round(positionRatio * 100);
  const bluePercent = positionPercent * 0.8;
  const greenPercent = positionPercent * 0.2;
  const baseCreditsPerDollar = CREDIT_PACKS[0].walletValueCents / (CREDIT_PACKS[0].priceCents / 100);
  const bonusCredits = selectedIndex === 0 ? 0 : pack.walletValueCents - Math.floor((pack.priceCents / 100) * baseCreditsPerDollar);

  const imageScans = Math.floor(pack.walletValueCents / SCAN_PRICES.image);
  const audioScans = Math.floor(pack.walletValueCents / SCAN_PRICES.audio);
  const shortVideoScans = Math.floor(pack.walletValueCents / SCAN_PRICES.video15);
  const deepVideoScans = Math.floor(pack.walletValueCents / SCAN_PRICES.video60);

  return (
    <div className="overflow-hidden rounded-[20px] border border-border bg-surface">
      <div className="relative overflow-hidden border-b border-border-subtle bg-[linear-gradient(160deg,color-mix(in_srgb,var(--primary)_9%,var(--surface)),color-mix(in_srgb,var(--bg)_72%,var(--surface)))] px-5 pb-4 pt-5 sm:px-6 sm:pb-5 sm:pt-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_76%_32%,color-mix(in_srgb,var(--primary)_8%,transparent)_0%,transparent_54%)]" />
        <div className="relative">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[38px] font-extrabold leading-none tracking-[-0.06em] text-text sm:text-[48px]">
              <AnimatedNumber value={pack.walletValueCents} />
            </span>
            <span className="text-[14px] font-medium text-text-muted">credits</span>
          </div>

          <div className="mt-3 px-2">
            <div className="relative h-2 rounded-full bg-surface3">
              <div
                className="absolute inset-y-0 left-0 rounded-l-full bg-primary/80 transition-[width] duration-300"
                style={{ width: `${bluePercent}%` }}
              />
              {selectedIndex === 0 ? (
                <div className="absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-primary" />
              ) : (
                <div
                  className="absolute inset-y-0 rounded-r-full bg-success transition-[left,width] duration-300"
                  style={{ left: `${bluePercent}%`, width: `${greenPercent}%` }}
                />
              )}
            </div>


            <div className="relative mt-2">
              <div className="flex justify-between">
                {CREDIT_PACKS.map((item) => {
                  const active = item.id === pack.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedIndex(CREDIT_PACKS.findIndex((p) => p.id === item.id))}
                      className={`flex flex-col items-center gap-1 transition ${active ? "opacity-100" : "opacity-40 hover:opacity-70"}`}
                      aria-label={`Select ${item.label} top-up`}
                    >
                      <span className={`h-1.5 w-px ${active ? "bg-primary" : "bg-text-dim"}`} />
                      <span className={`font-mono text-[9.5px] ${active ? "font-bold text-primary" : "text-text-dim"}`}>{fmt(item.priceCents)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {bonusCredits > 0 && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-success/25 bg-success-dim px-2.5 py-1 text-[11px] font-bold text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              +{bonusCredits.toLocaleString()} bonus credits
            </div>
          )}
        </div>
      </div>

      <div className="px-5 py-4 sm:px-6">
        <div className="mb-2.5 flex items-center justify-between gap-4">
          <span className="text-[12px] text-text-muted">Drag to choose pack</span>
          <div className="text-right">
            <div className="font-mono text-[20px] font-extrabold tracking-[-0.04em] text-text">{fmt(pack.priceCents)}</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary">{pack.label}</div>
          </div>
        </div>

        <div className="relative mt-4 h-5 w-full px-2">
          <div className="absolute inset-x-2 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-border" />
          <div
            className="absolute left-2 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `calc((100% - 16px) * ${positionRatio})` }}
          />
          <div
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_8px_var(--primary-glow)]"
            style={{ left: `calc(8px + (100% - 16px) * ${positionRatio})` }}
          />
          <input
            type="range"
            min={0}
            max={CREDIT_PACKS.length - 1}
            step={1}
            value={selectedIndex}
            onChange={(e) => setSelectedIndex(Number(e.target.value))}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label="Wallet top-up pack"
          />
        </div>


        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-[12px] border border-border-subtle bg-surface2 px-2 py-2 text-center">
            <div className="font-mono text-[14px] font-bold text-primary">≈{imageScans}</div>
            <div className="mt-1 text-[10px] leading-tight text-text-dim">Image</div>
          </div>
          <div className="rounded-[12px] border border-border-subtle bg-surface2 px-2 py-2 text-center">
            <div className="font-mono text-[14px] font-bold text-warning">≈{audioScans}</div>
            <div className="mt-1 text-[10px] leading-tight text-text-dim">Audio</div>
          </div>
          <div className="rounded-[12px] border border-border-subtle bg-surface2 px-2 py-2 text-center">
            <div className="font-mono text-[14px] font-bold text-danger">≈{shortVideoScans}</div>
            <div className="mt-1 text-[10px] leading-tight text-text-dim">Short video</div>
          </div>
          <div className="rounded-[12px] border border-border-subtle bg-surface2 px-2 py-2 text-center">
            <div className="font-mono text-[14px] font-bold text-danger">≈{deepVideoScans}</div>
            <div className="mt-1 text-[10px] leading-tight text-text-dim">Deep video</div>
          </div>
        </div>

        <SmartButton
          label={`Add ${pack.walletValueCents.toLocaleString()} credits — ${fmt(pack.priceCents)}`}
          loadingLabel="Preparing checkout..."
          successLabel="Payment successful"
          errorLabel="Something went wrong · Tap to retry"
          successEventName="ls:checkout:success"
          resetEventName="ls:checkout:closed"
          error={error}
          loading={isStarting}
          onClick={() => onCheckout(pack.id)}
          className="mt-3 w-full rounded-[13px] px-4 py-2.5 text-[13px] font-bold shadow-[0_0_28px_var(--primary-glow)] hover:bg-primary-hover disabled:opacity-70"
        />
        <p className="mt-2 text-center text-[11px] text-text-dim">One-time · no expiry · no subscription</p>
      </div>
    </div>
  );
}

function SubscriptionPlans({ activePlanId, hasActiveSubscription, subscriptionBalance, monthlyCredits, renewsAt, showEADiscount, loadingMe }: {
  activePlanId: string | null;
  hasActiveSubscription: boolean;
  subscriptionBalance: number;
  monthlyCredits: number;
  renewsAt: string | null;
  showEADiscount: boolean;
  loadingMe: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const activePlan = activePlanId === "basic" ? PLANS.basic : activePlanId === "pro" ? PLANS.pro_ea : null;
  const renewsText = renewsAt ? new Date(renewsAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : null;

  if (hasActiveSubscription) {
    const pct = monthlyCredits > 0 ? subscriptionBalance / monthlyCredits : 0;
    const radius = 26;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - pct);

    return (
      <div className="rounded-[18px] border border-border bg-surface p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-[64px] w-[64px] shrink-0">
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r={radius} fill="none" stroke="var(--surface3)" strokeWidth="5" />
                <circle
                  cx="32" cy="32" r={radius} fill="none"
                  stroke="var(--primary)" strokeWidth="5"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-mono text-[10.5px] font-bold text-primary">{Math.round(pct * 100)}%</span>
              </div>
            </div>
            <div>
              <div className="text-[13px] font-bold text-text">Current subscription</div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-primary/25 bg-primary-dim px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-primary">
                  {activePlan?.name ?? "Active plan"}
                </span>
                {renewsText ? <span className="text-[11px] text-text-muted">Renews {renewsText}</span> : null}
              </div>
              <p className="mt-2 text-[12px] leading-5 text-text-muted">
                {loadingMe ? (
                  <SkeletonText className="h-5 w-36" />
                ) : (
                  <>
                    <span className="font-mono font-semibold text-text">{subscriptionBalance.toLocaleString()}</span> of <span className="font-mono">{monthlyCredits.toLocaleString()}</span> monthly credits available.
                  </>
                )}
              </p>
            </div>
          </div>
          <Link href="/subscription" className="inline-flex items-center justify-center rounded-[12px] border border-border bg-surface2 px-4 py-2.5 text-[12px] font-semibold text-text-muted transition hover:bg-surface-hover hover:text-text">
            Compare plans
          </Link>
        </div>
      </div>
    );
  }

  const basicPlan = PLANS.basic;
  const proPlan = PLANS.pro_ea;

  return (
    <div className="overflow-hidden rounded-[18px] border border-border bg-surface">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-surface-hover sm:px-5"
      >
        <div>
          <div className="text-[13px] font-bold text-text">Need lower scan costs?</div>
          <p className="mt-1 max-w-[520px] text-[12px] leading-5 text-text-muted">
            Subscribe for recurring credits and better rates.
          </p>
        </div>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface2 text-text-muted transition duration-300 ${isOpen ? "rotate-180" : ""}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
        </span>
      </button>

      <div className="grid transition-[grid-template-rows] duration-500 ease-out" style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}>
        <div className="min-h-0 overflow-hidden">
          <div className="px-4 pb-4 sm:px-5 sm:pb-5">
            <div className="grid grid-cols-2 gap-3">
              {/* Basic card */}
              <div className="flex flex-col overflow-hidden rounded-[16px] border border-border-subtle bg-surface2 p-3.5 sm:p-4">
                <div className="min-w-0">
                  <h3 className="text-[15px] font-extrabold tracking-[-0.03em] text-text">{basicPlan.name}</h3>
                </div>
                <div className="mt-3 rounded-[12px] border border-border-subtle bg-surface px-3 py-2.5">
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-dim">Monthly</div>
                      <div className="mt-1 font-mono text-[20px] font-extrabold tracking-[-0.05em] text-text">{fmt(basicPlan.priceCents)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-dim">Included</div>
                      <div className="mt-1 font-mono text-[15px] font-bold text-primary">{basicPlan.monthlyCredits.toLocaleString()} cr</div>
                    </div>
                  </div>
                </div>
                <div className="relative mt-3 flex flex-1 flex-col gap-1.5">
                  {[
                    `${basicPlan.imageCost} cr / image`,
                    `${basicPlan.audioCost} cr / audio`,
                    `${basicPlan.videoShortCost} cr / short video`,
                  ].map((point) => (
                    <div key={point} className="flex items-center gap-2 text-[11px] text-text-muted">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pro EA card */}
              <div className="relative flex flex-col overflow-hidden rounded-[16px] border border-warning/25 bg-surface2 p-3.5 sm:p-4">
                <div className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-warning/10 blur-2xl" />
                <div className="relative flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-extrabold tracking-[-0.03em] text-text">{proPlan.name}</h3>
                  </div>
                  <div className="shrink-0 rounded-full border border-warning/25 bg-warning-dim px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-warning">
                    Early Access
                  </div>
                </div>
                <div className="relative mt-3 rounded-[12px] border border-border-subtle bg-surface px-3 py-2.5">
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-dim">Monthly</div>
                      {showEADiscount ? (
                        <div className="mt-1 flex flex-col">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-mono text-[20px] font-extrabold tracking-[-0.05em] text-text">{fmt(proPlan.priceCents)}</span>
                            <span className="font-mono text-[12px] text-text-dim line-through">{fmt(proPlan.normalPriceCents)}</span>
                            <span className="text-[11px] text-text-dim">/mo</span>
                          </div>
                          <span className="mt-0.5 text-[10px] font-semibold text-warning">Early Access discount active</span>
                        </div>
                      ) : (
                        <div className="mt-1 font-mono text-[20px] font-extrabold tracking-[-0.05em] text-text">{fmt(PLANS.pro_normal.priceCents)}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-dim">Included</div>
                      <div className="mt-1 font-mono text-[15px] font-bold text-warning">{proPlan.monthlyCredits.toLocaleString()} cr</div>
                    </div>
                  </div>
                </div>
                <div className="relative mt-3 flex flex-1 flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-[11px] text-text-muted">
                    <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                    <span>Everything in Basic</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-text-muted">
                    <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                    <span>Deep video: {proPlan.deepVideoCost} cr / {proPlan.deepVideoMonthly} per month</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-text-muted">
                    <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                    <span>Premium features unlocked</span>
                  </div>
                </div>
              </div>
            </div>

            <Link href="/subscription" className="mt-3 inline-flex w-full items-center justify-center rounded-[12px] border border-border bg-surface2 px-4 py-2.5 text-[12px] font-semibold text-text-muted transition hover:bg-surface-hover hover:text-text">
              Compare all plans →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentHistory({ history, loading = false }: { history: PaymentItem[]; loading?: boolean }) {
  const [visibleCount, setVisibleCount] = useState(5);
  const visibleHistory = history.slice(0, visibleCount);
  const hasMore = visibleCount < history.length;

  return (
    <div className="rounded-[18px] border border-border bg-surface p-5">
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl bg-bg px-4 py-4">
              <span className="balance-shimmer block h-4 w-28 rounded-full" />
              <span className="balance-shimmer mt-2.5 block h-3 w-44 rounded-full" />
            </div>
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="py-8 text-center text-[13px] text-text-dim">No payment history yet.</div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {visibleHistory.map((h) => {
              const dateText = new Intl.DateTimeFormat("en-GB", {
                year: "numeric", month: "short", day: "2-digit",
                hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC",
              }).format(new Date(h.createdAt));
              const amountText = new Intl.NumberFormat("en-US", { style: "currency", currency: h.currency || "USD" }).format(h.amount / 100);
              const creditsText = h.credits ? `+${h.credits.toLocaleString()} credits` : "Credits added";
              const success = h.status === "COMPLETED";
              const fail = h.status === "FAILED";
              const label = success ? "Success" : fail ? "Failure" : h.status;

              return (
                <div key={h.id} className="flex items-center justify-between gap-4 rounded-[12px] bg-surface2 px-4 py-3">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-[13px] font-semibold text-text">{creditsText}</span>
                    <span className="text-[11px] text-text-dim">{dateText}</span>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-[13px] font-semibold text-text">{amountText}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${success ? "bg-success/15 text-success" : fail ? "bg-danger/15 text-danger" : "bg-surface3 text-text-muted"}`}>
                      {label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-3">
              <button
                type="button"
                onClick={() => setVisibleCount((count) => Math.min(count + 5, history.length))}
                className="inline-flex items-center gap-[7px] rounded-[10px] border border-border bg-surface2 px-5 py-2 text-[12.5px] font-medium text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 9l-7 7-7-7" />
                </svg>
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function CreditsPage() {
  const { me, loading: meLoading } = useAppMe();
  const { openCheckout, loading, error } = useCheckout();

  const trialBal = me?.trial?.balance ?? 0;
  const trialEndsAt = me?.trial?.trialEndsAt ?? me?.subscription?.trialEndsAt ?? null;
  const trialStatus = me?.subscription?.status ?? "INACTIVE";
  const subPlanId = me?.subscription?.subscriptionPlanId ?? null;
  const subStatus = me?.subscription?.status ?? "INACTIVE";
  const subscriptionBalance = me?.subscription?.subscriptionCreditBalance ?? 0;
  const subscriptionMonthlyCredits = me?.subscription?.subscriptionMonthlyCredits ?? 0;
  const subscriptionRenewsAt = me?.subscription?.renewsAt ?? me?.subscription?.currentPeriodEnd ?? me?.subscription?.trialEndsAt ?? null;
  const formattedRenewal = subscriptionRenewsAt
    ? new Date(subscriptionRenewsAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    : null;
  const walletBal = me?.wallet?.balance ?? 0;
  const paymentHistory = (me?.paymentHistory ?? []) as PaymentItem[];
  const hasActiveSubscription = subStatus === "ACTIVE" || subStatus === "ON_TRIAL";
  const totalBalance = trialBal + subscriptionBalance + walletBal;
  const trialActive = trialStatus === "ON_TRIAL" || Boolean(trialEndsAt);
  const userState = resolveUserState(me);
  const showEADiscount = (me?.earlyAccessEligible ?? false) || (me?.subscription?.subscriptionPriceLocked ?? false);

  const isSubscriber = hasActiveSubscription || trialActive;
  const imageRate = userState === "free" || userState === "wallet_only" ? FREE_SCAN_PRICES.image : SCAN_PRICES.image;

  function handleCheckout(packId: string) {
    return openCheckout(async () => {
      const res = await fetch("/api/billing/checkout/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      const payload = await res.json();
      if (!res.ok || !payload?.success || !payload?.data?.checkoutUrl) {
        throw new Error(payload?.error || "Unable to start checkout.");
      }
      return payload.data.checkoutUrl;
    });
  }

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-8 px-4 pb-16 pt-5 md:px-6 md:pt-6 lg:px-8">
      <div>
        <h1 className="text-[20px] font-bold tracking-[-0.025em] text-text">Credits & Billing</h1>
        <p className="mt-1 text-[13px] text-text-muted">Review credits, top up your wallet, and subscribe when you need more.</p>
      </div>

      {/* Credit summary */}
      <div>
        <SectionLabel icon="M17 9V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2m2 4h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2" label="Credit summary" />
        <div className="rounded-[18px] border border-border bg-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-dim">Credit summary</div>
          </div>
          {!me || isSubscriber ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[12px] font-semibold text-text">Monthly credits</p>
                  {formattedRenewal ? (
                    <p className="mt-0.5 text-[10px] text-text-dim">Resets {formattedRenewal}</p>
                  ) : null}
                </div>
                <p className="text-[16px] font-bold text-text">
                  {!me ? <SkeletonText className="h-5 w-16" /> : <span>{subscriptionBalance.toLocaleString()} cr</span>}
                </p>
              </div>

              <div className="h-px bg-border" />

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[12px] font-semibold text-text">Wallet credits</p>
                  <p className="mt-0.5 text-[10px] text-text-dim">No expiry</p>
                </div>
                <p className="text-[16px] font-bold text-text">
                  {!me ? <SkeletonText className="h-5 w-16" /> : <span>{walletBal.toLocaleString()} cr</span>}
                </p>
              </div>

              <div className="h-px bg-border" />

              <p className="text-[11px] text-text-dim">
                {subPlanId === "basic" ? "Basic" : "Pro"} plan active · Image scans cost {SCAN_PRICES.image} cr
              </p>
            </div>
          ) : (
            <div>
              <p className="text-[28px] font-bold text-text">
                {walletBal.toLocaleString()}
                <span className="text-[16px] font-normal"> credits</span>
              </p>
              <p className="mt-1 text-[12px] text-text-dim">
                Image scans cost {FREE_SCAN_PRICES.image} cr ·{" "}
                <Link href="/subscription" className="text-primary hover:underline">
                  Subscribe for lower rates →
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Wallet topup */}
      <div>
        <SectionLabel icon="M13 2L3 14h9l-1 8 10-12h-9l1-8z" label="Wallet topup" />
        <WalletTopup onCheckout={handleCheckout} isStarting={loading} error={error} />
      </div>

      {/* Pay history */}
      <div>
        <SectionLabel icon="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" label="Pay history" />
        <PaymentHistory history={paymentHistory} loading={meLoading && !me} />
      </div>

    </div>
  );
}