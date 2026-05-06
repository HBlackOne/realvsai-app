"use client";

/**
 * VerdictBars — large headline verdict row + smaller deepfake row,
 * tinted by the overall verdict (ai / authentic / mixed).
 *
 * Props:
 *   - verdict          "ai" | "authentic" | "mixed" — drives card tint + headline row
 *   - headlinePercent  (0–100)  confidence for the headline row
 *   - deepfakePercent  (0–100)  deepfake confidence (always shown as secondary row)
 *   - explanation      string   short paragraph under the bars
 */

export type Verdict = "ai" | "authentic" | "mixed";

type Props = {
  verdict: Verdict;
  headlinePercent: number;
  deepfakePercent: number;
  explanation: string;
};

const VERDICT_TOKENS: Record<
  Verdict,
  { color: string; rgb: string; badge: string; sublabel: string }
> = {
  ai: {
    color: "var(--color-danger)",
    rgb: "255,92,92",
    badge: "AI Generated",
    sublabel: "Likely to be synthetic",
  },
  authentic: {
    color: "var(--color-success)",
    rgb: "74,222,128",
    badge: "Authentic",
    sublabel: "Likely human-made",
  },
  mixed: {
    color: "var(--color-warning)",
    rgb: "245,158,11",
    badge: "Mixed Signals",
    sublabel: "Inconclusive — review needed",
  },
};

function VerdictRow({
  pct,
  badge,
  sublabel,
  color,
  rgb,
  emphasised,
}: {
  pct: number;
  badge: string;
  sublabel: string;
  color: string;
  rgb: string;
  emphasised: boolean;
}) {
  // Emphasised row uses the verdict color; secondary rows are neutral grey.
  const fill   = emphasised ? `rgba(${rgb},0.12)` : "rgba(107,107,136,0.06)";
  const bg     = emphasised ? `rgba(${rgb},0.08)` : "rgba(107,107,136,0.06)";
  const border = emphasised ? `rgba(${rgb},0.15)` : "var(--color-border)";
  const fg     = emphasised ? color              : "var(--color-text-dim)";

  return (
    <div
      className="relative overflow-hidden rounded-[12px] flex items-center justify-between gap-3 px-4 py-[14px] mb-2"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      <div
        className="absolute top-0 bottom-0 left-0 rounded-[12px] pointer-events-none"
        style={{
          width: `${Math.max(0, Math.min(100, pct))}%`,
          background: fill,
          transition: "width 1s cubic-bezier(0.16,1,0.3,1)",
        }}
      />
      <div className="relative z-[1]">
        <div
          className="font-bold leading-none"
          style={{
            fontFamily: "var(--font-mono, 'Space Mono', monospace)",
            fontSize: 22,
            color: fg,
          }}
        >
          {pct}%
        </div>
        <div className="mt-0.5 text-[10px]" style={{ color: "var(--color-text-dim)" }}>
          confidence
        </div>
      </div>
      <div className="relative z-[1] text-right">
        <span className="block text-[12px] font-bold" style={{ color: fg }}>
          {badge}
        </span>
        <span className="block mt-0.5 text-[10px]" style={{ color: "var(--color-text-dim)" }}>
          {sublabel}
        </span>
      </div>
    </div>
  );
}

export function VerdictBars({
  verdict,
  headlinePercent,
  deepfakePercent,
  explanation,
}: Props) {
  const tokens = VERDICT_TOKENS[verdict];

  return (
    <div
      className="relative overflow-hidden rounded-[18px] p-[18px] mb-2.5"
      style={{
        border: `1px solid rgba(${tokens.rgb},0.2)`,
        background: `linear-gradient(135deg, rgba(${tokens.rgb},0.07) 0%, var(--color-surface) 55%)`,
        animation: "scanResultUp 0.4s ease both",
      }}
    >
      {/* Top accent line — tinted by verdict */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, rgba(${tokens.rgb},0.5), transparent)`,
        }}
      />

      <div className="text-[11px] font-medium mb-3" style={{ color: "var(--color-text-dim)" }}>
        This media is
      </div>

      <VerdictRow
        pct={headlinePercent}
        badge={tokens.badge}
        sublabel={tokens.sublabel}
        color={tokens.color}
        rgb={tokens.rgb}
        emphasised
      />
      <VerdictRow
        pct={deepfakePercent}
        badge="Deepfake"
        sublabel="Face manipulation"
        color="var(--color-text-dim)"
        rgb="107,107,136"
        emphasised={false}
      />

      <div
        className="mt-3 pt-3 text-[12px] leading-[1.65]"
        style={{
          color: "var(--color-text-muted)",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        {explanation}
      </div>
    </div>
  );
}
