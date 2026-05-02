"use client";

import Link from "next/link";

export type ScanStatus = "AI" | "Real" | "Processing";

export interface Scan {
  id: string | number;
  name: string;
  type: "Image" | "Audio" | "Video";
  date: string;
  status: ScanStatus;
  confidence: number | null;
}

const TYPE_ICON: Record<string, string> = {
  Image: "M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2 1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2",
  Audio: "M19 11a7 7 0 0 1-7 7m0 0a7 7 0 0 1-7-7m7 7v4m0 0H8m4 0h4M12 3a4 4 0 0 0-4 4v4a4 4 0 0 0 8 0V7a4 4 0 0 0-4-4",
  Video: "M15 10l4.553-2.07A1 1 0 0 1 21 8.845v6.31a1 1 0 0 1-1.447.916L15 14M3 8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8",
};

const STATUS_STYLE: Record<ScanStatus, { color: string; bg: string; border: string; label: string; pulse?: boolean }> = {
  AI: { color: "text-danger", bg: "bg-danger/10", border: "border-danger/25", label: "AI" },
  Real: { color: "text-success", bg: "bg-success/10", border: "border-success/25", label: "Real" },
  Processing: { color: "text-warning", bg: "bg-warning/10", border: "border-warning/25", label: "Processing", pulse: true },
};

const TYPE_COLOR: Record<string, string> = {
  Image: "var(--color-primary)",
  Audio: "var(--color-warning)",
  Video: "var(--color-danger)",
};

interface RecentScansProps {
  scans?: Scan[];
}

export function RecentScans({ scans = [] }: RecentScansProps) {
  return (
    <section className="h-full overflow-hidden rounded-[18px] border border-border bg-surface">
      {scans.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-2.5 px-4 py-8 text-center md:px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-[11px] border border-border bg-surface2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-dim)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0" />
            </svg>
          </div>
          <p className="text-[14px] font-semibold text-text-muted">No scans yet</p>
          <p className="max-w-[260px] text-[13px] leading-relaxed text-text-dim">Start your first scan to detect AI media.</p>
          <Link href="/scan" className="mt-1 rounded-[12px] bg-primary px-4 py-2 text-[13px] font-semibold text-bg transition-colors hover:bg-primary-hover">
            Start scan →
          </Link>
        </div>
      ) : (
        <div className="pb-2">
          {scans.map((scan, index) => {
            const sm = STATUS_STYLE[scan.status];
            const tc = TYPE_COLOR[scan.type] ?? "var(--color-primary)";
            return (
              <div
                key={scan.id}
                className={`flex cursor-default items-center gap-3 px-4 py-3 transition-colors hover:bg-surface2 md:px-5 ${index < scans.length - 1 ? "border-b border-border/40" : ""}`}
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px]" style={{ background: `${tc}18`, border: `1px solid ${tc}30` }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={tc} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={TYPE_ICON[scan.type]} />
                  </svg>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold text-text">{scan.name}</p>
                  <p className="mt-0.5 text-[12px] text-text-dim">{scan.type} · {scan.date}</p>
                </div>

                {scan.confidence != null ? (
                  <span className="flex-shrink-0 text-[12.5px] font-bold" style={{ color: tc }}>
                    {scan.confidence}%
                  </span>
                ) : null}

                <div className={`flex flex-shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-semibold ${sm.color} ${sm.bg} ${sm.border}`}>
                  {sm.pulse ? <span className="h-1.5 w-1.5 flex-shrink-0 animate-pulse rounded-full bg-current" /> : null}
                  {sm.label}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
