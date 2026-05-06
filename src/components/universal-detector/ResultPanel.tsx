"use client";

import { CheckCircle2, Clock3, LoaderCircle, ScanLine, ShieldCheck } from "lucide-react";
import {
  ScanResultCard,
  type ScanResult as ScanResultCardData,
  type Verdict,
} from "@/components/scan-result/ScanResultCard";
import ScanUpsellBlock from "./ScanUpsellBlock";
import { PreviewStat } from "./shared";
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
    const scanResultCard = toScanResultCardData(result, activeTab);

    return (
      <div className="pt-1">
        <div className="rounded-2xl bg-surface p-4">
          <ScanResultCard
            result={scanResultCard}
            onScanAnother={onReset}
            onViewHistory={() => {
              window.location.href = "/history";
            }}
            onShowMoreGenerators={() => {}}
          />
          {upsell ? (
            <div className="mx-auto mt-3 max-w-[420px] px-4">
              <ScanUpsellBlock upsell={upsell} />
            </div>
          ) : null}
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

function toPercent(score: number | undefined, fallback = 0) {
  if (typeof score !== "number" || !Number.isFinite(score)) return fallback;
  return Math.round(Math.max(0, Math.min(1, score)) * 100);
}

function getResultVerdict(result: ScanResult): Verdict {
  if (String(result.verdict).startsWith("AI Generated")) return "ai";
  if (String(result.verdict).startsWith("Authentic")) return "authentic";
  return "mixed";
}

function getHeadlinePercent(result: ScanResult, verdict: Verdict) {
  if (verdict === "ai") return toPercent(result.aiScore, result.confidence);
  if (verdict === "authentic") return toPercent(result.humanScore, result.confidence);
  return result.confidence;
}

function getMediaTypeLabel(activeTab: MediaType) {
  if (activeTab === "image") return "Image";
  if (activeTab === "audio") return "Audio";
  if (activeTab === "video-deep") return "Deep video";
  return "Video";
}

function getDeepfakeNote(deepfakePercent: number, activeTab: MediaType) {
  if (activeTab === "image" || activeTab === "audio") {
    return "Deepfake analysis applies to video and face manipulation signals.";
  }

  if (deepfakePercent >= 50) {
    return "Potential face manipulation signals detected.";
  }

  return "No significant face manipulation detected.";
}

function toScanResultCardData(
  result: ScanResult,
  activeTab: MediaType,
): ScanResultCardData {
  const verdict = getResultVerdict(result);
  const headlinePercent = getHeadlinePercent(result, verdict);
  const deepfakePercent = toPercent(result.deepfakeScore);
  const generators = result.generators.slice(0, 5);
  const moreGeneratorsCount = Math.max(result.generators.length - generators.length, 0);

  return {
    verdict,
    headlinePercent,
    deepfakePercent,
    explanation: result.explanation,
    generators,
    moreGeneratorsCount,
    deepfakeNote: getDeepfakeNote(deepfakePercent, activeTab),
    meta: [
      { key: "Credits used", value: `${result.creditsUsed} cr` },
      { key: "Processing", value: result.processingTime },
      { key: "Media type", value: getMediaTypeLabel(activeTab) },
      { key: "Status", value: "Completed", success: true },
    ],
  };
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
