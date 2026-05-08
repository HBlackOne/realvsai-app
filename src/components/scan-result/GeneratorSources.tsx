"use client";

/**
 * GeneratorSources — pill grid of detected generators + a small deepfake
 * subsection. Header chip is tinted by the overall verdict.
 *
 * For an "authentic" result you typically wouldn't render this card at all —
 * gate it on the parent (e.g. `verdict !== "authentic"`) — but it still works.
 */

import type { Verdict } from "./VerdictBars";

export type Generator = { name: string; score: number };

type Props = {
  verdict: Verdict;
  /** confidence shown in the header chip (0–100) */
  headlinePercent: number;
  generators: Generator[];
  showMoreCount?: number;
  deepfakePercent: number;
  deepfakeNote: string;
  onShowMore?: () => void;
};

const HEADER_TOKENS: Record<Verdict, { color: string; rgb: string; label: string }> = {
  ai:        { color: "var(--color-danger)",  rgb: "255,92,92",  label: "AI-Generated" },
  authentic: { color: "var(--color-success)", rgb: "74,222,128", label: "Authentic"    },
  mixed:     { color: "var(--color-warning)", rgb: "245,158,11", label: "Mixed"        },
};

const SECTION_HEADER: Record<Verdict, string> = {
  ai:        "Generation Sources",
  authentic: "Possible Generators",
  mixed:     "Generation Signals",
};

export function GeneratorSources({
  verdict,
  headlinePercent,
  generators,
  showMoreCount = 0,
  deepfakePercent,
  deepfakeNote,
  onShowMore,
}: Props) {
  const t = HEADER_TOKENS[verdict];

  return (
    <div
      className="rounded-2xl p-[18px] mb-2.5"
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        animation: "scanResultUp 0.4s 0.1s ease both",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold" style={{ color: t.color }}>
          {SECTION_HEADER[verdict]}
        </span>
        <span
          className="rounded-full px-2.5 py-0.5 text-[12px] font-bold"
          style={{
            color: t.color,
            background: `rgba(${t.rgb},0.1)`,
            border: `1px solid rgba(${t.rgb},0.2)`,
            fontFamily: "var(--font-mono, 'Space Mono', monospace)",
          }}
        >
          {t.label} · {headlinePercent}%
        </span>
      </div>

      {/* Pills */}
      <div className="flex flex-wrap gap-1.5 mb-3.5">
        {generators.map((g, i) => {
          const isTop = i < 2;
          return (
            <div
              key={g.name}
              className="inline-flex items-center gap-[5px] rounded-full px-2.5 py-[5px] text-[11px]"
              style={{
                color: isTop ? "var(--color-text)" : "var(--color-text-muted)",
                background: isTop ? "rgba(138,180,248,0.08)" : "var(--color-surface2)",
                border: `1px solid ${isTop ? "rgba(138,180,248,0.2)" : "var(--color-border)"}`,
              }}
            >
              <span className="font-semibold">{g.name}</span>
              <span
                className="text-[10px]"
                style={{
                  color: "var(--color-primary)",
                  fontFamily: "var(--font-mono, 'Space Mono', monospace)",
                }}
              >
                {Math.round(g.score * 100)}%
              </span>
            </div>
          );
        })}

        {showMoreCount > 0 && (
          <button
            type="button"
            onClick={onShowMore}
            className="inline-flex items-center rounded-full px-2.5 py-[5px] text-[11px] font-semibold cursor-pointer"
            style={{
              color: "var(--color-primary)",
              background: "transparent",
              border: "1px dashed var(--color-border)",
              fontFamily: "inherit",
            }}
          >
            + {showMoreCount} more
          </button>
        )}
      </div>

      {/* Deepfake subsection */}
      <div className="pt-3" style={{ borderTop: "1px solid var(--color-border)" }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-bold" style={{ color: "var(--color-text-dim)" }}>
            Deepfake
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[11px]"
            style={{
              color: "var(--color-text-dim)",
              background: "var(--color-surface2)",
              border: "1px solid var(--color-border)",
              fontFamily: "var(--font-mono, 'Space Mono', monospace)",
            }}
          >
            {deepfakePercent}%
          </span>
        </div>
        <div className="mt-1 text-[11px]" style={{ color: "var(--color-text-dim)" }}>
          {deepfakeNote}
        </div>
      </div>
    </div>
  );
}
