"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import {
  EARLY_ACCESS_PLANS,
  FREE_SCAN_PRICES,
  SCAN_PRICES,
  type EarlyAccessPlanId,
} from "@/lib/billing/pricing.constants";
import { PLANS } from "@/lib/billing/plans";
import { TRIAL_INTERNAL_VALUE_CENTS } from "@/lib/billing/trial.constants";
import ArcMeter from "@/components/billing/ArcMeter";
import { SmartButton } from "@/components/ui/SmartButton";
import { useAppMe } from "@/hooks/use-app-me";
import { useCheckout } from "@/hooks/use-checkout";
import { resolveUserState, type UserStateKind } from "@/lib/user-state";
import {
  AppPage,
  AppPageHeader,
  AppSectionHeader,
} from "@/components/app-shell/AppPage";

const TRIAL_DURATION_DAYS = 7;

function fmt(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function Icon({
  d,
  size = 14,
  color = "currentColor",
  stroke = 1.8,
}: {
  d: string;
  size?: number;
  color?: string;
  stroke?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

function SectionLabel({ icon, label }: { icon: string; label: string }) {
  return <AppSectionHeader title={label} icon={icon} />;
}

function PlanHero({
  planId,
  subBalance,
  monthlyCredits,
  status,
  isLocked,
  priceCents,
  trialState,
  trialBalance,
  trialTotal,
  trialEndsAt,
  onStartTrial,
  isStartingTrial,
  trialError,
}: {
  planId: EarlyAccessPlanId | null;
  subBalance: number;
  monthlyCredits: number;
  status: string;
  isLocked: boolean;
  priceCents: number | null;
  trialState: "active" | "ended" | "none" | "hidden";
  trialBalance: number;
  trialTotal: number;
  trialEndsAt: string | null;
  onStartTrial: () => void;
  isStartingTrial: boolean;
  trialError: string | null;
}) {
  if (!planId) {
    const isTrialActive = trialState === "active";
    const isTrialEnded = trialState === "ended";
    const daysLeft = trialEndsAt
      ? Math.max(
          0,
          Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000),
        )
      : null;
    const pct = isTrialActive && trialTotal > 0 ? trialBalance / trialTotal : 0;
    const tone = isTrialEnded
      ? "var(--danger)"
      : isTrialActive
        ? "var(--success)"
        : "var(--primary)";
    const toneDim = isTrialEnded
      ? "var(--danger-dim)"
      : isTrialActive
        ? "var(--success-dim)"
        : "var(--primary-dim)";
    const title = isTrialEnded
      ? "Trial ended"
      : isTrialActive
        ? "Trial active"
        : "Free trial ready";
    const description = isTrialEnded
      ? "Your trial access has ended. Choose a plan below to keep scanning with lower costs."
      : isTrialActive
        ? "Use your trial credits, then choose the plan that fits your scan volume."
        : "Preview RealvsAI with trial credits before choosing a plan.";

    return (
      <div
        style={{
          background: "var(--surface)",
          border: `1px solid ${isTrialEnded ? "color-mix(in srgb, var(--danger) 22%, transparent)" : isTrialActive ? "color-mix(in srgb, var(--success) 22%, transparent)" : "color-mix(in srgb, var(--primary) 18%, transparent)"}`,
          borderRadius: 18,
          padding: "24px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -70,
            right: -50,
            width: 180,
            height: 180,
            borderRadius: "50%",
            background: isTrialEnded
              ? "color-mix(in srgb, var(--danger) 12%, transparent)"
              : isTrialActive
                ? "color-mix(in srgb, var(--success) 12%, transparent)"
                : "var(--primary-glow)",
            filter: "blur(58px)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 15,
              minWidth: 0,
              width: "100%",
            }}
          >
            <div
              style={{
                position: "relative",
                width: isTrialActive ? 66 : 48,
                height: isTrialActive ? 66 : 48,
                flexShrink: 0,
              }}
            >
              {isTrialActive ? (
                <>
                  <ArcMeter pct={pct} color={tone} size={66} strokeWidth={5} />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: tone,
                        fontFamily: "'DM Mono',monospace",
                      }}
                    >
                      {Math.round(pct * 100)}%
                    </span>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 15,
                    background: toneDim,
                    border: `1px solid color-mix(in srgb, ${tone} 22%, transparent)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon
                    d={
                      isTrialEnded
                        ? "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3"
                        : "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016"
                    }
                    size={18}
                    color={tone}
                  />
                </div>
              )}
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                  marginBottom: 5,
                }}
              >
                <h2
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    letterSpacing: "-0.035em",
                    color: "var(--text)",
                    margin: 0,
                  }}
                >
                  {title}
                </h2>
                <span
                  style={{
                    padding: "3px 9px",
                    borderRadius: 100,
                    background: toneDim,
                    border: `1px solid color-mix(in srgb, ${tone} 22%, transparent)`,
                    fontSize: 9.5,
                    fontWeight: 700,
                    color: tone,
                    letterSpacing: ".06em",
                    textTransform: "uppercase",
                  }}
                >
                  {isTrialEnded
                    ? "Expired"
                    : isTrialActive
                      ? "Live"
                      : "Available"}
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  maxWidth: 430,
                  fontSize: 12.5,
                  color: "var(--text-muted)",
                  lineHeight: 1.6,
                }}
              >
                {description}
              </p>
              {trialError ? (
                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: 12,
                    color: "var(--danger)",
                  }}
                >
                  {trialError}
                </p>
              ) : null}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(118px,1fr))",
              gap: 9,
              width: "100%",
              maxWidth: 520,
            }}
          >
            {[
              {
                label: isTrialActive ? "Remaining" : "Trial credits",
                value: `${(isTrialActive ? trialBalance : trialTotal).toLocaleString()} cr`,
              },
              {
                label: isTrialActive ? "Time left" : "Access",
                value:
                  isTrialActive && daysLeft !== null
                    ? `${daysLeft}d left`
                    : `${TRIAL_DURATION_DAYS} days`,
              },
              { label: "Deep video", value: "Plans only" },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  background: "var(--surface2)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 12,
                  padding: "11px 12px",
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: ".08em",
                    color: "var(--text-dim)",
                    marginBottom: 5,
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: "var(--text)",
                    fontFamily: "'DM Mono',monospace",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {isTrialActive || isTrialEnded ? (
            <a
              href="#plan-comparison"
              style={{
                alignSelf: "flex-start",
                padding: "10px 16px",
                borderRadius: 10,
                background: isTrialEnded ? "var(--danger)" : "var(--success)",
                color: isTrialEnded ? "#fff" : "var(--bg)",
                fontSize: 12.5,
                fontWeight: 700,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              {isTrialEnded ? "Choose a plan ↓" : "Compare plans ↓"}
            </a>
          ) : (
            <SmartButton
              label="Start free trial"
              loadingLabel="Preparing checkout..."
              successEventName="ls:checkout:success"
              resetEventName="ls:checkout:closed"
              loading={isStartingTrial}
              error={trialError}
              onClick={onStartTrial}
              className="self-start rounded-[10px] px-4 py-2.5 text-[12.5px] font-extrabold whitespace-nowrap"
            />
          )}
        </div>
      </div>
    );
  }

  const plan = EARLY_ACCESS_PLANS[planId];
  const pct = monthlyCredits > 0 ? subBalance / monthlyCredits : 0;
  const price = priceCents ?? plan.currentPriceCents;
  const specs = [
    { label: "Credits / month", val: plan.monthlyCredits.toLocaleString() },
    { label: "Deep video / month", val: String(plan.deepVideoMonthlyLimit) },
    { label: "Image scan", val: `${plan.imageCost} cr` },
    { label: "Audio scan", val: `${plan.audioCost} cr` },
    { label: "Short video", val: `${plan.videoShortCost} cr` },
    { label: "Deep video", val: `${plan.deepVideoCost} cr` },
  ];

  return (
    <div
      style={{
        background: "linear-gradient(135deg,#0f1420 0%,#0c0e18 100%)",
        border: "1px solid color-mix(in srgb, var(--primary) 20%, transparent)",
        borderRadius: 18,
        padding: "24px",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 0 40px var(--primary-glow)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -50,
          right: -40,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "var(--primary-glow)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 6,
                flexWrap: "wrap",
              }}
            >
              <h2
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  color: "var(--text)",
                }}
              >
                {plan.name}
              </h2>
              <div
                style={{
                  padding: "3px 10px",
                  borderRadius: 100,
                  background: "var(--primary-dim)",
                  border:
                    "1px solid color-mix(in srgb, var(--primary) 25%, transparent)",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--primary)",
                  letterSpacing: ".06em",
                }}
              >
                ACTIVE
              </div>
              {isLocked ? (
                <div
                  style={{
                    padding: "3px 10px",
                    borderRadius: 100,
                    background: "var(--warning-dim)",
                    border:
                      "1px solid color-mix(in srgb, var(--warning) 25%, transparent)",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--warning)",
                    letterSpacing: ".06em",
                  }}
                >
                  EARLY ACCESS
                </div>
              ) : null}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
              <span
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  color: "var(--text)",
                  fontFamily: "'DM Mono',monospace",
                }}
              >
                {fmt(price)}
              </span>
              <span style={{ fontSize: 13, color: "var(--text)" }}>
                / month
              </span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text)", marginTop: 4 }}>
              Status:{" "}
              <span style={{ color: "var(--success)", fontWeight: 600 }}>
                {status}
              </span>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
            }}
          >
            <div style={{ position: "relative", width: 80, height: 80 }}>
              <ArcMeter
                pct={pct}
                color="var(--primary)"
                size={80}
                strokeWidth={6}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--primary)",
                    fontFamily: "'DM Mono',monospace",
                  }}
                >
                  {Math.round(pct * 100)}%
                </span>
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--text)",
                  fontFamily: "'DM Mono',monospace",
                }}
              >
                {subBalance.toLocaleString()}
              </div>
              <div style={{ fontSize: 10, color: "var(--text)" }}>
                of {monthlyCredits.toLocaleString()} cr
              </div>
            </div>
          </div>
        </div>

        {isLocked ? (
          <div
            style={{
              background: "var(--warning-dim)",
              border:
                "1px solid color-mix(in srgb, var(--warning) 20%, transparent)",
              borderRadius: 12,
              padding: "12px 16px",
              marginBottom: 18,
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <Icon
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016"
              size={14}
              color="var(--warning)"
            />
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--warning)",
                  marginBottom: 3,
                }}
              >
                Early Access — locked pricing
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: "var(--text-muted)",
                  lineHeight: 1.6,
                }}
              >
                You joined during Early Access and keep this price unless you
                upgrade, cancel, or change plan.
              </div>
            </div>
          </div>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 8,
          }}
        >
          {specs.map((s) => (
            <div
              key={s.label}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 10,
                padding: "10px 12px",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "var(--text)",
                  textTransform: "uppercase",
                  letterSpacing: ".1em",
                  marginBottom: 4,
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "var(--text)",
                  fontFamily: "'DM Mono',monospace",
                }}
              >
                {s.val}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PricingWarning() {
  return (
    <div
      style={{
        background: "var(--warning-dim)",
        border: "1px solid color-mix(in srgb, var(--warning) 20%, transparent)",
        borderRadius: 12,
        padding: "12px 16px",
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
      }}
    >
      <Icon
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3"
        size={14}
        color="var(--warning)"
      />
      <div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--warning)",
            marginBottom: 2,
          }}
        >
          Upgrading switches you to current pricing
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: "var(--text-muted)",
            lineHeight: 1.6,
          }}
        >
          Early Access subscribers keep their locked price until they upgrade,
          cancel, or change plan.
        </div>
      </div>
    </div>
  );
}

const PLAN_ORDER: EarlyAccessPlanId[] = ["basic", "pro"];
const CREDIT_PLAN = {
  name: "Credits",
  priceLabel: "Pay as you go",
  monthlyCredits: "—",
  imageCost: `${FREE_SCAN_PRICES.image} cr`,
  audioCost: `${FREE_SCAN_PRICES.audio} cr`,
  videoShortCost: `${FREE_SCAN_PRICES.video15} cr`,
  deepVideoCost: "Blocked",
  deepVideoMonthlyLimit: "Blocked",
};
const getTablePlan = (key: EarlyAccessPlanId) =>
  key === "pro" ? PLANS.pro_ea : PLANS.basic;

const FEATURE_ROWS = [
  {
    label: "Credits / month",
    renderCredit: () => CREDIT_PLAN.monthlyCredits,
    renderPlan: (key: EarlyAccessPlanId) =>
      getTablePlan(key).monthlyCredits.toLocaleString(),
  },
  {
    label: "Image scan",
    renderCredit: () => CREDIT_PLAN.imageCost,
    renderPlan: (key: EarlyAccessPlanId) =>
      `${getTablePlan(key).imageCost} cr`,
  },
  {
    label: "Audio scan",
    renderCredit: () => CREDIT_PLAN.audioCost,
    renderPlan: (key: EarlyAccessPlanId) =>
      `${getTablePlan(key).audioCost} cr`,
  },
  {
    label: "Short video scan",
    renderCredit: () => CREDIT_PLAN.videoShortCost,
    renderPlan: (key: EarlyAccessPlanId) =>
      `${getTablePlan(key).videoShortCost} cr`,
  },
  {
    label: "Deep video scan",
    renderCredit: () => CREDIT_PLAN.deepVideoCost,
    renderPlan: (key: EarlyAccessPlanId) => {
      const plan = getTablePlan(key);
      return plan.deepVideo ? `${plan.deepVideoCost} cr` : "Blocked";
    },
  },
  {
    label: "Deep video / month",
    renderCredit: () => CREDIT_PLAN.deepVideoMonthlyLimit,
    renderPlan: (key: EarlyAccessPlanId) => {
      const plan = getTablePlan(key);
      return plan.deepVideo ? String(plan.deepVideoMonthly) : "Blocked";
    },
  },
];

function PlanComparisonTable({
  activePlanId,
  trialStatus,
  trialEndsAt,
  onChoose,
  startingPlanId,
  proPriceCents,
  error,
}: {
  activePlanId: EarlyAccessPlanId | null;
  trialStatus: string;
  trialEndsAt: string | null;
  onChoose: (id: EarlyAccessPlanId) => void;
  startingPlanId: EarlyAccessPlanId | null;
  proPriceCents: number;
  error: string | null;
}) {
  const isOnTrial = trialStatus === "ON_TRIAL";
  const daysLeft = trialEndsAt
    ? Math.max(
        0,
        Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000),
      )
    : null;
  const urgency = daysLeft !== null && daysLeft <= 3;

  const plans = [
    {
      key: "credits",
      name: CREDIT_PLAN.name,
      sub: CREDIT_PLAN.priceLabel,
      price: null,
      badge: null,
      highlight: false,
      active: false,
      cta: "Credits",
      ctaVariant: "outline" as const,
    },
    ...PLAN_ORDER.map((key) => ({
      key,
      name: EARLY_ACCESS_PLANS[key].name,
      sub: null,
      price: activePlanId === key ? "Your Plan" : key === "basic" ? fmt(PLANS.basic.priceCents) : fmt(proPriceCents),
      badge: key === "pro" && activePlanId !== key ? "BEST VALUE" : null,
      highlight: key === "pro",
      active: activePlanId === key,
      cta: activePlanId === key ? "Current" : "Choose",
      ctaVariant:
        activePlanId === key ? ("outline" as const) : ("primary" as const),
    })),
  ];

  return (
    <div id="plan-comparison">
      <style>{`
        .pricing-table-wrap {
          width: 100%;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 18px;
          overflow: hidden;
        }
        .pricing-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: auto;
        }
        .pricing-table th,
        .pricing-table td {
          padding: 15px 17px;
          text-align: left;
          border-bottom: 1px solid var(--border-subtle);
          vertical-align: middle;
        }
        .pricing-table thead th {
          background: color-mix(in srgb, var(--surface2) 72%, var(--surface));
          padding-bottom: 16px;
          vertical-align: bottom;
        }
        .pricing-table thead th.feature-col {
          width: 29%;
          background: var(--surface);
          font-size: 10.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .08em;
          color: var(--text-dim);
        }
        .pricing-table .credits-col {
          background: color-mix(in srgb, var(--text) 2%, transparent);
        }
        .pricing-table .plan-col-highlight {
          background: color-mix(in srgb, var(--warning) 6%, transparent);
        }
        .pricing-table .plan-col-active {
          background: color-mix(in srgb, var(--primary) 8%, transparent);
        }
        .pricing-table tbody td {
          background: var(--surface);
          color: var(--text);
          font-size: 13.5px;
          font-weight: 600;
          font-family: 'DM Mono', monospace;
          line-height: 1.26;
        }
        .pricing-table tbody td.feature-label {
          color: var(--text-dim);
          font-size: 12.75px;
          font-weight: 600;
          font-family: inherit;
        }
        .pricing-table tbody td.credits-col {
          background: color-mix(in srgb, var(--text) 2%, transparent);
        }
        .pricing-table tbody td.plan-col-highlight {
          background: color-mix(in srgb, var(--warning) 3%, transparent);
        }
        .pricing-table tbody td.plan-col-active {
          background: color-mix(in srgb, var(--primary) 5%, transparent);
          color: var(--primary);
        }
        .pricing-table tbody tr:nth-child(even) td:not(.credits-col):not(.plan-col-highlight):not(.plan-col-active) {
          background: rgba(255,255,255,0.01);
        }
        .pricing-table tfoot td {
          background: color-mix(in srgb, var(--surface2) 72%, var(--surface));
          padding: 11px 14px;
          border-top: 1px solid var(--border);
          border-bottom: none;
        }
        .pricing-table tfoot td.credits-col {
          background: color-mix(in srgb, var(--surface2) 72%, var(--surface));
        }
        .plan-name {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 16px;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: var(--text);
          line-height: 1;
        }
        .plan-name.active {
          color: var(--primary);
        }
        .plan-sub {
          font-size: 13px;
          color: var(--text-dim);
          margin-top: 4px;
          font-family: 'DM Mono', monospace;
          line-height: 1;
        }
        .plan-price {
          font-size: 19px;
          font-weight: 800;
          color: var(--text);
          margin-top: 4px;
          letter-spacing: -0.04em;
          font-family: 'DM Mono', monospace;
          line-height: 1;
          white-space: nowrap;
        }
        .plan-price.active {
          color: var(--primary);
        }
        .plan-price span {
          font-size: 10.5px;
          font-weight: 400;
          color: var(--text-dim);
          margin-left: 1px;
        }
        .plan-badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 999px;
          font-size: 8.5px;
          font-weight: 700;
          letter-spacing: .04em;
          margin-left: 0;
          line-height: 1.1;
          vertical-align: middle;
          white-space: nowrap;
        }
        .plan-badge.best {
          background: var(--warning-dim);
          border: 1px solid color-mix(in srgb, var(--warning) 20%, transparent);
          color: var(--warning);
        }
        .plan-badge.active {
          background: var(--primary-dim);
          border: 1px solid color-mix(in srgb, var(--primary) 25%, transparent);
          color: var(--primary);
        }
        .table-btn {
          display: inline-flex;
          width: 100%;
          align-items: center;
          justify-content: center;
          padding: 7px 8px;
          border-radius: 9px;
          font-size: 11.5px;
          font-weight: 700;
          line-height: 1;
          white-space: nowrap;
          text-decoration: none;
          font-family: inherit;
        }
        .table-btn.outline {
          background: #000;
          border: none;
          outline: none;
          box-shadow: none;
          color: var(--text);
        }
        .table-btn.primary {
          background: var(--primary);
          border: none;
          color: var(--bg);
          box-shadow: 0 0 14px var(--primary-glow);
          cursor: pointer;
        }
        .table-btn.ghost {
          background: color-mix(in srgb, var(--primary) 16%, var(--surface));
          border: 1px solid color-mix(in srgb, var(--primary) 18%, transparent);
          color: var(--text);
          box-shadow: none;
          cursor: pointer;
        }
        .table-btn:disabled {
          cursor: default;
          opacity: .65;
          box-shadow: none;
        }
        .trial-cell {
          font-size: 11.25px;
          color: var(--text-dim);
          line-height: 1.1;
        }
        .trial-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .trial-dot {
          width: 5px;
          height: 5px;
          border-radius: 999px;
          animation: pulse 1.4s ease-in-out infinite;
        }
        @media (max-width: 640px) {
          .pricing-table {
            table-layout: fixed;
          }
          .pricing-table th,
          .pricing-table td {
            padding: 11px 8px;
          }
          .pricing-table thead th.feature-col {
            width: 27%;
            font-size: 9px;
            letter-spacing: .04em;
          }
          .pricing-table tbody td {
            font-size: 12px;
            letter-spacing: -0.01em;
            line-height: 1.14;
          }
          .pricing-table tbody td.feature-label {
            font-size: 11.5px;
            line-height: 1.18;
            word-break: break-word;
          }
          .pricing-table tfoot td {
            padding: 7px 5px;
          }
          .plan-name {
            font-size: 14.5px;
          }
          .plan-sub {
            font-size: 11px;
          }
          .plan-price {
            font-size: 16px;
          }
          .plan-price span {
            font-size: 9px;
          }
          .table-btn {
            font-size: 10.75px;
            padding: 7px 4px;
            border-radius: 8px;
          }
          .plan-badge {
            font-size: 7.5px;
            padding: 1px 4px;
            margin-left: 4px;
          }
          .trial-cell {
            font-size: 9.5px;
          }
        }
      `}</style>

      <div className="pricing-table-wrap">
        <table className="pricing-table">
          <thead>
            <tr>
              <th className="feature-col">Feature</th>
              {plans.map((plan) => {
                const headerClass = [
                  plan.key === "credits" ? "credits-col" : "",
                  plan.active ? "plan-col-active" : "",
                  !plan.active && plan.highlight ? "plan-col-highlight" : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <th key={plan.key} className={headerClass}>
                    <div className={`plan-name${plan.active ? " active" : ""}`}>
                      {plan.name}
                      {plan.badge ? (
                        <span className="plan-badge best">{plan.badge}</span>
                      ) : null}
                      {plan.active ? (
                        <span className="plan-badge active">CURRENT</span>
                      ) : null}
                    </div>
                    {plan.sub ? (
                      <div className="plan-sub">{plan.sub}</div>
                    ) : null}
                    {plan.price ? (
                      <div
                        className={`plan-price${plan.active ? " active" : ""}`}
                      >
                        {plan.price} <span>/mo</span>
                      </div>
                    ) : null}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {FEATURE_ROWS.map((row) => (
              <tr key={row.label}>
                <td className="feature-label">{row.label}</td>
                <td className="credits-col">{row.renderCredit()}</td>
                {PLAN_ORDER.map((key) => {
                  const planClass =
                    activePlanId === key
                      ? "plan-col-active"
                      : key === "pro"
                        ? "plan-col-highlight"
                        : "";
                  return (
                    <td key={key} className={planClass}>
                      {row.renderPlan(key)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error ? (
        <p
          style={{ fontSize: 11, color: "var(--danger)", padding: "10px 12px" }}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

function WhyUpgradeCards({
  activePlanId,
  onChoose,
  onStartTrial,
  canStartTrial,
  userState,
  earlyAccessEligible,
  loadingPlanId,
  subLoading,
  subError,
  trialLoading,
  trialError,
  error,
}: {
  activePlanId: EarlyAccessPlanId | null;
  onChoose: (id: EarlyAccessPlanId) => void;
  onStartTrial: () => void;
  canStartTrial: boolean;
  userState: UserStateKind;
  earlyAccessEligible: boolean;
  loadingPlanId: EarlyAccessPlanId | null;
  subLoading: boolean;
  subError: string | null;
  trialLoading: boolean;
  trialError: string | null;
  error: string | null;
}) {
  const formatPerHundredCredits = (priceCents: number, monthlyCredits: number) =>
    fmt((priceCents / monthlyCredits) * 100);

  const cards = [
    {
      key: "basic" as EarlyAccessPlanId,
      headline: "Lighter recurring verification",
      perCredit: formatPerHundredCredits(PLANS.basic.priceCents, PLANS.basic.monthlyCredits),
      points: [
        `${PLANS.basic.imageCost} cr / image`,
        `${PLANS.basic.audioCost} cr / audio`,
        `${PLANS.basic.videoShortCost} cr / short video`,
      ],
      color: "var(--primary)",
      best: false,
    },
    {
      key: "pro" as EarlyAccessPlanId,
      headline: "Heavier usage + deep video power",
      perCredit: formatPerHundredCredits(PLANS.pro_ea.priceCents, PLANS.pro_ea.monthlyCredits),
      points: [
        "Everything in Basic",
        `Deep video: ${PLANS.pro_ea.deepVideoCost} cr / ${PLANS.pro_ea.deepVideoMonthly} per mo`,
        "Premium features unlocked",
      ],
      color: "var(--warning)",
      best: true,
    },
  ];

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2,minmax(0,1fr))",
          gap: 12,
        }}
      >
        {cards.map((c) => {
          const plan = EARLY_ACCESS_PLANS[c.key];
          const active = activePlanId === c.key;
          const activeTrial = c.key === "pro" && (userState === "ea_trial" || userState === "normal_trial");
          const activePro = c.key === "pro" && (userState === "ea_pro" || userState === "normal_pro" || userState === "loyalty_pro");
          const proTrialEntry = c.key === "pro" && canStartTrial;
          const managePlanEntry = activePro;
          const disabled = active || activeTrial;
          const buttonLabel = activeTrial
            ? "Trial in progress"
            : managePlanEntry
              ? "Manage Plan"
              : active
                ? "Current plan"
                : proTrialEntry
                  ? "Start free trial"
                  : `Choose ${plan.name}`;
          const badgeLabel = c.key === "pro"
            ? activeTrial
              ? "Trial Active"
              : activePro
                ? "Your Plan"
                : proTrialEntry
                  ? earlyAccessEligible
                    ? "Early Access Trial"
                    : "Free Trial"
                  : "Pro"
            : null;
          const loading = proTrialEntry
            ? trialLoading
            : loadingPlanId === c.key && subLoading;
          return (
            <div
              key={c.key}
              style={{
                background: "var(--surface)",
                border: `1px solid ${c.best ? "color-mix(in srgb, var(--warning) 20%, transparent)" : "var(--border)"}`,
                borderRadius: 16,
                padding: "20px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {c.best ? (
                <div
                  style={{
                    position: "absolute",
                    top: -48,
                    right: -40,
                    width: 112,
                    height: 112,
                    borderRadius: "50%",
                    background:
                      "color-mix(in srgb, var(--warning) 10%, transparent)",
                    filter: "blur(40px)",
                    pointerEvents: "none",
                  }}
                />
              ) : null}
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    letterSpacing: "-0.03em",
                    color: "var(--text)",
                  }}
                >
                  {plan.name}
                </span>
                {badgeLabel ? (
                  <div
                    style={{
                      padding: "2px 8px",
                      borderRadius: 100,
                      background: "var(--warning-dim)",
                      border:
                        "1px solid color-mix(in srgb, var(--warning) 25%, transparent)",
                      fontSize: 9,
                      fontWeight: 700,
                      color: "var(--warning)",
                      letterSpacing: ".06em",
                    }}
                  >
                    {badgeLabel}
                  </div>
                ) : null}
              </div>
              <div
                style={{
                  position: "relative",
                  fontSize: c.best ? 11.5 : 12,
                  color: "var(--text-muted)",
                  marginBottom: 12,
                  lineHeight: 1.6,
                  whiteSpace: c.best ? "nowrap" : "normal",
                }}
              >
                {c.headline}
              </div>
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 14,
                  padding: "10px 14px",
                  background: "var(--surface2)",
                  borderRadius: 10,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--text)",
                      textTransform: "uppercase",
                      letterSpacing: ".1em",
                      marginBottom: 3,
                    }}
                  >
                    Per 100 credits
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: c.color,
                      fontFamily: "'DM Mono',monospace",
                    }}
                  >
                    {c.perCredit}
                  </div>
                </div>
                <div
                  style={{ width: 1, height: 32, background: "var(--border)" }}
                />
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--text)",
                      textTransform: "uppercase",
                      letterSpacing: ".1em",
                      marginBottom: 3,
                    }}
                  >
                    Included
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--text)",
                      fontFamily: "'DM Mono',monospace",
                    }}
                  >
                    {plan.monthlyCredits.toLocaleString()} credits
                  </div>
                </div>
              </div>
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {c.points.map((p) => (
                  <div
                    key={p}
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={c.color}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {p}
                    </span>
                  </div>
                ))}
              </div>
              <SmartButton
                label={buttonLabel}
                loadingLabel="Preparing checkout..."
                successEventName="ls:checkout:success"
                resetEventName="ls:checkout:closed"
                loading={loading}
                disabled={disabled || (!loading && (subLoading || trialLoading))}
                error={proTrialEntry ? trialError : loadingPlanId === c.key ? subError : null}
                onClick={() => {
                  if (disabled) return;
                  if (managePlanEntry) {
                    document.getElementById("manage-plan")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    return;
                  }
                  if (proTrialEntry) {
                    onStartTrial();
                    return;
                  }
                  onChoose(c.key);
                }}
                variant={c.best ? "primary" : "secondary"}
                className="mt-4 w-full rounded-[11px] px-3.5 py-2.5 text-[12.5px] font-extrabold"
              />
            </div>
          );
        })}
      </div>
      {error ? (
        <p style={{ fontSize: 11, color: "var(--danger)", marginTop: 10 }}>
          {error}
        </p>
      ) : null}
    </>
  );
}

function UsageSummary({
  subBal,
  subMonthly,
}: {
  subBal: number;
  subMonthly: number;
}) {
  const pct = subMonthly > 0 ? subBal / subMonthly : 0;

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: "20px",
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <div
        style={{ position: "relative", width: 56, height: 56, flexShrink: 0 }}
      >
        <ArcMeter pct={pct} color="var(--warning)" size={56} strokeWidth={4} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "var(--warning)",
              fontFamily: "'DM Mono',monospace",
            }}
          >
            {Math.round(pct * 100)}%
          </span>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: ".1em",
            color: "var(--text)",
            marginBottom: 3,
          }}
        >
          Subscription usage
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--text)",
              fontFamily: "'DM Mono',monospace",
            }}
          >
            {subBal.toLocaleString()}
          </span>
          <span style={{ fontSize: 11, color: "var(--text)" }}>
            of {subMonthly.toLocaleString()} credits
          </span>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  const { me } = useAppMe();
  const {
    openCheckout: openTrialCheckout,
    loading: trialLoading,
    error: trialError,
  } = useCheckout();
  const {
    openCheckout,
    loading: subLoading,
    error: subError,
  } = useCheckout();
  const [loadingPlanId, setLoadingPlanId] = useState<EarlyAccessPlanId | null>(null);

  const trialBalance = me?.trial?.balance ?? 0;
  const trialTotal = TRIAL_INTERNAL_VALUE_CENTS;
  const trialEndsAt =
    me?.subscription?.trialEndsAt ?? me?.trial?.trialEndsAt ?? null;
  const trialStatus = me?.subscription?.status ?? "INACTIVE";
  const subBalance = me?.subscription?.subscriptionCreditBalance ?? 0;
  const monthlyCredits = me?.subscription?.subscriptionMonthlyCredits ?? 0;
  const planId =
    (me?.subscription?.subscriptionPlanId as EarlyAccessPlanId | null) ?? null;
  const subStatus = me?.subscription?.status ?? "INACTIVE";
  const priceCents = me?.subscription?.subscriptionPriceCents ?? null;
  const isLocked = me?.subscription?.subscriptionPriceLocked ?? false;
  const hasTrialRecord = Boolean(
    trialEndsAt ||
    trialBalance > 0 ||
    (me?.trial?.audioScans ?? 0) > 0 ||
    (me?.trial?.videoScans ?? 0) > 0,
  );
  const trialEndsAtMs = trialEndsAt ? new Date(trialEndsAt).getTime() : null;
  const isTrialActive =
    trialStatus === "ON_TRIAL" &&
    trialBalance > 0 &&
    Boolean(trialEndsAtMs && trialEndsAtMs > Date.now());
  const isTrialEnded =
    trialStatus !== "ACTIVE" &&
    hasTrialRecord &&
    (!trialBalance || Boolean(trialEndsAtMs && trialEndsAtMs <= Date.now()));
  const userState = resolveUserState(me);
  const hasActiveTrial = userState === "ea_trial" || userState === "normal_trial";
  const hasActiveSubscriber =
    userState === "basic" ||
    userState === "ea_pro" ||
    userState === "normal_pro" ||
    userState === "loyalty_pro";
  const hasUsedTrial = userState === "trial_expired";
  const canStartTrial = userState === "free" || userState === "wallet_only";
  const proPriceCents =
    me?.subscription?.subscriptionPlanId === "pro" &&
    me.subscription.status === "ACTIVE" &&
    me.subscription.subscriptionPriceCents
      ? me.subscription.subscriptionPriceCents
      : me?.earlyAccessEligible
        ? PLANS.pro_ea.priceCents
        : PLANS.pro_normal.priceCents;
  const trialBlockState: "active" | "ended" | "none" | "hidden" = hasActiveSubscriber
    ? "hidden"
    : hasActiveTrial
      ? "active"
      : hasUsedTrial
        ? "ended"
        : "none";

  async function handleSubscription(planId: EarlyAccessPlanId) {
    setLoadingPlanId(planId);
    try {
      await openCheckout(() =>
        fetch("/api/billing/checkout/subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId }),
        })
          .then((res) => res.json())
          .then((payload) => {
            if (!payload?.success || !payload?.data?.checkoutUrl) {
              throw new Error(payload?.error || "Subscription not available yet.");
            }
            return payload.data.checkoutUrl as string;
          }),
      );
    } finally {
      setLoadingPlanId(null);
    }
  }

  function handleStartTrial() {
    return openTrialCheckout(() =>
      fetch("/api/billing/checkout/trial", { method: "POST" })
        .then((res) => res.json())
        .then((payload) => {
          if (!payload?.success || !payload?.data?.checkoutUrl) {
            throw new Error(payload?.error || "Unable to start trial.");
          }
          return payload.data.checkoutUrl as string;
        }),
    );
  }

  return (
    <>
      <AppPage>
        <AppPageHeader
          title="Subscription"
          description="See your current plan, compare upgrades, and keep pricing decisions transparent."
        />

        <section className="mt-8 flex flex-col gap-8">
          <div>
            <SectionLabel
              icon="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3"
              label="Current plan"
            />
            <PlanHero
              planId={planId}
              subBalance={subBalance}
              monthlyCredits={monthlyCredits}
              status={subStatus}
              isLocked={isLocked}
              priceCents={priceCents}
              trialState={trialBlockState}
              trialBalance={trialBalance}
              trialTotal={trialTotal}
              trialEndsAt={trialEndsAt}
              onStartTrial={handleStartTrial}
              isStartingTrial={trialLoading}
              trialError={trialError}
            />
          </div>

          <div>
            <SectionLabel
              icon="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10m6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v14"
              label="Pricing table"
            />
            <PricingWarning />
            <div className="mt-3">
              <PlanComparisonTable
                activePlanId={planId}
                trialStatus={trialStatus}
                trialEndsAt={trialEndsAt}
                onChoose={handleSubscription}
                startingPlanId={null}
                proPriceCents={proPriceCents}
                error={subError}
              />
            </div>
          </div>

          <div>
            <SectionLabel
              icon="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0"
              label="Here is why to upgrade"
            />
            <WhyUpgradeCards
              activePlanId={planId}
              onChoose={handleSubscription}
              onStartTrial={handleStartTrial}
              canStartTrial={canStartTrial}
              userState={userState}
              earlyAccessEligible={me?.earlyAccessEligible ?? false}
              loadingPlanId={loadingPlanId}
              subLoading={subLoading}
              subError={subError}
              trialLoading={trialLoading}
              trialError={trialError}
              error={subError || trialError}
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "14px 18px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{ fontSize: 12, color: "var(--text)", marginRight: 4 }}
            >
              Need help?
            </span>
            {(
              [
                [
                  "Open billing hub",
                  "/credits",
                  "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3",
                ],
                [
                  "Open settings",
                  "/settings",
                  "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065",
                ],
              ] as [string, string, string][]
            ).map(([label, href, icon], i) => (
              <Fragment key={label}>
                {i > 0 ? (
                  <div
                    style={{
                      width: 1,
                      height: 14,
                      background: "var(--border)",
                    }}
                  />
                ) : null}
                <Link
                  href={href}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--primary)",
                    textDecoration: "none",
                  }}
                >
                  <Icon d={icon} size={12} />
                  {label}
                </Link>
              </Fragment>
            ))}
          </div>
        </section>
      </AppPage>

    </>
  );
}
