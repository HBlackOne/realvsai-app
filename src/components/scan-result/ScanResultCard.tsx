"use client";

/**
 * ScanResultCard — full mobile-width result column.
 *
 * Verdict drives the visual tint of the headline card + sources header.
 * Pass `verdict: "ai" | "authentic" | "mixed"` (decide on the API side
 * or derive from headlinePercent — see helper at the bottom).
 */

import { VerdictBars, type Verdict } from "./VerdictBars";
import { GeneratorSources, type Generator } from "./GeneratorSources";
import { MetaGrid, type MetaItem } from "./MetaGrid";
import { ResultActions } from "./ResultActions";

export type { Verdict };

export type ScanResult = {
  /** Overall verdict — drives the color treatment */
  verdict: Verdict;
  /** Headline confidence percent (0–100) — meaning depends on verdict */
  headlinePercent: number;
  /** Deepfake confidence (0–100) */
  deepfakePercent: number;
  /** Short paragraph explaining the verdict */
  explanation: string;
  /** Detected generators, sorted descending by score */
  generators: Generator[];
  /** Number of generators behind the "+N more" pill (0 to hide) */
  moreGeneratorsCount?: number;
  /** Deepfake explainer line */
  deepfakeNote: string;
  /** Meta cells (credits used, processing, media type, status, …) */
  meta: MetaItem[];
};

type Props = {
  result: ScanResult;
  onScanAnother?: () => void;
  onViewHistory?: () => void;
  onShowMoreGenerators?: () => void;
};

/** Helper: derive a verdict from a single AI-confidence number */
export function verdictFromAiPercent(aiPercent: number): Verdict {
  if (aiPercent >= 70) return "ai";
  if (aiPercent <= 30) return "authentic";
  return "mixed";
}

export function ScanResultCard({
  result,
  onScanAnother,
  onViewHistory,
  onShowMoreGenerators,
}: Props) {
  return (
    <div className="w-full px-0 pt-2 pb-6">
      {/* Inline keyframes — keeps the handoff drop-in. Move to globals.css if preferred. */}
      <style jsx global>{`
        @keyframes scanResultUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scanResultBlink {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.3; }
        }
      `}</style>

      {/* Ready chip — stays green; signals "scan completed", not the verdict */}
      <div
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-[5px] mb-4 text-[11px] font-semibold"
        style={{
          color: "var(--color-success)",
          background: "rgba(74,222,128,0.08)",
          border: "1px solid rgba(74,222,128,0.2)",
        }}
      >
        <span
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{
            background: "var(--color-success)",
            animation: "scanResultBlink 1.6s ease-in-out infinite",
          }}
        />
        Result ready
      </div>

      <VerdictBars
        verdict={result.verdict}
        headlinePercent={result.headlinePercent}
        deepfakePercent={result.deepfakePercent}
        explanation={result.explanation}
      />

      <GeneratorSources
        verdict={result.verdict}
        headlinePercent={result.headlinePercent}
        generators={result.generators}
        showMoreCount={result.moreGeneratorsCount ?? 0}
        deepfakePercent={result.deepfakePercent}
        deepfakeNote={result.deepfakeNote}
        onShowMore={onShowMoreGenerators}
      />

      <MetaGrid items={result.meta} />

      <ResultActions onScanAnother={onScanAnother} onViewHistory={onViewHistory} />
    </div>
  );
}
