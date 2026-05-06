import { CheckCircle2, Clock3, LoaderCircle, ScanLine, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { AppButton, appButtonStyles } from "@/components/app-shell/AppButton";
import ScanUpsellBlock from "./ScanUpsellBlock";
import { PreviewStat, ScoreBar } from "./shared";
import type { MediaType, ScanResult, ScanStage } from "./types";
import type { ScanUpsellState } from "./scan-upsell";

export default function ResultPanel({
  stage,
  result,
  activeTab,
  upsell,
  onReset,
}: {
  stage: ScanStage;
  result: ScanResult | null;
  activeTab: MediaType;
  upsell: ScanUpsellState | null;
  onReset: () => void;
}) {
  if (stage === "uploading" || stage === "scanning") {
    const title = stage === "uploading" ? "Uploading file..." : "Analyzing with AI...";
    const description = stage === "uploading" ? "Securely preparing your media..." : "Building authenticity signals...";

    return (
      <div className="pt-1">
        <div className="rounded-2xl bg-surface p-4">
          <div className="min-h-[18rem] rounded-2xl border border-border p-5 text-center sm:p-6">
            <LoaderCircle className="mx-auto h-7 w-7 animate-spin text-primary" />
            <h3 className="mt-4 text-base font-semibold text-text">{title}</h3>
            <p className="mt-2 text-sm text-text-muted">{description}</p>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <SummaryChip label="Stage" value={stage === "uploading" ? "Uploading" : "Processing"} />
              <SummaryChip label="Checks" value="Authenticity" />
              <SummaryChip label="Time" value="5–20 sec" />
            </div>

            <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (stage === "result" && result) {
    const verdictTone =
      result.verdict === "AI Generated"
        ? "text-danger border-danger/20 bg-danger/10"
        : result.verdict === "Authentic"
          ? "text-success border-success/20 bg-success/10"
          : "text-warning border-warning/20 bg-warning/10";

    return (
      <div className="pt-1">
        <div className="rounded-2xl bg-surface p-4">
          <div className="min-h-[18rem] rounded-2xl border border-border p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-text">Result ready</h3>
                <p className="mt-1 truncate text-xs text-text-muted">Source: {result.sourceLabel}</p>
              </div>
              <span className={`shrink-0 rounded-full border px-3.5 py-1 text-xs font-medium ${verdictTone}`}>
                {result.verdict}
              </span>
            </div>

            <div className="mt-4 grid gap-2.5 sm:grid-cols-[1fr_1fr]">
              <div className="rounded-xl border border-border px-4 py-3.5">
                <p className="text-xs text-text-muted">Confidence</p>
                <div className="mt-2 flex items-end gap-2">
                  <p className="text-3xl font-semibold text-primary">{result.confidence}%</p>
                  <span className="pb-1 text-xs text-text-dim">confidence</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-hover">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${result.confidence}%` }} />
                </div>
              </div>

              <div className="rounded-xl border border-border px-4 py-3.5">
                <p className="text-xs text-text-muted">Explanation</p>
                <p className="mt-2 text-sm leading-6 text-text-muted">{result.explanation}</p>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-border px-4 py-3.5">
              <p className="text-xs text-text-muted">Signal breakdown</p>
              <div className="mt-3 space-y-3">
                <ScoreBar label="AI Generated" score={result.aiScore} color="bg-danger" />
                <ScoreBar label="Authentic" score={result.humanScore} color="bg-success" />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
              <SummaryChip label="Processing" value={result.processingTime} />
              <SummaryChip label="Credits used" value={`${result.creditsUsed}`} />
              <SummaryChip label="Media type" value={activeTab} />
              <SummaryChip label="Status" value="Completed" />
            </div>

            <div className="mt-3 rounded-xl border border-border px-4 py-3.5">
              <p className="text-xs text-text-muted">Generator detection</p>
              <div className="mt-3 space-y-2.5">
                {result.generators.map((gen) => (
                  <div key={gen.name} className="rounded-xl border border-border px-3 py-3">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate text-text">{gen.name}</span>
                      <span className="shrink-0 text-text-muted">{(gen.score * 100).toFixed(0)}%</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-hover">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${gen.score * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {upsell ? <ScanUpsellBlock upsell={upsell} /> : null}

            <div className="mt-4 border-t border-border pt-3.5 space-y-3">
              <AppButton onClick={onReset} variant="primary" size="lg" fullWidth>
                Scan another
              </AppButton>
              <div className="grid gap-3 sm:grid-cols-2">
                <Link href="/history" className={appButtonStyles({ variant: "secondary", size: "md", fullWidth: true })}>
                  View history
                </Link>
                <AppButton variant="ghost" size="md" fullWidth disabled>
                  Download (soon)
                </AppButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-1">
      <div className="rounded-2xl bg-surface p-4">
        <div className="min-h-[17rem] rounded-2xl border border-dashed border-border p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-dim">
            <ScanLine className="h-6 w-6 text-primary" />
          </div>
          <h3 className="mt-3 text-sm font-semibold">Analyze your first file</h3>
          <p className="mt-2 text-sm text-text-muted">Upload a file or paste a media link to analyze.</p>
        </div>

        <div className="mt-3 grid gap-2.5 opacity-85 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
          <PreviewStat icon={Clock3} label="Speed" value="Fast perception" />
          <PreviewStat icon={ShieldCheck} label="Verdict" value="Authentic / AI / Mixed" />
          <PreviewStat icon={CheckCircle2} label="Output" value="Confidence + summary" />
        </div>
      </div>
    </div>
  );
}

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border px-3 py-2">
      <p className="text-[11px] text-text-muted">{label}</p>
      <p className="mt-1 text-sm font-medium text-text">{value}</p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border px-4 py-3.5">
      <div className="h-3 w-24 rounded-full bg-surface-hover" />
      <div className="mt-3 h-6 w-28 rounded-full bg-surface-hover" />
      <div className="mt-3 space-y-2">
        <div className="h-2 w-full rounded-full bg-surface-hover" />
        <div className="h-2 w-5/6 rounded-full bg-surface-hover" />
      </div>
    </div>
  );
}
