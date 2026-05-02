"use client";

import { useState, useEffect, useRef } from "react";

interface DownloadMenuProps {
  scanId: string;
}

const OPTIONS = [
  {
    icon: "M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
    label: "Download screenshot",
    sub: "PNG image of result",
  },
  {
    icon: "M7 21h10a2 2 0 0 0 2-2V9.414a1 1 0 0 0-.293-.707l-5.414-5.414A1 1 0 0 0 12.586 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2",
    label: "Export as PDF",
    sub: "Full report document",
  },
];

export function DownloadMenu({ scanId }: DownloadMenuProps) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function handleOption(label: string) {
    setOpen(false);
    setToast(label);
    setTimeout(() => setToast(null), 2200);
  }

  return (
    <div ref={wrapRef} className="relative flex-shrink-0 self-start mt-0.5" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-center w-[26px] h-[26px] rounded-[8px] transition-all opacity-80 hover:opacity-100"
        style={{
          border: `1px solid ${open ? "rgba(126,170,255,.22)" : "var(--color-border)"}`,
          background: open ? "rgba(126,170,255,.06)" : "var(--color-surface3)",
        }}
        aria-label={`Download options for ${scanId}`}
        title="Export actions coming later"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke={open ? "var(--color-primary)" : "var(--color-text-dim)"}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-[30px] z-50 w-[220px] rounded-[14px] p-1.5"
          style={{
            background: "var(--color-surface2)",
            border: "1px solid var(--color-border)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.03)",
          }}
        >
          <div className="px-2.5 pt-1 pb-2 text-[10px] uppercase tracking-[.08em]" style={{ color: "var(--color-text-dim)" }}>
            Preview actions
          </div>
          {OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => handleOption(opt.label)}
              className="w-full flex items-center gap-2.5 p-[9px] rounded-[9px] border-none text-left transition-colors hover:bg-[var(--color-surface3)]"
              style={{ background: "transparent", fontFamily: "inherit" }}
            >
              <div
                className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--color-surface3)", border: "1px solid var(--color-border)" }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="var(--color-text-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={opt.icon} />
                </svg>
              </div>
              <div>
                <div className="text-[13px] font-semibold mb-0.5" style={{ color: "var(--color-text)" }}>{opt.label}</div>
                <div className="text-[11px]" style={{ color: "var(--color-text-dim)" }}>{opt.sub}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {toast && (
        <div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-[18px] py-[9px] rounded-full text-[13px] font-medium whitespace-nowrap z-50"
          style={{
            background: "var(--color-surface2)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="var(--color-success)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {toast} — not wired yet
        </div>
      )}
    </div>
  );
}
