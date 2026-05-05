"use client";

import { useState, useCallback } from "react";
import { ArrowLeft, ArrowRight, Upload, ShieldCheck, ClipboardCheck, CheckCircle2 } from "lucide-react";
import { SmartButton } from "@/components/ui/SmartButton";
import { SkeletonText } from "@/components/ui/Skeleton";

type Step = {
  num: string;
  label: string;
  Icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  desc: string;
  bullets: string[];
};

const STEPS: Step[] = [
  {
    num: "01",
    label: "Upload media",
    Icon: Upload,
    iconColor: "text-primary",
    iconBg: "bg-primary-dim",
    title: "Drop in any file — image, audio, or video",
    desc: "RealvsAI accepts images (PNG, JPG, WEBP), audio (MP3, WAV, M4A), and video (MP4, MOV, WEBM). You can also paste a direct URL or a YouTube / Twitter link.",
    bullets: [
      "Up to 200 MB per file",
      "Three media types supported",
      "Paste a URL instead of uploading",
    ],
  },
  {
    num: "02",
    label: "Analyze instantly",
    Icon: ShieldCheck,
    iconColor: "text-warning",
    iconBg: "bg-[rgba(253,214,99,0.09)]",
    title: "Our pipeline scans it in under 2 seconds",
    desc: "We run your media through visual pattern analysis, generator fingerprinting, metadata inspection, and compression artifact detection — all in parallel.",
    bullets: [
      "< 2 s average analysis time",
      "90+ known AI generators detected",
      "No setup or configuration needed",
    ],
  },
  {
    num: "03",
    label: "Read the verdict",
    Icon: ClipboardCheck,
    iconColor: "text-success",
    iconBg: "bg-[rgba(129,201,149,0.09)]",
    title: "A clear confidence signal, not just a score",
    desc: "You'll see a verdict (Real / AI Generated / Mixed), a confidence percentage, the likely generator breakdown, and a short readable explanation of what we found.",
    bullets: [
      "Verdict + confidence score",
      "Generator attribution breakdown",
      "Plain-language explanation",
    ],
  },
];

const TOTAL = STEPS.length;

function StepProgress({ step }: { step: number }) {
  return (
    <div className="mb-5 flex items-center">
      {STEPS.map((s, i) => {
        const done = i < step || step === TOTAL;
        const active = i === step;
        return (
          <div
            key={s.num}
            className="flex items-center"
            style={{ flex: i < STEPS.length - 1 ? "1" : "none" }}
          >
            <div className="flex flex-col items-center gap-[5px]">
              <div
                className={`flex h-[26px] w-[26px] items-center justify-center rounded-full border-[1.5px] transition-all duration-300 ${
                  done
                    ? "border-success bg-success"
                    : active
                      ? "border-primary bg-primary-dim"
                      : "border-border bg-surface-hover"
                }`}
              >
                {done ? (
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--color-bg)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m20 6-11 11-5-5" />
                  </svg>
                ) : (
                  <span
                    className={`font-mono text-[9.5px] font-semibold ${
                      active ? "text-primary" : "text-text-dim"
                    }`}
                  >
                    {s.num}
                  </span>
                )}
              </div>
              <span
                className={`whitespace-nowrap text-[10px] transition-colors duration-300 ${
                  active
                    ? "font-semibold text-text"
                    : done
                      ? "text-text-muted"
                      : "text-text-dim"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="mx-[5px] mb-5 h-[1.5px] flex-1 transition-all duration-400"
                style={{
                  background: i < step ? "var(--color-success)" : "var(--color-border)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepCard({
  s,
  step,
  onBack,
  onNext,
}: {
  s: Step;
  step: number;
  onBack: () => void;
  onNext: () => void;
}) {
  const { Icon } = s;
  return (
    <>
      <div className="mb-4 flex items-start gap-3.5">
        <div
          className={`flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-[13px] ${s.iconBg}`}
        >
          <Icon className={`h-[18px] w-[18px] ${s.iconColor}`} />
        </div>
        <div>
          <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-text-dim">
            Step {s.num} of {TOTAL}
          </p>
          <h3 className="text-[16px] font-bold leading-[1.3] tracking-[-0.025em] text-text">
            {s.title}
          </h3>
        </div>
      </div>

      <p className="mb-4 text-[13px] leading-[1.7] text-text-muted">{s.desc}</p>

      <ul className="mb-auto flex flex-col gap-[7px]">
        {s.bullets.map((b) => (
          <li key={b} className="flex items-center gap-[9px]">
            <span className="h-[5px] w-[5px] flex-shrink-0 rounded-full bg-primary opacity-70" />
            <span className="text-[12px] text-text-muted">{b}</span>
          </li>
        ))}
      </ul>

      <div className="mt-[22px] flex items-center justify-between border-t border-border-subtle pt-[18px]">
        <button
          onClick={onBack}
          disabled={step === 0}
          className={`flex cursor-pointer items-center gap-[5px] border-none bg-transparent py-[5px] text-[12.5px] font-medium transition-colors duration-150 ${
            step === 0
              ? "cursor-default text-border"
              : "text-text-muted hover:text-text"
          }`}
        >
          <ArrowLeft className="h-[13px] w-[13px]" />
          Back
        </button>

        <button
          onClick={onNext}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border-none bg-primary px-[18px] py-2 text-[13px] font-semibold text-bg transition-colors duration-150 hover:bg-primary-hover"
        >
          {step === TOTAL - 1 ? "See my options" : "Next"}
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </>
  );
}

function FinalCard({
  onBack,
  onMaybeLater,
  onStartTrial,
  earlyAccessEligible,
  loadingMe,
}: {
  onBack: () => void;
  onMaybeLater: () => Promise<void>;
  onStartTrial: () => Promise<void>;
  earlyAccessEligible: boolean;
  loadingMe: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-2 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[15px] border border-primary/20 bg-primary-dim">
        <CheckCircle2 className="h-5 w-5 text-primary" />
      </div>

      <h3 className="mb-2 text-[18px] font-extrabold leading-[1.2] tracking-[-0.03em] text-text">
        You&apos;re ready to start.
      </h3>
      <p className="mb-[22px] max-w-[280px] text-[13px] leading-[1.7] text-text-muted">
        Unlock your scans now. A card is required to activate your trial, and you can
        cancel anytime before renewal.
      </p>

      <div className={`mb-[14px] inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] ${earlyAccessEligible ? "border-primary/25 bg-primary-dim font-medium text-primary" : "border-border bg-surface text-text-muted"}`}>
        {loadingMe ? (
          <SkeletonText className="h-4 w-48" />
        ) : earlyAccessEligible ? (
          <>
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Early Access Rate — $9.99/mo after trial
          </>
        ) : (
          <>Standard Rate — $14.99/mo after trial</>
        )}
      </div>

      <div className="flex w-full max-w-[260px] flex-col gap-[9px]">
        <SmartButton
          label="Start Free Trial"
          loadingLabel="Preparing checkout..."
          successLabel="Opening checkout..."
          variant="primary"
          onClick={onStartTrial}
          persistentSuccess
        />

        <SmartButton
          label="Maybe Later"
          loadingLabel="Just a moment..."
          variant="ghost"
          onClick={onMaybeLater}
        />
      </div>

      <p className="mt-3.5 text-[11px] text-text-dim">
        Card required to activate · Cancel anytime before renewal
      </p>

      <button
        onClick={onBack}
        className="mt-4 cursor-pointer border-none bg-transparent text-[11.5px] text-text-dim transition-colors hover:text-text-muted"
      >
        ← Back
      </button>
    </div>
  );
}

export function OnboardingWizard({
  earlyAccessEligible,
  loadingMe = false,
  onStartTrial,
  trialLoading,
}: {
  earlyAccessEligible: boolean;
  loadingMe?: boolean;
  onStartTrial: () => Promise<void>;
  trialLoading: boolean;
}) {
  const [step, setStep] = useState(0);

  const goTo = useCallback((n: number) => {
    setStep(n);
  }, []);

  const cur = step < TOTAL ? STEPS[step] : null;

  return (
    <div className="w-full">
      <StepProgress step={step} />

      <div
        key={step}
        className="flex min-h-[260px] flex-col rounded-[20px] border border-border bg-surface p-[26px] animate-[fadeSlideIn_220ms_ease]"
      >
        {cur ? (
          <StepCard
            s={cur}
            step={step}
            onBack={() => goTo(step - 1)}
            onNext={() => goTo(step + 1)}
          />
        ) : (
          <FinalCard
            onBack={() => goTo(step - 1)}
            onMaybeLater={async () => {
              await fetch("/api/onboarding/complete", { method: "POST" });
              window.location.href = "/dashboard";
            }}
            onStartTrial={onStartTrial}
            earlyAccessEligible={earlyAccessEligible}
            loadingMe={loadingMe}
          />
        )}
      </div>
    </div>
  );
}
