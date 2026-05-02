"use client";

import { ScanThumbnail } from "./ScanThumbnail";
import { DownloadMenu } from "./DownloadMenu";

export type MediaType = "IMAGE" | "VIDEO" | "AUDIO";
export type ScanStatus = "COMPLETED" | "FAILED" | "PENDING" | "PROCESSING" | "CANCELED";
export type InputType = "FILE" | "URL";

export interface Scan {
  id: string;
  mediaType: MediaType;
  inputType: InputType;
  status: ScanStatus;
  sourceLabel: string;
  costCredits: number;
  verdict: string | null;
  confidence: number | null;
  errorMessage: string | null;
  createdAt: string;
  seed: number;
}

interface ScanRowProps {
  scan: Scan;
  idx: number;
  selected: boolean;
  onSelect: (val: boolean) => void;
  anySelected: boolean;
}

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
}

function Checkbox({ checked, indeterminate, onChange }: { checked: boolean; indeterminate?: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
      className="flex items-center justify-center w-[17px] h-[17px] rounded-[5px] flex-shrink-0 cursor-pointer transition-all"
      style={{
        border: `1.5px solid ${indeterminate && !checked ? "var(--color-primary)" : checked ? "var(--color-primary)" : "var(--color-border)"}`,
        background: checked || indeterminate ? "var(--color-primary)" : "var(--color-surface3)",
      }}
    >
      {indeterminate && !checked ? (
        <svg width="9" height="2" viewBox="0 0 9 2"><rect width="9" height="2" rx="1" fill="var(--color-bg)" /></svg>
      ) : checked ? (
        <svg width="10" height="8" viewBox="0 0 10 8">
          <polyline points="1 4 4 7 9 1" fill="none" stroke="var(--color-bg)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </div>
  );
}

export function ScanRow({ scan, idx, selected, onSelect, anySelected }: ScanRowProps) {
  const statusTone =
    scan.status === "COMPLETED"
      ? { bg: "rgba(95,204,138,.1)", border: "rgba(95,204,138,.18)", color: "var(--color-success)" }
      : scan.status === "FAILED" || scan.status === "CANCELED"
      ? { bg: "rgba(255,107,107,.1)", border: "rgba(255,107,107,.18)", color: "var(--color-danger)" }
      : { bg: "rgba(126,170,255,0.09)", border: "rgba(126,170,255,.2)", color: "var(--color-primary)" };

  const verdictColor =
    scan.verdict === "AI Generated" ? "var(--color-danger)"
    : scan.verdict === "Authentic"  ? "var(--color-success)"
    : scan.verdict === "Mixed"      ? "var(--color-warning)"
    : "var(--color-text-dim)";

  return (
    <div
      onClick={() => onSelect(!selected)}
      className="flex items-start gap-3.5 px-4 py-[15px] rounded-[12px] mb-[3px] cursor-pointer transition-colors"
      style={{
        background: selected ? "rgba(126,170,255,0.04)" : "transparent",
        animationDelay: `${Math.min(idx * 0.045, 0.35)}s`,
      }}
    >
      <div className="relative flex-shrink-0" onClick={(e) => { e.stopPropagation(); onSelect(!selected); }}>
        <ScanThumbnail mediaType={scan.mediaType} seed={scan.seed} selected={selected} status={scan.status} />
        <div
          className="absolute top-[5px] left-[5px] transition-opacity"
          style={{ opacity: anySelected || selected ? 1 : 0 }}
          onClick={(e) => { e.stopPropagation(); onSelect(!selected); }}
        >
          <Checkbox checked={selected} onChange={onSelect} />
        </div>
        {selected && (
          <div className="absolute inset-0 rounded-[10px] pointer-events-none" style={{ background: "rgba(126,170,255,0.12)" }} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-[5px] mb-[8px]">
          <span
            className="text-[10.5px] font-semibold rounded-[6px] px-2 py-0.5"
            style={{ background: statusTone.bg, border: `1px solid ${statusTone.border}`, color: statusTone.color }}
          >
            {scan.status}
          </span>
          <span
            className="text-[10.5px] font-medium rounded-[6px] px-2 py-0.5"
            style={{ background: "var(--color-surface3)", border: "1px solid var(--color-border-subtle)", color: "var(--color-text-dim)" }}
          >
            {scan.inputType === "FILE" ? "File upload" : "URL"}
          </span>
          <span
            className="text-[10.5px] font-medium rounded-[6px] px-2 py-0.5 font-mono"
            style={{ background: "var(--color-surface3)", border: "1px solid var(--color-border-subtle)", color: "var(--color-text-dim)" }}
          >
            {scan.costCredits} cr
          </span>
        </div>

        <p className="text-[14px] font-semibold truncate mb-[4px] tracking-tight" style={{ color: "var(--color-text)" }}>
          {scan.sourceLabel}
        </p>

        <p className="text-[11px] font-mono mb-[9px]" style={{ color: "var(--color-text-dim)" }}>
          {fmtDate(scan.createdAt)}
        </p>

        {scan.status === "COMPLETED" && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px]">
            <span style={{ color: "var(--color-text-muted)" }}>
              Verdict: <span style={{ color: verdictColor, fontWeight: 700 }}>{scan.verdict ?? "—"}</span>
            </span>
            <span style={{ color: "var(--color-text-muted)" }}>
              Confidence: <span className="font-semibold font-mono" style={{ color: "var(--color-text)" }}>
                {scan.confidence !== null ? `${scan.confidence}%` : "—"}
              </span>
            </span>
          </div>
        )}

        {(scan.status === "PENDING" || scan.status === "PROCESSING") && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px]">
            <span style={{ color: "var(--color-text-muted)" }}>
              Result: <span style={{ color: "var(--color-primary)", fontWeight: 700 }}>{scan.status === "PROCESSING" ? "Processing now" : "Waiting to start"}</span>
            </span>
          </div>
        )}

        {scan.errorMessage && (
          <div
            className="mt-[10px] flex items-center gap-1.5 text-[11.5px] rounded-[8px] px-2.5 py-[5px]"
            style={{
              color: "var(--color-danger)",
              background: "rgba(255,107,107,.1)",
              border: "1px solid rgba(255,107,107,.2)",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3" />
            </svg>
            {scan.errorMessage}
          </div>
        )}
      </div>

      <DownloadMenu scanId={scan.id} />
    </div>
  );
}

export function ScanRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-[14px] mb-[3px]">
      <div className="w-[72px] h-[56px] rounded-[10px] flex-shrink-0 animate-pulse" style={{ background: "var(--color-surface3)" }} />
      <div className="flex-1">
        <div className="flex gap-[5px] mb-2">
          <div className="h-[18px] w-[70px] rounded-[6px] animate-pulse" style={{ background: "var(--color-surface3)" }} />
          <div className="h-[18px] w-[60px] rounded-[6px] animate-pulse" style={{ background: "var(--color-surface3)" }} />
        </div>
        <div className="h-[14px] w-1/2 rounded-[5px] mb-1.5 animate-pulse" style={{ background: "var(--color-surface3)" }} />
        <div className="h-[10px] w-[110px] rounded-[4px] mb-2 animate-pulse" style={{ background: "var(--color-surface3)" }} />
        <div className="flex gap-3">
          <div className="h-[10px] w-[80px] rounded-[4px] animate-pulse" style={{ background: "var(--color-surface3)" }} />
          <div className="h-[10px] w-[70px] rounded-[4px] animate-pulse" style={{ background: "var(--color-surface3)" }} />
        </div>
      </div>
    </div>
  );
}
