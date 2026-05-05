"use client";

import { SkeletonText } from "@/components/ui/Skeleton";

interface UsageOverviewProps {
  scansUsed?: number;
  credits?: number;
  aiDetected?: number;
  realMedia?: number;
  planLabel?: string;
  usageText?: string;
  progressPercent?: number | null;
  loadingMe?: boolean;
}

export function UsageOverview({
  scansUsed = 0,
  credits = 10,
  aiDetected = 0,
  realMedia = 0,
  planLabel = "Free Trial",
  usageText = "Usage status available",
  progressPercent = null,
  loadingMe = false,
}: UsageOverviewProps) {
  const safeProgress = progressPercent === null ? null : Math.max(0, Math.min(100, Math.round(progressPercent)));

  return (
    <section className="rounded-[18px] border border-border/70 bg-surface p-3">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <div className="text-[18px] leading-none font-bold tracking-tight text-text">
            {loadingMe ? <SkeletonText className="h-4 w-12" /> : <>{credits} <span className="text-[13px] font-medium text-text-dim">credits left</span></>}
          </div>
          <div className="mt-1 text-[12px] text-text-dim">{loadingMe ? <SkeletonText className="h-4 w-36" /> : usageText}</div>
        </div>
        <div className="text-right">
          <div className="text-[12px] text-text-dim">{loadingMe ? <SkeletonText className="h-4 w-24" /> : planLabel}</div>
          {safeProgress !== null ? <span className="text-[12px] font-semibold text-primary">{safeProgress}%</span> : null}
        </div>
      </div>

      {safeProgress !== null ? (
        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-surface2">
          <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${safeProgress || 0}%` }} />
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Scans", val: scansUsed, color: "text-primary" },
          { label: "AI", val: aiDetected, color: "text-danger" },
          { label: "Real", val: realMedia, color: "text-success" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-[12px] border border-border bg-bg px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
            {loadingMe ? (
              <>
                <SkeletonText className="mb-1 h-6 w-8" />
                <SkeletonText className="h-3 w-12" />
              </>
            ) : (
              <>
                <div className={`text-[20px] leading-none font-bold tracking-tight ${stat.color}`}>{stat.val}</div>
                <div className="mt-1 text-[11px] leading-tight text-text-dim">{stat.label}</div>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
