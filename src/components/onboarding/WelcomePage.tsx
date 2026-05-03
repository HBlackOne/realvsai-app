"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useAppMe } from "@/hooks/use-app-me";
import { useCheckout } from "@/hooks/use-checkout";
import { OnboardingWizard } from "./OnboardingWizard";

export function WelcomePage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { me, loading } = useAppMe();
  const { openCheckout, loading: checkoutLoading } = useCheckout();

  useEffect(() => {
    if (!loading && me?.onboardingComplete) {
      router.replace("/dashboard");
    }
  }, [loading, me?.onboardingComplete, router]);

  if (!isLoaded) {
    return <WelcomeLoadingScreen label="Loading your secure session..." />;
  }

  if (loading) {
    return <WelcomeLoadingScreen label="Preparing your onboarding..." />;
  }

  if (me?.onboardingComplete) {
    return <WelcomeLoadingScreen label="Opening your dashboard..." />;
  }

  const rawFirstName = me?.firstName || user?.firstName || "there";
  const userName = /^[\p{L}][\p{L}\p{M}' -]{0,40}$/u.test(rawFirstName.trim()) ? rawFirstName.trim() : "there";

  const handleStartTrial = async () => {
    await openCheckout(async () => {
      const res = await fetch("/api/billing/checkout/trial", { method: "POST" });
      const payload = await res.json();
      if (!res.ok || !payload?.success || !payload?.data?.checkoutUrl) {
        throw new Error(payload?.error || "Unable to start trial checkout.");
      }
      await fetch("/api/onboarding/complete", { method: "POST" });
      return payload.data.checkoutUrl;
    });
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-bg px-5 py-12 text-text">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(138,180,248,0.06)_0%,transparent_70%)]" />

      <div className="relative w-full max-w-[520px]">
        <div
          className="mb-9 flex justify-center"
          style={{ animation: "heroFadeUp 560ms ease-out forwards", opacity: 0 }}
        >
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-primary">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-bg)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <span className="text-[18px] font-bold tracking-[-0.03em] text-text">
              realvs<span className="text-primary">.</span>ai
            </span>
          </div>
        </div>

        <div
          className="mb-9 text-center"
          style={{ animation: "heroFadeUp 560ms 80ms ease-out forwards", opacity: 0 }}
        >
          <div className="mb-[18px] inline-flex items-center gap-[7px] rounded-full border border-border bg-surface px-[13px] py-1 text-[11.5px] text-text-muted">
            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-success animate-[pulse_2s_ease-in-out_infinite]" />
            Account created · Welcome aboard
          </div>

          <h1 className="mb-3 font-extrabold leading-[1.1] tracking-[-0.04em]" style={{ fontSize: "clamp(1.8rem,5vw,2.6rem)" }}>
            Welcome to RealvsAI,
            <br />
            <span className="text-primary">{userName}.</span>
          </h1>

          <p className="mx-auto max-w-[400px] text-[15px] leading-[1.7] text-text-muted">
            Before you dive in, here&apos;s a quick look at how RealvsAI works — three steps, under a minute.
          </p>
        </div>

        <div style={{ animation: "heroFadeUp 560ms 160ms ease-out forwards", opacity: 0 }}>
          <OnboardingWizard
            earlyAccessEligible={me?.earlyAccessEligible ?? false}
            onStartTrial={handleStartTrial}
            trialLoading={checkoutLoading}
          />
        </div>
      </div>
    </div>
  );
}

function WelcomeLoadingScreen({ label }: { label: string }) {
  return (
    <div className="mx-auto flex min-h-[72vh] w-full max-w-3xl items-center justify-center px-4 py-12 sm:px-6">
      <div className="flex max-w-2xl flex-col items-center text-center">
        <h1 className="text-lg font-semibold text-text sm:text-xl">
          Please wait a bit while we set things up for you
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-text-muted">{label}</p>

        <div className="mt-6 flex items-center gap-2">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary [animation-delay:0ms]" />
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary/80 [animation-delay:180ms]" />
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary/60 [animation-delay:360ms]" />
        </div>
      </div>
    </div>
  );
}
