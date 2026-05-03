"use client";

import { useMemo, useState } from "react";
import CheckoutConfirmModal from "@/components/billing/CheckoutConfirmModal";
import { CREDIT_PACKS } from "@/components/pricing/pricing-data";
import { usePathname, useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { DashboardSidebar, MobileDrawer, BottomNav, MobileActionSheet } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useAppMe } from "@/hooks/use-app-me";

function pathnameToNav(pathname: string): string {
  if (pathname.startsWith("/dashboard")) return "dashboard";
  if (pathname.startsWith("/scan") || pathname.startsWith("/universal-detector")) return "scan";
  if (pathname.startsWith("/history")) return "history";
  if (pathname.startsWith("/analytics")) return "results";
  if (pathname.startsWith("/api-keys") || pathname.startsWith("/credits") || pathname.startsWith("/subscription") || pathname.startsWith("/wallet")) return "api";
  if (pathname.startsWith("/profile")) return "profile";
  if (pathname.startsWith("/settings") || pathname.startsWith("/messages") || pathname.startsWith("/developers") || pathname.startsWith("/team") || pathname.startsWith("/creator") || pathname.startsWith("/admin") || pathname.startsWith("/monitor") || pathname.startsWith("/webhooks")) return "settings";
  return "dashboard";
}

function navToRoute(id: string): string {
  const map: Record<string, string> = {
    dashboard: "/dashboard",
    scan: "/scan",
    history: "/history",
    results: "/analytics",
    api: "/credits",
    settings: "/settings",
    profile: "/profile",
  };
  return map[id] ?? "/dashboard";
}

function resolvePlanLabel(status: string | null | undefined, variantName: string | null | undefined, productName: string | null | undefined, hasTrial: boolean) {
  if (variantName?.trim()) return variantName.trim();
  if (productName?.trim()) return productName.trim();
  if (status === "ON_TRIAL" || hasTrial) return "Free Trial";
  return "No active plan";
}

function resolveUpgradeAction(me: ReturnType<typeof useAppMe>["me"], spendableCredits: number) {
  const subscription = me?.subscription;

  if (subscription?.status === "ACTIVE" || subscription?.status === "ON_TRIAL") {
    return {
      label: "Manage plan",
      route: "/subscription",
    };
  }

  if (spendableCredits > 0) {
    return {
      label: "Open billing",
      route: "/credits",
    };
  }

  return {
    label: "Upgrade",
    route: "/subscription",
  };
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const clerk = useClerk();
  const { me } = useAppMe();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileSheet, setMobileSheet] = useState<null | "credit" | "profile">(null);
  const [creditPackIndex, setCreditPackIndex] = useState(1);
  const [packSlideDirection, setPackSlideDirection] = useState<"left" | "right">("right");
  const [pendingPackId, setPendingPackId] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const isWelcomePage = pathname === "/welcome";
  const activePage = pathnameToNav(pathname);

  const shellUser = useMemo(() => {
    const name = me?.firstName || user?.firstName || user?.fullName || "there";
    const credits = (me?.trial?.balance ?? 0) + (me?.subscription?.subscriptionCreditBalance ?? 0) + (me?.wallet?.balance ?? 0);
    const plan = resolvePlanLabel(me?.subscription?.status, me?.subscription?.variantName, me?.subscription?.productName, Boolean(me?.trial?.balance || me?.trial?.trialEndsAt));
    return { name, credits, plan };
  }, [me, user]);

  const upgradeAction = useMemo(() => resolveUpgradeAction(me, shellUser.credits), [me, shellUser.credits]);

  function handleNav(id: string) {
    router.push(navToRoute(id));
    setDrawerOpen(false);
    setMobileSheet(null);
  }

  function handleBottomAction(id: string) {
    if (id === "api") {
      setMobileSheet("credit");
      return;
    }

    if (id === "profile") {
      setMobileSheet("profile");
      return;
    }

    handleNav(id);
  }

  async function handleBuyPack(packId: string) {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/billing/checkout/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      const payload = await res.json();
      if (!res.ok || !payload?.success || !payload?.data?.checkoutUrl) {
        throw new Error(payload?.error || "Unable to start checkout.");
      }
      window.location.href = payload.data.checkoutUrl;
    } finally {
      setCheckoutLoading(false);
    }
  }

  if (isWelcomePage) {
    return <main className="p-0">{children}</main>;
  }

  return (
    <div className="flex min-h-svh overflow-hidden bg-bg">
      <DashboardSidebar activePage={activePage} onNav={handleNav} user={shellUser} />

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} activePage={activePage} onNav={handleNav} user={shellUser} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardHeader
          onHamburger={() => setDrawerOpen(true)}
          onUpgrade={() => router.push(upgradeAction.route)}
        />

        <main className="flex-1 overflow-y-auto pt-16 pb-20 lg:pb-8">{children}</main>
      </div>

      <BottomNav activePage={activePage} onNav={handleNav} onAction={handleBottomAction} />

      <MobileActionSheet
        open={mobileSheet === "credit"}
        anchor="credit"
        widthClass="w-[214px]"
        onClose={() => {
          setMobileSheet(null);
          window.setTimeout(() => {
            setPendingPackId(null);
            setCreditPackIndex(1);
          }, 220);
        }}
      >
        {(() => {
          const pack = CREDIT_PACKS[creditPackIndex] ?? CREDIT_PACKS[0];
          const canGoPrev = creditPackIndex > 0;
          const canGoNext = creditPackIndex < CREDIT_PACKS.length - 1;
          return (
            <div>
              <div className="flex items-center justify-between gap-1">
                <button
                  onClick={() => {
                    if (!canGoPrev) return;
                    setPackSlideDirection("left");
                    setCreditPackIndex((i) => Math.max(0, i - 1));
                  }}
                  disabled={!canGoPrev || checkoutLoading}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-surface2 text-text transition hover:bg-surface-hover disabled:opacity-40"
                  aria-label="Previous pack"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>

                <div className="min-w-0 flex-1 overflow-hidden text-center">
                  <div
                    key={`${pack.id}-${packSlideDirection}`}
                    className={packSlideDirection === "right" ? "animate-pack-slide-right" : "animate-pack-slide-left"}
                  >
                    <div className="text-[9px] uppercase tracking-[0.08em] text-text-dim">{pack.label} pack</div>
                    <div className="mt-0.5 text-[16px] font-bold tracking-[-0.03em] text-text">{pack.price}</div>
                    <div className="mt-1 text-[11px] font-semibold text-primary">You receive {pack.valueLabel}</div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!canGoNext) return;
                    setPackSlideDirection("right");
                    setCreditPackIndex((i) => Math.min(CREDIT_PACKS.length - 1, i + 1));
                  }}
                  disabled={!canGoNext || checkoutLoading}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-surface2 text-text transition hover:bg-surface-hover disabled:opacity-40"
                  aria-label="Next pack"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </div>

              <div className="mt-2 flex items-center justify-center gap-1.5">
                <button
                  onClick={() => {
                    setMobileSheet(null);
                    window.setTimeout(() => {
                      setPendingPackId(null);
                      setCreditPackIndex(1);
                    }, 220);
                    router.push(`/credits?pack=${pack.id}`);
                  }}
                  className="rounded-[10px] border border-border bg-surface px-2.5 py-1.5 text-[10px] font-semibold text-text"
                >
                  Go to wallet
                </button>
                <button
                  onClick={() => setPendingPackId(pack.id)}
                  className="rounded-[10px] bg-primary px-4 py-1.5 text-[10px] font-bold text-bg shadow-[0_0_18px_rgba(138,180,248,0.22)]"
                >
                  Buy
                </button>
              </div>
            </div>
          );
        })()}
      </MobileActionSheet>

      <MobileActionSheet
        open={mobileSheet === "profile"}
        anchor="profile"
        widthClass="w-[178px]"
        onClose={() => {
          setMobileSheet(null);
        }}
      >
        <div className="flex flex-col gap-0.5">
          {[
            {
              label: "Profile",
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21a8 8 0 0 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8" />
                </svg>
              ),
              onClick: () => {
                setMobileSheet(null);
                router.push("/profile");
              },
            },
            {
              label: "Subscription",
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7H14.5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              ),
              onClick: () => {
                setMobileSheet(null);
                router.push("/subscription");
              },
            },
            {
              label: "Messages",
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              ),
              onClick: () => {
                setMobileSheet(null);
                router.push("/messages");
              },
            },
            {
              label: "Settings",
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ),
              onClick: () => {
                setMobileSheet(null);
                router.push("/settings");
              },
            },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className="flex items-center gap-2.5 rounded-[12px] px-2.5 py-2 text-left text-[11.5px] font-medium text-text transition hover:bg-surface2"
            >
              <span className="flex items-center justify-center text-text-dim">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ))}

          <div className="mx-1 my-1 h-px bg-border" />
          <button
            onClick={() => {
              setMobileSheet(null);
              void clerk.signOut({ redirectUrl: process.env.NEXT_PUBLIC_GUEST_URL || "https://realvs.ai" });
            }}
            className="flex items-center gap-2.5 rounded-[12px] px-2.5 py-2 text-left text-[11.5px] font-medium text-[var(--color-danger)] transition hover:bg-[rgba(255,107,107,0.08)]"
          >
            <span className="flex items-center justify-center text-[var(--color-danger)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="M16 17l5-5-5-5" />
                <path d="M21 12H9" />
              </svg>
            </span>
            <span>Logout</span>
          </button>
        </div>
      </MobileActionSheet>

      {pendingPackId ? (
        <CheckoutConfirmModal
          title={`Buy ${(CREDIT_PACKS.find((pack) => pack.id === pendingPackId) ?? CREDIT_PACKS[0]).label} pack?`}
          description={`You’re about to continue to checkout for ${(CREDIT_PACKS.find((pack) => pack.id === pendingPackId) ?? CREDIT_PACKS[0]).price}.`}
          confirmLabel="Continue"
          loading={checkoutLoading}
          onClose={() => {
            if (checkoutLoading) return;
            setPendingPackId(null);
          }}
          onConfirm={() => void handleBuyPack(pendingPackId)}
        />
      ) : null}
    </div>
  );
}
