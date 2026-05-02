"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAppMe } from "@/hooks/use-app-me";
import CheckoutConfirmModal from "@/components/billing/CheckoutConfirmModal";
import ArcMeter from "@/components/billing/ArcMeter";
import { CREDIT_PACKS } from "@/components/pricing/pricing-data";
import { EARLY_ACCESS_PLANS, SCAN_PRICES, WALLET_TOPUP_LIST } from "@/lib/billing/pricing.constants";
import { TRIAL_INTERNAL_VALUE_CENTS } from "@/lib/billing/trial.constants";
import { AppSectionHeader } from "@/components/app-shell/AppPage";

type PlanKey = "basic" | "pro";

type PaymentItem = {
  id: string;
  createdAt: string;
  amount: number;
  currency: string | null;
  status: "COMPLETED" | "FAILED" | string;
};

function fmt(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function SectionLabel({ icon, label }: { icon: string; label: string }) {
  return <AppSectionHeader title={label} icon={icon} />;
}

function CreditSummaryCard({
  walletBal,
  imageCost,
  audioCost,
  videoCost,
  subPlanName,
  hasActiveSubscription,
}: {
  walletBal: number;
  imageCost: number;
  audioCost: number;
  videoCost: number;
  subPlanName: string | null;
  hasActiveSubscription: boolean;
}) {
  const imageScans = Math.floor(walletBal / imageCost);
  const audioScans = Math.floor(walletBal / audioCost);
  const videoScans = Math.floor(walletBal / videoCost);

  return (
    <div className="rounded-[18px] border border-border bg-surface p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-dim">Credit</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-[34px] font-extrabold tracking-[-0.05em] text-text">{walletBal.toLocaleString()}</span>
            <span className="text-[13px] text-text-muted">credits</span>
          </div>
          <div className="mt-2 text-[12px] text-text-muted">
            {hasActiveSubscription
              ? `Your current image scan costs ${imageCost} cr on ${subPlanName ?? "your plan"}.`
              : `You are not subscribed, your current scan will cost you ${imageCost} cr.`}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 lg:min-w-[360px]">
          {[
            { label: "Image scans", value: `≈${imageScans}` },
            { label: "Audio scans", value: `≈${audioScans}` },
            { label: "Video scans", value: `≈${videoScans}` },
          ].map((item) => (
            <div key={item.label} className="rounded-[12px] border border-border-subtle bg-surface2 px-3 py-3">
              <div className="text-[10px] uppercase tracking-[0.1em] text-text-dim">{item.label}</div>
              <div className="mt-1.5 font-mono text-[18px] font-bold tracking-[-0.03em] text-text">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
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

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [value]);

  return <>{display.toLocaleString()}</>;
}

function WalletTopup({ onCheckout, isStarting, error }: { onCheckout: (packId: string) => void; isStarting: boolean; error: string | null }) {
  const defaultIndex = Math.max(0, WALLET_TOPUP_LIST.findIndex((pack) => pack.id === "standard"));
  const [selectedIndex, setSelectedIndex] = useState(defaultIndex);
  const pack = WALLET_TOPUP_LIST[selectedIndex] ?? WALLET_TOPUP_LIST[0];
  const fillPct = WALLET_TOPUP_LIST.length > 1 ? (selectedIndex / (WALLET_TOPUP_LIST.length - 1)) * 100 : 100;
  const baseCredits = Math.max(0, pack.walletValueCents - pack.bonusCents);
  const bonusPct = pack.walletValueCents > 0 ? Math.round((pack.bonusCents / pack.walletValueCents) * 100) : 0;
  const imageScans = Math.floor(pack.walletValueCents / SCAN_PRICES.image);
  const audioScans = Math.floor(pack.walletValueCents / SCAN_PRICES.audio);
  const videoScans = Math.floor(pack.walletValueCents / SCAN_PRICES.video15);

  return (
    <div
      className="overflow-hidden rounded-[20px] border border-border bg-surface"
      style={{
        ["--topup-fill" as string]: `${fillPct}%`,
        ["--topup-primary" as string]: "var(--primary)",
        ["--topup-success" as string]: "var(--success)",
      }}
    >
      <div className="relative overflow-hidden border-b border-border-subtle bg-[linear-gradient(160deg,color-mix(in_srgb,var(--primary)_9%,var(--surface)),color-mix(in_srgb,var(--bg)_72%,var(--surface)))] px-5 pb-4 pt-5 sm:px-6 sm:pb-5 sm:pt-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_76%_32%,color-mix(in_srgb,var(--primary)_8%,transparent)_0%,transparent_54%)]" />
        <div className="relative">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[38px] font-extrabold leading-none tracking-[-0.06em] text-text sm:text-[48px]">
              <AnimatedNumber value={pack.walletValueCents} />
            </span>
            <span className="text-[14px] font-medium text-text-muted">credits</span>
          </div>

          <div className="mt-3">
            <div className="relative h-2 overflow-hidden rounded-full bg-surface3">
              <div
                className="absolute inset-y-0 left-0 rounded-l-full bg-primary/80 transition-[width] duration-300"
                style={{ width: `${(baseCredits / pack.walletValueCents) * fillPct}%` }}
              />
              <div
                className="absolute inset-y-0 rounded-r-full bg-success transition-[left,width] duration-300"
                style={{
                  left: `${(baseCredits / pack.walletValueCents) * fillPct}%`,
                  width: `${(pack.bonusCents / pack.walletValueCents) * fillPct}%`,
                }}
              />
            </div>

            <div className="mt-2 flex justify-between">
              {WALLET_TOPUP_LIST.map((item, index) => {
                const active = item.id === pack.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedIndex(index)}
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

          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-success/25 bg-success-dim px-2.5 py-1 text-[11px] font-bold text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            +{pack.bonusCents.toLocaleString()} bonus credits ({bonusPct}% free)
          </div>
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

        <input
          type="range"
          min={0}
          max={WALLET_TOPUP_LIST.length - 1}
          step={1}
          value={selectedIndex}
          onChange={(event) => setSelectedIndex(Number(event.target.value))}
          className="h-1 w-full cursor-pointer appearance-none rounded-full bg-[linear-gradient(to_right,var(--primary)_var(--topup-fill),var(--surface3)_var(--topup-fill))] accent-primary [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-[0_0_0_4px_color-mix(in_srgb,var(--primary)_20%,transparent)]"
          aria-label="Wallet top-up pack"
        />

        <div className="mt-2 flex justify-between font-mono text-[10px] text-text-dim">
          <span>{fmt(WALLET_TOPUP_LIST[0].priceCents)}</span>
          <span>{fmt(WALLET_TOPUP_LIST[WALLET_TOPUP_LIST.length - 1].priceCents)}</span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { label: "Image scans", value: imageScans, colorClass: "text-primary" },
            { label: "Audio scans", value: audioScans, colorClass: "text-warning" },
            { label: "Video scans", value: videoScans, colorClass: "text-danger" },
          ].map((item) => (
            <div key={item.label} className="rounded-[12px] border border-border-subtle bg-surface2 px-2 py-2 text-center">
              <div className={`font-mono text-[14px] font-bold ${item.colorClass}`}>≈{item.value}</div>
              <div className="mt-1 text-[10px] leading-tight text-text-dim">{item.label}</div>
            </div>
          ))}
        </div>

        {error ? <p className="mt-4 text-[12px] text-danger">{error}</p> : null}

        <button
          onClick={() => onCheckout(pack.id)}
          disabled={isStarting}
          className="mt-4 w-full rounded-[13px] bg-primary px-4 py-3 text-[13.5px] font-extrabold text-bg shadow-[0_0_28px_var(--primary-glow)] transition hover:bg-primary-hover disabled:opacity-70"
        >
          {isStarting ? "Redirecting to checkout…" : `Add ${pack.walletValueCents.toLocaleString()} credits — ${fmt(pack.priceCents)}`}
        </button>
        <p className="mt-2 text-center text-[11px] text-text-dim">One-time · no expiry · no subscription</p>
      </div>
    </div>
  );
}

function SubscriptionPlans({
  activePlanId,
  hasActiveSubscription,
  subscriptionBalance,
  monthlyCredits,
  renewsAt,
  canStartTrial,
  onChoose,
  onStartTrial,
  startingPlanId,
  isStartingTrial,
  error,
}: {
  activePlanId: string | null;
  hasActiveSubscription: boolean;
  subscriptionBalance: number;
  monthlyCredits: number;
  renewsAt: string | null;
  canStartTrial: boolean;
  onChoose: (id: PlanKey) => void;
  onStartTrial: () => void;
  startingPlanId: string | null;
  isStartingTrial: boolean;
  error: string | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const activePlan = activePlanId && EARLY_ACCESS_PLANS[activePlanId as PlanKey] ? EARLY_ACCESS_PLANS[activePlanId as PlanKey] : null;
  const renewsText = renewsAt ? new Date(renewsAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : null;

  if (hasActiveSubscription) {
    const pct = monthlyCredits > 0 ? subscriptionBalance / monthlyCredits : 0;

    return (
      <div className="rounded-[18px] border border-border bg-surface p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-[64px] w-[64px] shrink-0">
              <ArcMeter pct={pct} color="var(--primary)" size={64} strokeWidth={5} />
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
                <span className="font-mono font-semibold text-text">{subscriptionBalance.toLocaleString()}</span> of <span className="font-mono">{monthlyCredits.toLocaleString()}</span> monthly credits available.
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

  const cards = [
    {
      key: "basic" as PlanKey,
      headline: "Lighter recurring verification",
      perCredit: "$0.16 / 100 credits",
      points: ["4 cr per image", "35 cr per audio", "2 deep videos / month"],
      tone: "primary" as const,
      cta: "Choose Basic",
    },
    {
      key: "pro" as PlanKey,
      headline: "More credits + deep video power",
      perCredit: "$0.12 / 100 credits",
      points: ["3 cr per image", "30 cr per audio", "4 deep videos / month"],
      tone: "warning" as const,
      cta: canStartTrial ? "Start free trial" : "Choose Pro",
      badge: canStartTrial ? "Trial" : "Best",
      best: true,
    },
  ];

  return (
    <div className="overflow-hidden rounded-[18px] border border-border bg-surface">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-surface-hover sm:px-5"
      >
        <div>
          <div className="text-[13px] font-bold text-text">Need lower scan costs?</div>
          <p className="mt-1 max-w-[520px] text-[12px] leading-5 text-text-muted">
            Subscribe when wallet top-ups are not enough. Plans include monthly credits and better scan rates.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {canStartTrial ? <span className="hidden rounded-full border border-warning/25 bg-warning-dim px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-warning sm:inline-flex">Trial available</span> : null}
          <span className={`flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle bg-surface2 text-text-muted transition duration-300 ${isOpen ? "rotate-180" : ""}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
          </span>
        </div>
      </button>

      <div className="grid transition-[grid-template-rows] duration-500 ease-out" style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}>
        <div className="min-h-0 overflow-hidden">
          <div className={`px-4 pb-4 transition duration-500 sm:px-5 sm:pb-5 ${isOpen ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"}`}>
            <div className="mb-4 flex justify-end">
              <Link href="/subscription" className="hidden rounded-full border border-border-subtle bg-surface2 px-3 py-1.5 text-[11px] font-semibold text-text-muted transition hover:bg-surface-hover hover:text-text sm:inline-flex">
                Compare plans
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => {
          const plan = EARLY_ACCESS_PLANS[card.key];
          const isStarting = startingPlanId === plan.id;
          const accentClass = card.tone === "warning" ? "text-warning" : "text-primary";
          const borderClass = card.best ? "border-warning/25" : "border-border-subtle";
          const badgeClass = card.best ? "border-warning/25 bg-warning-dim text-warning" : "border-primary/25 bg-primary-dim text-primary";
          const buttonClass = card.best
            ? "bg-primary text-bg hover:bg-primary-hover"
            : "border border-primary/30 bg-primary-dim text-primary hover:border-primary/45";

          return (
            <div key={plan.id} className={`relative flex min-h-[214px] flex-col overflow-hidden rounded-[16px] border ${borderClass} bg-surface2 p-3.5 sm:p-4`}>
              {card.best ? <div className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-warning/10 blur-2xl" /> : null}
              <div className="relative flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-[15px] font-extrabold tracking-[-0.03em] text-text">{plan.name}</h3>
                  <p className="mt-1 text-[11px] leading-4 text-text-muted">{card.headline}</p>
                </div>
                <div className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] ${badgeClass}`}>
                  {card.best ? card.badge : "Plan"}
                </div>
              </div>

              <div className="relative mt-3 rounded-[12px] border border-border-subtle bg-surface px-3 py-2.5">
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-dim">Monthly</div>
                    <div className="mt-1 font-mono text-[20px] font-extrabold tracking-[-0.05em] text-text">{fmt(plan.currentPriceCents)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-dim">Included</div>
                    <div className={`mt-1 font-mono text-[15px] font-bold ${accentClass}`}>{plan.monthlyCredits.toLocaleString()} cr</div>
                  </div>
                </div>
                <div className="mt-2 text-[10.5px] font-medium text-text-muted">{card.perCredit}</div>
              </div>

              <div className="relative mt-3 flex flex-1 flex-col gap-1.5">
                {card.points.map((point) => (
                  <div key={point} className="flex items-center gap-2 text-[11px] text-text-muted">
                    <span className={`h-1.5 w-1.5 rounded-full ${card.tone === "warning" ? "bg-warning" : "bg-primary"}`} />
                    <span>{point}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => (card.key === "pro" && canStartTrial ? onStartTrial() : onChoose(card.key))}
                disabled={startingPlanId !== null || isStartingTrial}
                className={`relative mt-3 w-full rounded-[12px] px-3 py-2.5 text-[12px] font-bold transition disabled:opacity-70 ${buttonClass}`}
              >
                {card.key === "pro" && isStartingTrial ? "Redirecting…" : isStarting ? "Redirecting…" : card.cta}
              </button>
            </div>
          );
        })}
      </div>

            <Link href="/subscription" className="mt-3 inline-flex w-full items-center justify-center rounded-[12px] border border-border bg-surface2 px-4 py-2.5 text-[12px] font-semibold text-text-muted transition hover:bg-surface-hover hover:text-text sm:hidden">
              Compare all plans
            </Link>

            {error ? <p className="mt-3 text-[12px] text-danger">{error}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentHistory({ history }: { history: PaymentItem[] }) {
  return (
    <div className="rounded-[18px] border border-border bg-surface p-5">
      <div className="mb-3 hidden grid-cols-[1.4fr_1fr_0.7fr] gap-3 border-b border-border pb-3 sm:grid">
        {[
          "Date (UTC)",
          "Amount",
          "Status",
        ].map((h) => (
          <div key={h} className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-dim">{h}</div>
        ))}
      </div>
      {history.length === 0 ? (
        <div className="py-8 text-center text-[13px] text-text-dim">No payment history yet.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {history.map((h) => {
            const dateText = new Intl.DateTimeFormat("en-GB", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
              timeZone: "UTC",
            }).format(new Date(h.createdAt));
            const amountText = new Intl.NumberFormat("en-US", { style: "currency", currency: h.currency || "USD" }).format(h.amount / 100);
            const success = h.status === "COMPLETED";
            const fail = h.status === "FAILED";
            const label = success ? "Success" : fail ? "Failure" : h.status;
            return (
              <div key={h.id} className="grid gap-2 rounded-[12px] border border-border-subtle bg-surface2 px-4 py-3 sm:grid-cols-[1.4fr_1fr_0.7fr] sm:items-center">
                <div className="font-mono text-[12.5px] text-text-muted">{dateText}</div>
                <div className="font-mono text-[13px] font-bold text-text">{amountText}</div>
                <div className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${success ? "border-success/30 bg-success-dim text-success" : fail ? "border-danger/30 bg-danger-dim text-danger" : "border-border bg-surface3 text-text-muted"}`}>
                  <div className={`h-1.5 w-1.5 rounded-full ${success ? "bg-success" : fail ? "bg-danger" : "bg-text-dim"}`} />
                  {label}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CreditsPage() {
  const { me } = useAppMe();
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const [trialError, setTrialError] = useState<string | null>(null);
  const [startingPlanId, setStartingPlanId] = useState<string | null>(null);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [pendingCheckout, setPendingCheckout] = useState<null | { type: "credits" | "trial" | "subscription"; packId?: string; planId?: PlanKey; title: string; description: string; confirmLabel: string }>(null);

  const trialBal = me?.trial?.balance ?? 0;
  const trialEndsAt = me?.trial?.trialEndsAt ?? me?.subscription?.trialEndsAt ?? null;
  const trialStatus = me?.subscription?.status ?? "INACTIVE";
  const subPlanId = me?.subscription?.subscriptionPlanId ?? null;
  const subStatus = me?.subscription?.status ?? "INACTIVE";
  const subscriptionBalance = me?.subscription?.subscriptionCreditBalance ?? 0;
  const subscriptionMonthlyCredits = me?.subscription?.subscriptionMonthlyCredits ?? 0;
  const subscriptionRenewsAt = me?.subscription?.renewsAt ?? me?.subscription?.currentPeriodEnd ?? null;
  const walletBal = me?.wallet?.balance ?? 0;
  const paymentHistory = (me?.paymentHistory ?? []) as PaymentItem[];
  const isPaidUser = me?.trial?.isPaidUser ?? false;
  const hasActiveSubscription = subStatus === "ACTIVE" || subStatus === "ON_TRIAL";

  const subPlanName = useMemo(() => {
    if (!subPlanId) return null;
    return EARLY_ACCESS_PLANS[subPlanId as PlanKey]?.name ?? subPlanId;
  }, [subPlanId]);

  const currentImageCost = subPlanId && EARLY_ACCESS_PLANS[subPlanId as PlanKey]
    ? EARLY_ACCESS_PLANS[subPlanId as PlanKey].imageCost
    : SCAN_PRICES.image;
  const currentAudioCost = subPlanId && EARLY_ACCESS_PLANS[subPlanId as PlanKey]
    ? EARLY_ACCESS_PLANS[subPlanId as PlanKey].audioCost
    : SCAN_PRICES.audio;
  const currentVideoCost = subPlanId && EARLY_ACCESS_PLANS[subPlanId as PlanKey]
    ? EARLY_ACCESS_PLANS[subPlanId as PlanKey].videoShortCost
    : SCAN_PRICES.video15;

  const hasTrialRecord = Boolean(trialEndsAt || trialBal > 0 || isPaidUser || trialStatus === "ON_TRIAL");
  const canStartTrial = !hasTrialRecord && !hasActiveSubscription;

  function handleCheckout(packId: string) {
    const pack = CREDIT_PACKS.find((item) => item.id === packId) ?? CREDIT_PACKS[0];
    setPendingCheckout({
      type: "credits",
      packId,
      title: `Buy ${pack.label} pack?`,
      description: `You’re about to continue to checkout for ${pack.price}.`,
      confirmLabel: "Continue",
    });
  }

  function handleStartTrial() {
    setPendingCheckout({
      type: "trial",
      title: "Start free trial?",
      description: "Your free trial checkout will open next.",
      confirmLabel: "Start free trial",
    });
  }

  function handleSubscription(planId: PlanKey) {
    setPendingCheckout({
      type: "subscription",
      planId,
      title: `Subscribe to ${EARLY_ACCESS_PLANS[planId].name}?`,
      description: `You’re about to continue to ${EARLY_ACCESS_PLANS[planId].name} checkout.`,
      confirmLabel: "Continue",
    });
  }

  async function confirmPendingCheckout() {
    if (!pendingCheckout) return;

    try {
      if (pendingCheckout.type === "credits" && pendingCheckout.packId) {
        setCheckoutError(null);
        setIsStartingCheckout(true);
        const res = await fetch("/api/billing/checkout/credits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ packId: pendingCheckout.packId }),
        });
        const payload = await res.json();
        if (!res.ok || !payload?.success || !payload?.data?.checkoutUrl) throw new Error(payload?.error || "Unable to start checkout.");
        window.location.href = payload.data.checkoutUrl;
        return;
      }

      if (pendingCheckout.type === "trial") {
        setTrialError(null);
        setIsStartingTrial(true);
        const res = await fetch("/api/billing/checkout/trial", { method: "POST" });
        const payload = await res.json();
        if (!res.ok || !payload?.success || !payload?.data?.checkoutUrl) throw new Error(payload?.error || "Unable to start trial checkout.");
        window.location.href = payload.data.checkoutUrl;
        return;
      }

      if (pendingCheckout.type === "subscription" && pendingCheckout.planId) {
        setSubscriptionError(null);
        setStartingPlanId(pendingCheckout.planId);
        const res = await fetch("/api/billing/checkout/subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId: pendingCheckout.planId }),
        });
        const payload = await res.json();
        if (!res.ok || !payload?.success || !payload?.data?.checkoutUrl) throw new Error(payload?.error || "Unable to start subscription checkout.");
        window.location.href = payload.data.checkoutUrl;
        return;
      }
    } catch (e) {
      if (pendingCheckout.type === "credits") {
        setCheckoutError(e instanceof Error ? e.message : "Unable to start checkout.");
        setIsStartingCheckout(false);
      } else if (pendingCheckout.type === "trial") {
        setTrialError(e instanceof Error ? e.message : "Unable to start trial checkout.");
        setIsStartingTrial(false);
      } else {
        setSubscriptionError(e instanceof Error ? e.message : "Unable to start subscription checkout.");
        setStartingPlanId(null);
      }
      setPendingCheckout(null);
    }
  }

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-8 px-4 pb-16 pt-5 md:px-6 md:pt-6 lg:px-8">
      <div>
        <h1 className="text-[20px] font-bold tracking-[-0.025em] text-text">Credits & Billing</h1>
        <p className="mt-1 text-[13px] text-text-muted">Review credits, top up your wallet, and subscribe when you need more.</p>
      </div>

      <div>
        <SectionLabel icon="M17 9V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2m2 4h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2" label="Credit summary" />
        <CreditSummaryCard
          walletBal={walletBal}
          imageCost={currentImageCost}
          audioCost={currentAudioCost}
          videoCost={currentVideoCost}
          subPlanName={subPlanName}
          hasActiveSubscription={hasActiveSubscription}
        />
      </div>

      <div>
        <SectionLabel icon="M13 2L3 14h9l-1 8 10-12h-9l1-8z" label="Wallet topup" />
        <WalletTopup onCheckout={handleCheckout} isStarting={isStartingCheckout} error={checkoutError} />
      </div>

      <div>
        <SectionLabel icon="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" label="Pay history" />
        <PaymentHistory history={paymentHistory} />
      </div>

      <div id="credit-subscription-gateway">
        <SectionLabel icon="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3" label={hasActiveSubscription ? "Subscription" : "Subscribe for more experiences"} />
        <SubscriptionPlans
          activePlanId={subPlanId}
          hasActiveSubscription={hasActiveSubscription}
          subscriptionBalance={subscriptionBalance}
          monthlyCredits={subscriptionMonthlyCredits}
          renewsAt={subscriptionRenewsAt}
          canStartTrial={canStartTrial}
          onChoose={handleSubscription}
          onStartTrial={handleStartTrial}
          startingPlanId={startingPlanId}
          isStartingTrial={isStartingTrial}
          error={subscriptionError || trialError}
        />
      </div>

      {pendingCheckout ? (
        <CheckoutConfirmModal
          title={pendingCheckout.title}
          description={pendingCheckout.description}
          confirmLabel={pendingCheckout.confirmLabel}
          loading={isStartingCheckout || isStartingTrial || startingPlanId !== null}
          onClose={() => {
            if (isStartingCheckout || isStartingTrial || startingPlanId !== null) return;
            setPendingCheckout(null);
          }}
          onConfirm={() => void confirmPendingCheckout()}
        />
      ) : null}
    </div>
  );
}
