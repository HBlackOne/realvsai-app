"use client";

import { useState, useEffect, useRef } from "react";
import type { Scan } from "./ScanRow";

interface DownloadMenuProps {
  scan: Scan;
}

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function DownloadMenu({ scan }: DownloadMenuProps) {
  const [open, setOpen]   = useState(false);
  const [toast, setToast] = useState<{ msg: string; tone: "success" | "error" } | null>(null);
  const [busy, setBusy]   = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function flashToast(msg: string, tone: "success" | "error" = "success") {
    setToast({ msg, tone });
    setTimeout(() => setToast(null), 2200);
  }

  /* ── DOWNLOAD SCREENSHOT ── */
  async function downloadScreenshot() {
    setBusy("screenshot");
    try {
      const W = 1200, H = 630;
      const c = document.createElement("canvas");
      c.width = W; c.height = H;
      const ctx = c.getContext("2d")!;

      const grd = ctx.createLinearGradient(0, 0, W, H);
      grd.addColorStop(0, "#0e0e10");
      grd.addColorStop(1, "#18181b");
      ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "#8ab4f8";
      ctx.font = "700 22px sans-serif";
      ctx.fillText("RealvsAI", 64, 80);
      ctx.fillStyle = "#5a5f6b";
      ctx.font = "500 14px monospace";
      ctx.fillText("SCAN " + scan.id.toUpperCase(), 64, 104);

      const verdictColor =
        scan.verdict === "AI Generated" ? "#f28b82" :
        scan.verdict === "Authentic"    ? "#81c995" :
        scan.verdict === "Mixed"        ? "#fdd663" : "#9aa0a6";

      ctx.fillStyle = "#e8eaed";
      ctx.font = "600 16px sans-serif";
      ctx.fillText("VERDICT", 64, 200);
      ctx.fillStyle = verdictColor;
      ctx.font = "800 88px sans-serif";
      ctx.fillText(scan.verdict || "—", 64, 290);

      ctx.fillStyle = "#9aa0a6";
      ctx.font = "500 14px sans-serif";
      ctx.fillText("CONFIDENCE", 64, 350);
      ctx.fillStyle = "#e8eaed";
      ctx.font = "700 44px monospace";
      ctx.fillText(scan.confidence !== null ? scan.confidence + "%" : "—", 64, 400);

      ctx.fillStyle = "#2a2a30";
      ctx.fillRect(64, 430, 600, 8);
      if (scan.confidence !== null) {
        ctx.fillStyle = verdictColor;
        ctx.fillRect(64, 430, 600 * (scan.confidence / 100), 8);
      }

      ctx.fillStyle = "#5a5f6b";
      ctx.font = "500 13px monospace";
      ctx.fillText("SOURCE", 64, 500);
      ctx.fillStyle = "#9aa0a6";
      ctx.font = "500 16px monospace";
      const label = scan.sourceLabel.length > 70 ? scan.sourceLabel.slice(0, 67) + "…" : scan.sourceLabel;
      ctx.fillText(label, 64, 528);
      ctx.fillStyle = "#5a5f6b";
      ctx.font = "500 12px monospace";
      ctx.fillText(fmtDate(scan.createdAt) + "  ·  " + scan.mediaType + "  ·  " + scan.costCredits + " credits", 64, 560);

      const blob = await new Promise<Blob>((res) => c.toBlob((b) => res(b!), "image/png"));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `realvsai_${scan.id}_screenshot.png`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      flashToast("Screenshot downloaded");
    } catch {
      flashToast("Download failed", "error");
    } finally {
      setBusy(null); setOpen(false);
    }
  }

  /* ── EXPORT PDF ── */
  function exportPdf() {
    setBusy("pdf"); setOpen(false);
    const verdictColor =
      scan.verdict === "AI Generated" ? "#c2410c" :
      scan.verdict === "Authentic"    ? "#15803d" :
      scan.verdict === "Mixed"        ? "#a16207" : "#525252";

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://realvs.ai";
    const safeSourceLabel = escapeHtml(scan.sourceLabel);
    const safeErrorMessage = scan.errorMessage ? escapeHtml(scan.errorMessage) : null;
    const html = `<!doctype html><html><head><meta charset="utf-8">
      <title>Scan ${scan.id} — RealvsAI</title>
      <style>
        @page { size: A4; margin: 18mm; }
        body { font-family: system-ui, sans-serif; color: #18181b; margin: 0; }
        h1 { font-size: 24px; letter-spacing: -0.02em; margin: 0 0 6px; }
        .muted { color: #6b7280; font-size: 12px; }
        .mono  { font-family: ui-monospace, monospace; }
        .verdict { font-size: 36px; font-weight: 800; letter-spacing: -0.03em; margin: 24px 0 4px; color: ${verdictColor}; }
        .row { display:flex; gap:24px; margin:16px 0; padding:14px 16px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; }
        .row > div { flex:1; }
        .lbl { font-size:10px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:#6b7280; margin-bottom:4px; }
        .val { font-size:14px; font-weight:600; }
        .bar { height:8px; background:#e5e7eb; border-radius:4px; overflow:hidden; margin-top:6px; }
        .bar > span { display:block; height:100%; background:${verdictColor}; width:${scan.confidence ?? 0}%; }
        hr { border:none; border-top:1px solid #e5e7eb; margin:24px 0; }
      </style></head><body>
      <div style="display:flex;justify-content:space-between;align-items:baseline;">
        <h1>RealvsAI Scan Report</h1>
        <div class="muted mono">${scan.id.toUpperCase()}</div>
      </div>
      <div class="muted">${fmtDate(scan.createdAt)} · ${scan.mediaType} · ${scan.inputType} · ${scan.costCredits} credits</div>
      <div class="verdict">${scan.verdict || "—"}</div>
      <div class="muted">Confidence ${scan.confidence !== null ? scan.confidence + "%" : "—"}</div>
      <div class="bar"><span></span></div>
      <hr/>
      <div class="lbl">Source</div>
      <div class="val mono" style="word-break:break-all;">${safeSourceLabel}</div>
      ${safeErrorMessage ? `<div class="row" style="background:#fef2f2;border-color:#fecaca;color:#991b1b;"><div><div class="lbl" style="color:#991b1b;">Error</div><div class="val">${safeErrorMessage}</div></div></div>` : ""}
      <hr/>
      <div class="muted" style="font-size:10px;">Generated by RealvsAI · ${siteUrl}/scan/${scan.id}</div>
      <script>window.onload=()=>{setTimeout(()=>window.print(),200)};<\/script>
      </body></html>`;

    const w = window.open("", "_blank");
    if (!w) { flashToast("Pop-up blocked — allow pop-ups", "error"); setBusy(null); return; }
    w.document.write(html); w.document.close();
    flashToast("Opening print dialog…");
    setBusy(null);
  }

  /* ── COPY SHARE LINK ── */
  async function copyShareLink() {
    setBusy("share");
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://realvs.ai";
    const url = `${siteUrl}/scan/${scan.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "RealvsAI scan " + scan.id, url });
        flashToast("Shared");
      } else {
        await navigator.clipboard.writeText(url);
        flashToast("Link copied");
      }
    } catch {
      try { await navigator.clipboard.writeText(url); flashToast("Link copied"); }
      catch { flashToast("Copy failed", "error"); }
    } finally {
      setBusy(null); setOpen(false);
    }
  }

  const options = [
    {
      key: "screenshot",
      icon: "M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
      label: "Download screenshot",
      sub: "PNG of the verdict",
      action: downloadScreenshot,
    },
    {
      key: "pdf",
      icon: "M7 21h10a2 2 0 0 0 2-2V9.414a1 1 0 0 0-.293-.707l-5.414-5.414A1 1 0 0 0 12.586 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2",
      label: "Export as PDF",
      sub: "Full scan report",
      action: exportPdf,
    },
    {
      key: "share",
      icon: "M15 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2.6-1.4l5.8 3.4m0-13.2L8.6 10.6",
      label: "Copy share link",
      sub: "Public read-only URL",
      action: copyShareLink,
    },
  ];

  return (
    <div
      ref={wrapRef}
      className="relative flex-shrink-0 self-start mt-0.5"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-center w-[26px] h-[26px] rounded-[8px] transition-all"
        style={{
          border: `1px solid ${open ? "rgba(126,170,255,.4)" : "var(--color-border)"}`,
          background: open ? "rgba(126,170,255,.1)" : "var(--color-surface3)",
        }}
        aria-label="More actions"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke={open ? "var(--color-primary)" : "var(--color-text-dim)"}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="5" r="1.4"/>
          <circle cx="12" cy="12" r="1.4"/>
          <circle cx="12" cy="19" r="1.4"/>
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-[30px] z-[9999] w-[230px] rounded-[14px] p-1.5"
          style={{
            background: "var(--surface2)",
            border: "1px solid var(--color-border)",
            boxShadow: "0 12px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.025)",
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.key}
              disabled={!!busy}
              onClick={opt.action}
              className="w-full flex items-center gap-2.5 p-[9px] rounded-[9px] border-none text-left transition-colors"
              style={{
                background: "transparent",
                fontFamily: "inherit",
                opacity: busy && busy !== opt.key ? 0.5 : 1,
                cursor: busy ? "default" : "pointer",
              }}
              onMouseEnter={(e) => { if (!busy) (e.currentTarget as HTMLButtonElement).style.background = "var(--color-surface3)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              <div
                className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--color-surface3)", border: "1px solid var(--color-border)" }}
              >
                {busy === opt.key ? (
                  <div className="w-3 h-3 rounded-full" style={{ border: "1.5px solid var(--color-border)", borderTopColor: "var(--color-primary)", animation: "spin 0.8s linear infinite" }} />
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="var(--color-text-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={opt.icon}/>
                  </svg>
                )}
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
          className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-[18px] py-[9px] rounded-full text-[13px] font-medium whitespace-nowrap z-[9999]"
          style={{
            background: "var(--surface2)",
            border: `1px solid ${toast.tone === "error" ? "rgba(255,107,107,0.4)" : "var(--color-border)"}`,
            color: "var(--color-text)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
          }}
        >
          {toast.tone === "error" ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
