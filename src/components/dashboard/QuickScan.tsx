"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const MEDIA_TYPES = [
  { id: "image", label: "Image", sub: "PNG, JPG, WEBP", cost: 5, colorClass: "text-primary border-primary/30 bg-primary/10", icon: "M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2 1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2" },
  { id: "audio", label: "Audio", sub: "MP3, WAV, M4A", cost: 40, colorClass: "text-warning border-warning/30 bg-warning/10", icon: "M19 11a7 7 0 0 1-7 7m0 0a7 7 0 0 1-7-7m7 7v4m0 0H8m4 0h4M12 3a4 4 0 0 0-4 4v4a4 4 0 0 0 8 0V7a4 4 0 0 0-4-4" },
  { id: "video", label: "Video", sub: "MP4, MOV, WEBM", cost: 99, colorClass: "text-danger border-danger/30 bg-danger/10", icon: "M15 10l4.553-2.07A1 1 0 0 1 21 8.845v6.31a1 1 0 0 1-1.447.916L15 14M3 8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8" },
  { id: "url", label: "URL", sub: "YouTube, links", cost: 5, colorClass: "text-success border-success/30 bg-success/10", icon: "M13.828 10.172a4 4 0 0 0-5.656 0l-4 4a4 4 0 1 0 5.656 5.656l1.102-1.101m-.758-4.899a4 4 0 0 0 5.656 0l4-4a4 4 0 0 0-5.656-5.656l-1.1 1.1" },
];

type QuickScanFooter = {
  text: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function QuickScan({
  credits = 10,
  footer,
}: {
  credits?: number;
  footer?: QuickScanFooter | null;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [mediaType, setMediaType] = useState("image");
  const [dragging, setDragging] = useState(false);
  const [url, setUrl] = useState("");

  const mt = MEDIA_TYPES.find((m) => m.id === mediaType) ?? MEDIA_TYPES[0];
  const filtered = tab === "url" ? MEDIA_TYPES.filter((m) => m.id === "url") : MEDIA_TYPES.filter((m) => m.id !== "url");
  const hasCredits = credits > 0;

  return (
    <section className="overflow-hidden rounded-[18px] border border-border bg-surface shadow-[0_0_0_1px_rgba(138,180,248,0.06)]">
      <div className="px-4 pt-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-[13px] text-text-dim">Upload media to continue on full scan page</p>
          <span className="text-[12px] text-text-dim">{credits} credits</span>
        </div>

        <div className="mb-3 flex w-fit gap-0.5 rounded-[10px] bg-surface2 p-0.5">
          {(["upload", "url"] as const).map((nextTab) => (
            <button
              key={nextTab}
              onClick={() => {
                setTab(nextTab);
                setMediaType(nextTab === "url" ? "url" : "image");
              }}
              className={`cursor-pointer rounded-[8px] border-none px-3 py-1.5 text-[13px] font-medium transition-all duration-150 ${tab === nextTab ? "bg-surface-hover font-semibold text-text" : "bg-transparent text-text-dim"}`}
            >
              {nextTab === "upload" ? "Upload" : "URL"}
            </button>
          ))}
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5">
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => setMediaType(item.id)}
              className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12.5px] font-medium transition-all duration-150 ${mediaType === item.id ? item.colorClass : "border-border bg-transparent text-text-dim hover:border-border"}`}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-4">
        {tab === "upload" ? (
          <button
            type="button"
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              router.push("/scan");
            }}
            onClick={() => router.push("/scan")}
            className={`mb-3 flex h-[160px] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-dashed px-4 text-center transition-all duration-200 ${dragging ? "border-primary bg-primary/5" : "border-border bg-surface2 hover:border-primary/40"}`}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary/10">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p className="text-[14px] font-semibold text-text">Upload {mt.label.toLowerCase()} to verify</p>
            <p className="text-[12.5px] text-text-dim">{mt.sub}</p>
          </button>
        ) : (
          <div className="mb-3 rounded-[14px] border border-border bg-surface2 p-3">
            <div className="flex items-center gap-2 rounded-[11px] border border-border bg-transparent px-3 py-2.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-dim)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13.828 10.172a4 4 0 0 0-5.656 0l-4 4a4 4 0 1 0 5.656 5.656l1.102-1.101m-.758-4.899a4 4 0 0 0 5.656 0l4-4a4 4 0 0 0-5.656-5.656l-1.1 1.1" />
              </svg>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste media URL"
                className="flex-1 border-none bg-transparent text-[14px] font-['DM_Sans'] text-text outline-none placeholder:text-text-dim"
              />
            </div>
          </div>
        )}

        <div className="mb-2 text-xs text-text-dim">
          Cost: {mt.cost} credit{mt.cost > 1 ? "s" : ""}
        </div>

        <button
          onClick={() => {
            if (!hasCredits) {
              router.push("/credits");
              return;
            }
            router.push(tab === "url" && url.trim() ? `/scan?source=${encodeURIComponent(url.trim())}` : "/scan");
          }}
          className={`w-full rounded-[12px] py-3 text-[14px] font-bold tracking-tight font-['DM_Sans'] transition-colors ${hasCredits ? "cursor-pointer border-none bg-primary text-bg shadow-[0_0_20px_rgba(138,180,248,0.22)] hover:bg-primary-hover" : "cursor-pointer border border-primary/25 bg-primary/12 text-primary hover:bg-primary/16"}`}
        >
          {hasCredits ? "Start scan" : "Add credits to scan"}
        </button>

        {footer ? (
          <div className="mt-2 text-[12px] text-text-dim">
            <p>{footer.text}</p>
            {footer.primaryHref || footer.secondaryHref ? (
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                {footer.primaryHref && footer.primaryLabel ? (
                  <Link href={footer.primaryHref} className="text-primary transition-colors hover:text-primary-hover">
                    {footer.primaryLabel}
                  </Link>
                ) : null}
                {footer.secondaryHref && footer.secondaryLabel ? (
                  <Link href={footer.secondaryHref} className="text-primary transition-colors hover:text-primary-hover">
                    {footer.secondaryLabel}
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
