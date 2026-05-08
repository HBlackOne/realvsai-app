"use client";

/**
 * Realvs.ai — Scan page (V2 UI wired into existing Next.js backend)
 *
 * Backend wiring is unchanged from the live realvsai-app `scan/page.tsx`.
 * Only the JSX render layer was rewritten to match the new Scan Page V2 design.
 *
 * Do not change:
 *   - useAppMe + refresh
 *   - state shape (selectedFile, videoUrl, urlPreflight, preview, stage, result, scanId, inputMode, activeTab)
 *   - useEffect URL preflight debounce → /api/scans/preflight
 *   - handleAnalyze → handleConfirm flow
 *   - upload pipeline: /api/upload → /api/scans → /api/scans/[id]/run → /api/scans/[id]/complete
 *   - URL pipeline:    /api/scans → /api/scans/[id]/run → /api/scans/[id]/complete
 *   - PLANS / FREE_SCAN_PRICES / SCAN_PRICES math
 *   - getScanUpsellState upsell rules
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  FileAudio2,
  Film,
  Image as ImageIcon,
  Link2,
  Lock,
  Search,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { useAppMe } from "@/hooks/use-app-me";
import { TABS } from "@/components/universal-detector/data";
import ResultPanel from "@/components/scan/ResultPanel";
import { getScanUpsellState } from "@/components/universal-detector/scan-upsell";
import type {
  MediaType,
  ScanResult,
  ScanStage,
} from "@/components/universal-detector/types";
import { SmartButton } from "@/components/ui/SmartButton";
import {
  AppPage,
  AppPageHeader,
} from "@/components/app-shell/AppPage";
import { formatBytes } from "@/components/universal-detector/utils";
import { PLANS } from "@/lib/billing/plans";
import { FREE_SCAN_PRICES, SCAN_PRICES } from "@/lib/billing/pricing.constants";

const FILE_ACCEPT =
  "image/png,image/jpeg,image/webp,audio/mp3,audio/wav,audio/m4a,audio/mpeg,video/mp4,video/quicktime,video/webm";

const URL_METHOD_LOCKED = true;

type BaseMediaType = Exclude<MediaType, "video-deep">;

const URL_MEDIA_TYPES: Array<{ type: BaseMediaType; label: string }> = [
  { type: "image", label: "image" },
  { type: "audio", label: "audio" },
  { type: "video", label: "video" },
];

const SCAN_LIMITS = {
  image: { maxSizeMb: 10, accepts: ["image/png", "image/jpeg", "image/webp"] },
  audio: {
    maxSizeMb: 25,
    maxDurationSec: 300,
    accepts: [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/x-wav",
      "audio/x-m4a",
      "audio/mp4",
      "audio/m4a",
    ],
  },
  video: {
    maxSizeMb: 100,
    maxDurationSec: 900,
    accepts: ["video/mp4", "video/quicktime", "video/webm"],
  },
} as const;

type PreviewState = {
  kind: BaseMediaType;
  label: string;
  subtype: string;
  sizeText: string;
  durationText?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  valid: boolean;
  validationMessage?: string;
};

/* ───────────── helpers (unchanged from original) ───────────── */
function getBaseMediaType(type: MediaType): BaseMediaType {
  return type === "video-deep" ? "video" : type;
}
function toServerMediaType(type: MediaType): string {
  switch (type) {
    case "image":
      return "image";
    case "audio":
      return "audio";
    case "video":
      return "short_video";
    case "video-deep":
      return "deep_video";
    default:
      return "image";
  }
}
function detectMediaType(file: File): BaseMediaType | null {
  const t = file.type.toLowerCase();
  if (t.startsWith("image/")) return "image";
  if (t.startsWith("audio/")) return "audio";
  if (t.startsWith("video/")) return "video";
  return null;
}
function formatDetectedTypeLabel(t: BaseMediaType) {
  if (t === "image") return "Image detected";
  if (t === "audio") return "Audio detected";
  return "Video detected";
}
function formatDurationLabel(totalSeconds: number | null) {
  if (totalSeconds === null || totalSeconds < 0) return null;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}
function formatFileSubtype(file: File) {
  const t = file.type.toLowerCase();
  if (t.includes("png")) return "PNG";
  if (t.includes("jpeg") || t.includes("jpg")) return "JPG";
  if (t.includes("webp")) return "WEBP";
  if (t.includes("mpeg") || t.includes("mp3")) return "MP3";
  if (t.includes("wav")) return "WAV";
  if (t.includes("m4a") || t.includes("mp4"))
    return t.startsWith("audio/") ? "M4A" : "MP4";
  if (t.includes("quicktime")) return "MOV";
  if (t.includes("webm")) return "WEBM";
  return file.type
    ? (file.type.split("/")[1]?.toUpperCase() ?? "FILE")
    : "FILE";
}
function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const safe = Math.max(0, Math.round(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}
function buildLimitError(t: BaseMediaType, value: number) {
  if (t === "audio")
    return `Audio exceeds 5 min limit (currently ${formatDuration(value)}).`;
  return `Video exceeds 15 min limit (currently ${formatDuration(value)}).`;
}
async function getMediaDuration(file: File, kind: "audio" | "video") {
  const objectUrl = URL.createObjectURL(file);
  try {
    return await new Promise<number>((resolve, reject) => {
      const media = document.createElement(kind);
      media.preload = "metadata";
      media.onloadedmetadata = () => resolve(media.duration || 0);
      media.onerror = () =>
        reject(new Error(`Unable to read ${kind} duration.`));
      media.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
async function getVideoThumbnail(file: File) {
  const objectUrl = URL.createObjectURL(file);
  try {
    return await new Promise<string>((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;
      video.onloadeddata = () => {
        video.currentTime = Math.min(1, Math.max(0, (video.duration || 0) / 4));
      };
      video.onseeked = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth || 320;
          canvas.height = video.videoHeight || 180;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Unable to create video thumbnail."));
            return;
          }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.82));
        } catch (e) {
          reject(
            e instanceof Error ? e : new Error("Unable to capture thumbnail."),
          );
        }
      };
      video.onerror = () =>
        reject(new Error("Unable to generate video thumbnail."));
      video.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
async function buildPreviewForFile(
  file: File,
): Promise<{ type: BaseMediaType; preview: PreviewState }> {
  const detected = detectMediaType(file);
  if (!detected) throw new Error("Unsupported file type.");
  const sizeMb = file.size / (1024 * 1024);
  const sizeText = formatBytes(file.size);
  const subtype = formatFileSubtype(file);
  const base = {
    kind: detected,
    label: formatDetectedTypeLabel(detected),
    subtype,
    sizeText,
    valid: true,
  } as PreviewState;
  const limit = SCAN_LIMITS[detected];
  if (sizeMb > limit.maxSizeMb) {
    return {
      type: detected,
      preview: {
        ...base,
        valid: false,
        validationMessage: `File too large — max ${limit.maxSizeMb}MB.`,
      },
    };
  }
  if (detected === "image") {
    return {
      type: detected,
      preview: { ...base, imageUrl: URL.createObjectURL(file) },
    };
  }
  if (detected === "audio") {
    const d = await getMediaDuration(file, "audio");
    if (d > SCAN_LIMITS.audio.maxDurationSec) {
      return {
        type: detected,
        preview: {
          ...base,
          valid: false,
          durationText: formatDuration(d),
          validationMessage: buildLimitError("audio", d),
        },
      };
    }
    return {
      type: detected,
      preview: { ...base, durationText: formatDuration(d) },
    };
  }
  const d = await getMediaDuration(file, "video");
  const thumb = await getVideoThumbnail(file);
  if (d > SCAN_LIMITS.video.maxDurationSec) {
    return {
      type: detected,
      preview: {
        ...base,
        valid: false,
        durationText: formatDuration(d),
        thumbnailUrl: thumb,
        validationMessage: buildLimitError("video", d),
      },
    };
  }
  return {
    type: detected,
    preview: {
      ...base,
      durationText: formatDuration(d),
      thumbnailUrl: thumb,
    },
  };
}

/* ───────────── V2 UI subcomponents ───────────── */

function TypeBadge({ type }: { type: MediaType }) {
  const colorClass =
    type === "image"
      ? "text-primary"
      : type === "audio"
        ? "text-warning"
        : "text-danger";
  const label = type === "video-deep" ? "Deep" : type;
  return (
    <div
      className={`absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] ${colorClass}`}
    >
      {label}
    </div>
  );
}

function FilePreviewV2({
  file,
  preview,
  onClear,
  onOverrideType,
  disabled,
  effectiveType,
}: {
  file: File;
  preview: PreviewState;
  onClear: () => void;
  onOverrideType: (t: BaseMediaType) => void;
  disabled: boolean;
  effectiveType: MediaType;
}) {
  const limitError = preview.valid ? null : preview.validationMessage;
  const colorClass =
    preview.kind === "image"
      ? "text-primary"
      : preview.kind === "audio"
        ? "text-warning"
        : "text-danger";

  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-surface ${
        limitError ? "border-danger/30" : "border-border"
      }`}
    >
      <div className="flex">
        {/* thumbnail */}
        <div className="relative flex h-20 w-[120px] flex-shrink-0 items-center justify-center overflow-hidden bg-surface-hover">
          {preview.kind === "image" && preview.imageUrl ? (
            <img
              src={preview.imageUrl}
              alt={file.name}
              className="h-full w-full object-cover"
            />
          ) : preview.kind === "video" && preview.thumbnailUrl ? (
            <img
              src={preview.thumbnailUrl}
              alt={file.name}
              className="h-full w-full object-cover"
            />
          ) : preview.kind === "audio" ? (
            <div className="flex h-9 items-end gap-[2px]">
              {[0.4, 0.7, 1, 0.6, 0.9, 0.5, 0.8, 0.3, 0.7, 0.5].map((h, i) => (
                <div
                  key={i}
                  className={`w-[3px] rounded-sm ${colorClass} bg-current opacity-70`}
                  style={{ height: `${h * 100}%` }}
                />
              ))}
            </div>
          ) : (
            <Film className="h-7 w-7 text-text-dim" />
          )}
          <TypeBadge type={effectiveType} />
        </div>

        {/* info */}
        <div className="min-w-0 flex-1 px-3.5 py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold text-text">
                {file.name}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-text-dim">
                <span className="font-mono">{preview.sizeText}</span>
                {preview.durationText ? (
                  <span className="font-mono">· {preview.durationText}</span>
                ) : null}
                {!limitError ? (
                  <span className="flex items-center gap-1 text-success">
                    <CheckCircle2 className="h-3 w-3" />
                    Within limits
                  </span>
                ) : null}
              </div>
            </div>
            <button
              onClick={onClear}
              disabled={disabled}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-surface-hover text-text-dim transition hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          {/* override type */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[10.5px] text-text-dim">Scan as:</span>
            {(["image", "audio", "video"] as BaseMediaType[]).map((t) => {
              const active =
                preview.kind === t ||
                (preview.kind === "video" && t === "video");
              return (
                <button
                  key={t}
                  onClick={() => onOverrideType(t)}
                  disabled={disabled || preview.kind !== t}
                  className={`rounded-full border px-2.5 py-[3px] text-[10.5px] font-semibold transition disabled:cursor-not-allowed ${
                    active
                      ? "border-primary/60 bg-primary-dim text-primary"
                      : "border-border bg-transparent text-text-dim opacity-40"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {limitError ? (
        <div className="flex items-center gap-2 border-t border-danger/20 bg-danger/10 px-3.5 py-2.5">
          <AlertTriangle className="h-3.5 w-3.5 text-danger" />
          <span className="text-[12px] text-danger">{limitError}</span>
        </div>
      ) : null}
    </div>
  );
}

function DropZoneV2({
  onFile,
  disabled,
  isPreparing,
}: {
  onFile: (f: File) => void;
  disabled: boolean;
  isPreparing: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (disabled) return;
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center gap-2.5 rounded-[18px] border-[1.5px] border-dashed px-6 py-11 text-center transition ${
        dragging
          ? "border-primary bg-primary-dim"
          : "border-border bg-surface"
      } ${disabled ? "cursor-default opacity-60" : ""}`}
    >
      <div
        className={`mb-1 flex items-center justify-center rounded-2xl transition ${
          dragging ? "bg-primary/20" : "bg-surface-hover"
        }`}
        style={{ height: 52, width: 52 }}
      >
        <Upload
          className={dragging ? "text-primary" : "text-text-dim"}
          style={{ height: 22, width: 22 }}
        />
      </div>
      <div
        className={`text-sm font-bold ${dragging ? "text-primary" : "text-text"}`}
      >
        {isPreparing
          ? "Preparing file…"
          : dragging
            ? "Release to upload"
            : "Drop any media file here"}
      </div>
      <div className="text-xs leading-7 text-text-dim">
        Images · Audio · Video — or{" "}
        <span className="text-primary underline">browse files</span>
      </div>
      <div className="mt-1 flex flex-wrap justify-center gap-2">
        {[
          { label: "Image", sub: "PNG JPG WEBP · 10MB", color: "text-primary" },
          { label: "Audio", sub: "MP3 WAV M4A · 5min", color: "text-warning" },
          { label: "Video", sub: "MP4 MOV WEBM · 15min", color: "text-danger" },
        ].map((t) => (
          <div
            key={t.label}
            className="rounded-lg border border-border bg-surface-hover px-2.5 py-1 text-[10px] font-semibold"
          >
            <span className={t.color}>{t.label}</span>{" "}
            <span className="font-normal text-text-dim">{t.sub}</span>
          </div>
        ))}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={FILE_ACCEPT}
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function UrlInputV2({
  value,
  onChange,
  urlType,
  onUrlType,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  urlType: BaseMediaType;
  onUrlType: (t: BaseMediaType) => void;
  disabled: boolean;
}) {
  const types = [
    { id: "image" as const, color: "primary" },
    { id: "audio" as const, color: "warning" },
    { id: "video" as const, color: "danger" },
  ];
  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-surface">
      <div className="flex items-center justify-between gap-2 border-b border-border-subtle px-3 py-2.5">
        <span className="text-[11px] text-text-dim">URL — media type:</span>
        <div className="flex gap-1">
          {types.map((t) => {
            const active = urlType === t.id;
            const colorClass =
              t.color === "primary"
                ? "text-primary border-primary/40 bg-primary/10"
                : t.color === "warning"
                  ? "text-warning border-warning/40 bg-warning/10"
                  : "text-danger border-danger/40 bg-danger/10";
            return (
              <button
                key={t.id}
                onClick={() => onUrlType(t.id)}
                disabled={disabled}
                className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  active
                    ? colorClass
                    : "border-border bg-transparent text-text-dim hover:text-text"
                }`}
              >
                {t.id === "image" ? (
                  <ImageIcon className="h-3 w-3" />
                ) : t.id === "audio" ? (
                  <FileAudio2 className="h-3 w-3" />
                ) : (
                  <Film className="h-3 w-3" />
                )}
                {t.id}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-2.5 px-3.5 py-3">
        <Link2 className="h-3.5 w-3.5 flex-shrink-0 text-text-dim" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Paste YouTube, direct media URL, or public link…"
          className="min-w-0 flex-1 bg-transparent text-[13px] text-text outline-none placeholder:text-text-dim"
        />
        {value ? (
          <button
            onClick={() => onChange("")}
            disabled={disabled}
            className="text-text-dim hover:text-text disabled:cursor-not-allowed"
          >
            <X className="h-3 w-3" />
          </button>
        ) : null}
      </div>
      <div className="px-3.5 pb-2.5 text-[10.5px] text-text-dim">
        Limits are enforced server-side for URLs.
      </div>
    </div>
  );
}

function LockedUrlPanel() {
  return (
    <div className="relative overflow-hidden rounded-[14px] border border-warning/30 bg-surface">
      <div className="pointer-events-none blur-[2px]">
        <UrlInputV2
          value="https://example.com/media"
          onChange={() => {}}
          urlType="video"
          onUrlType={() => {}}
          disabled
        />
      </div>

      <div className="absolute inset-0 bg-bg/45 backdrop-blur-[1px]" />

      <div className="absolute right-3 top-3 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-warning shadow-sm">
        Coming soon
      </div>

    </div>
  );
}

function ScanConfigV2({
  effectiveType,
  cost,
  balance,
  hasEnough,
  canScan,
  scanning,
  errorLabel,
  deepVideoVisible,
  deepVideoActive,
  deepVideoDisabled,
  deepVideoCost,
  deepVideoSubtitle,
  onToggleDeep,
  smartButton,
}: {
  effectiveType: MediaType;
  cost: number;
  balance: number;
  hasEnough: boolean;
  canScan: boolean;
  scanning: boolean;
  errorLabel: string | null;
  deepVideoVisible: boolean;
  deepVideoActive: boolean;
  deepVideoDisabled: boolean;
  deepVideoCost: number;
  deepVideoSubtitle: string;
  onToggleDeep: () => void;
  smartButton: React.ReactNode;
}) {
  const dotClass =
    effectiveType === "image"
      ? "bg-primary"
      : effectiveType === "audio"
        ? "bg-warning"
        : "bg-danger";
  const titleLabel =
    effectiveType === "video-deep"
      ? "Deep Video Scan"
      : `${effectiveType.charAt(0).toUpperCase() + effectiveType.slice(1)} Scan`;

  return (
    <div className="rounded-2xl border border-border bg-surface px-4 py-4">
      {/* cost row */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${dotClass}`} />
          <span className="text-[13px] font-semibold text-text">
            {titleLabel}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="h-3 w-3 fill-warning text-warning" />
          <span className="font-mono text-[13px] font-bold text-text">
            {cost}
          </span>
          <span className="text-[11px] text-text-dim">credits</span>
        </div>
      </div>

      {/* deep video toggle */}
      {deepVideoVisible ? (
        <div className="mb-3 flex items-center justify-between rounded-xl border border-border bg-surface-hover px-3 py-2.5">
          <div className="min-w-0 pr-3">
            <div className="text-[12px] font-semibold text-text">
              Deep Video Scan
            </div>
            <div className="text-[11px] text-text-dim">
              {deepVideoCost} credits · {deepVideoSubtitle}
            </div>
          </div>
          <button
            onClick={onToggleDeep}
            disabled={deepVideoDisabled}
            className={`relative h-[22px] w-[38px] flex-shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 ${
              deepVideoActive ? "bg-primary" : "bg-surface"
            }`}
          >
            <span
              className="absolute top-[3px] h-4 w-4 rounded-full bg-white transition-all"
              style={{ left: deepVideoActive ? 18 : 3 }}
            />
          </button>
        </div>
      ) : null}

      {/* balance */}
      <div className="mb-3.5 flex items-center justify-between text-[12px]">
        <span className="text-text-dim">Available balance</span>
        <span
          className={`font-mono font-semibold ${
            hasEnough ? "text-text" : "text-danger"
          }`}
        >
          {balance.toLocaleString()} credits
        </span>
      </div>

      {!hasEnough ? (
        <div className="mb-3 rounded-[9px] border border-danger/20 bg-danger/10 px-3 py-2 text-[11.5px] text-danger">
          Not enough credits — you need {cost - balance} more.{" "}
          <Link href="/credits" className="font-semibold underline">
            Top up →
          </Link>
        </div>
      ) : null}

      {/* CTA */}
      <div className="w-full">{smartButton}</div>

      {/* credit priority */}
      <div className="mt-2.5 text-center text-[11px] leading-relaxed text-text-dim">
        Used in order: Trial → Subscription → Wallet
      </div>

      {errorLabel && !scanning && !canScan ? null : null}
    </div>
  );
}

/* ───────────── main ───────────── */

export default function UniversalDetectorPage() {
  const { me, refresh } = useAppMe();
  const [activeTab, setActiveTab] = useState<MediaType>("image");
  const [stage, setStage] = useState<ScanStage>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanId, setScanId] = useState<string | null>(null);
  const [isPreparingFile, setIsPreparingFile] = useState(false);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [inputMode, setInputMode] = useState<"upload" | "url">("upload");
  const [urlPreflight, setUrlPreflight] = useState<{
    loading: boolean;
    detectedType: BaseMediaType | null;
    contentType: string | null;
    resolvedUrl: string | null;
    previewTitle: string | null;
    previewImage: string | null;
    previewSiteName: string | null;
    previewPlatform: string | null;
    previewDuration: number | null;
    error: string | null;
  }>({
    loading: false,
    detectedType: null,
    contentType: null,
    resolvedUrl: null,
    previewTitle: null,
    previewImage: null,
    previewSiteName: null,
    previewPlatform: null,
    previewDuration: null,
    error: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const trialBalance = me?.trial?.balance ?? 0;
  const subscriptionBalance = me?.subscription?.subscriptionCreditBalance ?? 0;
  const walletBalance = me?.wallet?.balance ?? 0;
  const spendableBalance = trialBalance + subscriptionBalance + walletBalance;

  const subscriptionPlanId = me?.subscription?.subscriptionPlanId ?? null;
  const activePlan = useMemo(() => {
    if (
      !me?.subscription ||
      (me.subscription.status !== "ACTIVE" &&
        me.subscription.status !== "ON_TRIAL")
    )
      return null;
    if (subscriptionPlanId === "basic") return PLANS.basic;
    if (subscriptionPlanId === "pro_ea") return PLANS.pro_ea;
    if (subscriptionPlanId === "pro_loyalty") return PLANS.pro_loyalty;
    if (subscriptionPlanId === "pro_normal") return PLANS.pro_normal;
    if (subscriptionPlanId === "pro") {
      if (me.subscription.subscriptionPriceLocked || me.earlyAccessEligible)
        return PLANS.pro_ea;
      if (
        me.subscription.subscriptionPriceCents === PLANS.pro_loyalty.priceCents
      )
        return PLANS.pro_loyalty;
      return PLANS.pro_normal;
    }
    return null;
  }, [me?.earlyAccessEligible, me?.subscription, subscriptionPlanId]);

  const usesSubscriberRates = Boolean(
    me?.subscription &&
      (me.subscription.status === "ACTIVE" ||
        me.subscription.status === "ON_TRIAL"),
  );
  const hasSubscriptionCredits = Boolean(
    usesSubscriberRates &&
      (me?.subscription?.subscriptionCreditBalance ?? 0) > 0,
  );

  const effectiveCosts = useMemo(
    () => ({
      image:
        activePlan && usesSubscriberRates
          ? activePlan.imageCost
          : FREE_SCAN_PRICES.image,
      audio:
        activePlan && usesSubscriberRates
          ? activePlan.audioCost
          : FREE_SCAN_PRICES.audio,
      video:
        activePlan && usesSubscriberRates
          ? activePlan.videoShortCost
          : SCAN_PRICES.video15,
      deepVideo:
        activePlan && usesSubscriberRates && activePlan.deepVideo
          ? activePlan.deepVideoCost
          : SCAN_PRICES.video60,
    }),
    [activePlan, usesSubscriberRates],
  );

  const resultUpsell = useMemo(
    () =>
      getScanUpsellState({
        me,
        activeTab,
        hasResult: stage === "result" && Boolean(result),
      }),
    [activeTab, me, result, stage],
  );

  const hasUrlInput = Boolean(videoUrl.trim());
  const hasInput = Boolean(selectedFile || (!URL_METHOD_LOCKED && hasUrlInput));
  const userCanDeepVideo = Boolean(activePlan?.deepVideo);
  const isScanLocked =
    stage === "confirm" ||
    stage === "uploading" ||
    stage === "scanning" ||
    isPreparingFile;
  const isUploadedState =
    stage === "ready" ||
    stage === "confirm" ||
    stage === "uploading" ||
    stage === "scanning" ||
    stage === "result" ||
    stage === "error";
  const canScan = selectedFile
    ? Boolean(preview?.valid)
    : hasUrlInput &&
      !urlPreflight.loading &&
      !urlPreflight.error &&
      Boolean(urlPreflight.detectedType);
  const currentBaseType = getBaseMediaType(activeTab);

  useEffect(() => {
    return () => {
      if (preview?.imageUrl) URL.revokeObjectURL(preview.imageUrl);
    };
  }, [preview?.imageUrl]);

  const setReadyIfValid = (file: File | null, url?: string, valid = true) => {
    if ((file && valid) || (url && url.trim())) {
      setStage("ready");
      setError("");
    } else if (file && !valid) {
      setStage("error");
    } else {
      setStage("idle");
    }
  };

  const onPickFile = async (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setPreview(null);
      setResult(null);
      setError("");
      setReadyIfValid(null);
      return;
    }
    setIsPreparingFile(true);
    setInputMode("upload");
    setError("");
    setResult(null);
    setVideoUrl("");
    try {
      const prepared = await buildPreviewForFile(file);
      setSelectedFile(file);
      setPreview((prev) => {
        if (prev?.imageUrl) URL.revokeObjectURL(prev.imageUrl);
        return prepared.preview;
      });
      setActiveTab(prepared.type);
      if (prepared.preview.valid) setReadyIfValid(file, undefined, true);
      else {
        setError(
          prepared.preview.validationMessage || "File validation failed.",
        );
        setReadyIfValid(file, undefined, false);
      }
    } catch (e) {
      setSelectedFile(null);
      setPreview((prev) => {
        if (prev?.imageUrl) URL.revokeObjectURL(prev.imageUrl);
        return null;
      });
      setError(
        e instanceof Error ? e.message : "Unable to process selected file.",
      );
      setStage("error");
    } finally {
      setIsPreparingFile(false);
    }
  };

  const getCurrentScanMediaType = (): MediaType => {
    if (inputMode === "upload" && selectedFile) {
      const detected = detectMediaType(selectedFile);
      if (detected === "video" && activeTab === "video-deep")
        return "video-deep";
      return detected ?? activeTab;
    }
    if (inputMode === "url" && urlPreflight.detectedType) {
      if (urlPreflight.detectedType === "video" && activeTab === "video-deep")
        return "video-deep";
      return urlPreflight.detectedType;
    }
    return activeTab;
  };

  const handleAnalyze = async () => {
    if (!selectedFile && !videoUrl.trim()) {
      setError("Choose a file or paste a media URL first.");
      setStage("error");
      return;
    }
    if (selectedFile && !preview?.valid) {
      setError(
        preview?.validationMessage ||
          "Selected file is not valid for scanning.",
      );
      setStage("error");
      return;
    }
    if (activeTab === "video-deep" && !userCanDeepVideo) return;
    if (!hasEnoughCredits) return;
    setError("");
    await handleConfirm();
  };

  const handleConfirm = async () => {
    const scanMediaType = getCurrentScanMediaType();
    const serverMediaType = toServerMediaType(scanMediaType);
    if (scanMediaType !== activeTab) setActiveTab(scanMediaType);
    let newScanId: string | null = null;
    setError("");

    try {
      if (inputMode === "url" && videoUrl.trim()) {
        const sourceUrl = urlPreflight.resolvedUrl || videoUrl.trim();
        const sourceLabel =
          urlPreflight.previewTitle ||
          urlPreflight.previewSiteName ||
          sourceUrl;

        setStage("scanning");

        const createRes = await fetch("/api/scans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mediaType: serverMediaType,
            videoSource: "url",
            sourceLabel,
            sourceUrl,
          }),
        });
        const createPayload = await createRes.json();
        if (
          !createRes.ok ||
          !createPayload?.success ||
          !createPayload?.data?.scanId
        )
          throw new Error(
            createPayload?.error || "Failed to create scan record.",
          );
        newScanId = String(createPayload.data.scanId);
        setScanId(newScanId);

        const runRes = await fetch(`/api/scans/${newScanId}/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mediaType: serverMediaType }),
        });
        if (runRes.status === 429)
          throw new Error("Scan limit reached. Please try again later.");
        if (!runRes.ok) {
          const errPayload = await runRes.json().catch(() => ({}));
          throw new Error(
            errPayload?.error || "Scan failed. Please try again.",
          );
        }
        const runPayload = await runRes.json();
        const scanResult = runPayload?.result;
        if (!scanResult) throw new Error("Scan failed. Please try again.");

        const completeRes = await fetch(`/api/scans/${newScanId}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ result: scanResult }),
        });
        const completePayload = await completeRes.json();
        if (!completeRes.ok || !completePayload?.success)
          throw new Error(
            completePayload?.error || "Failed to complete scan record.",
          );

        await refresh();
        setResult(scanResult);
        setStage("result");
        return;
      }

      if (!selectedFile) return;
      const sourceLabel = selectedFile.name || `${scanMediaType} input`;
      setStage("uploading");

      const uploadForm = new FormData();
      uploadForm.append("file", selectedFile);
      uploadForm.append("mediaType", serverMediaType);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: uploadForm,
      });
      const uploadPayload = await uploadRes.json();
      if (
        !uploadRes.ok ||
        !uploadPayload?.blobUrl ||
        !uploadPayload?.blobPathname
      )
        throw new Error(
          uploadPayload?.error || "Upload failed. Please try again.",
        );
      const { blobUrl, blobPathname } = uploadPayload;

      setStage("scanning");

      const createRes = await fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaType: serverMediaType,
          videoSource: "file",
          sourceLabel,
          sourceUrl: blobUrl,
          originalFilename: selectedFile.name,
        }),
      });
      const createPayload = await createRes.json();
      if (
        !createRes.ok ||
        !createPayload?.success ||
        !createPayload?.data?.scanId
      )
        throw new Error(
          createPayload?.error || "Failed to create scan record.",
        );
      newScanId = String(createPayload.data.scanId);
      setScanId(newScanId);

      const runRes = await fetch(`/api/scans/${newScanId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blobUrl,
          blobPathname,
          mediaType: serverMediaType,
        }),
      });
      if (runRes.status === 429)
        throw new Error("Scan limit reached. Please try again later.");
      if (!runRes.ok) {
        const errPayload = await runRes.json().catch(() => ({}));
        throw new Error(errPayload?.error || "Scan failed. Please try again.");
      }
      const runPayload = await runRes.json();
      const scanResult = runPayload?.result;
      if (!scanResult) throw new Error("Scan failed. Please try again.");

      const completeRes = await fetch(`/api/scans/${newScanId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result: scanResult }),
      });
      const completePayload = await completeRes.json();
      if (!completeRes.ok || !completePayload?.success)
        throw new Error(
          completePayload?.error || "Failed to complete scan record.",
        );

      await refresh();
      setResult(scanResult);
      setStage("result");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Scan failed. Please try again.";
      if (newScanId) {
        await fetch(`/api/scans/${newScanId}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ errorMessage: message }),
        }).catch(() => {});
      }
      setError(message);
      setStage("error");
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setVideoUrl("");
    setError("");
    setResult(null);
    setScanId(null);
    setStage("idle");
    setActiveTab("image");
    setInputMode("upload");
    setUrlPreflight({
      loading: false,
      detectedType: null,
      contentType: null,
      resolvedUrl: null,
      previewTitle: null,
      previewImage: null,
      previewSiteName: null,
      previewPlatform: null,
      previewDuration: null,
      error: null,
    });
    setPreview((prev) => {
      if (prev?.imageUrl) URL.revokeObjectURL(prev.imageUrl);
      return null;
    });
  };

  // URL preflight (unchanged)
  useEffect(() => {
    if (URL_METHOD_LOCKED || inputMode !== "url") return;
    const trimmed = videoUrl.trim();
    if (!trimmed) {
      setUrlPreflight({
        loading: false,
        detectedType: null,
        contentType: null,
        resolvedUrl: null,
        previewTitle: null,
        previewImage: null,
        previewSiteName: null,
        previewPlatform: null,
        previewDuration: null,
        error: null,
      });
      return;
    }
    const timeout = window.setTimeout(async () => {
      setUrlPreflight((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const r = await fetch("/api/scans/preflight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: trimmed }),
        });
        const p = await r.json();
        if (!r.ok || !p?.success || !p?.data?.detectedType)
          throw new Error(
            p?.error || "Unable to detect media type from this URL.",
          );
        const detectedType = p.data.detectedType as BaseMediaType;
        setUrlPreflight({
          loading: false,
          detectedType,
          contentType: p.data.contentType ?? null,
          resolvedUrl: p.data.resolvedUrl ?? trimmed,
          previewTitle: p.data.preview?.title ?? null,
          previewImage: p.data.preview?.image ?? null,
          previewSiteName: p.data.preview?.siteName ?? null,
          previewPlatform: p.data.preview?.platform ?? null,
          previewDuration:
            typeof p.data.preview?.duration === "number"
              ? p.data.preview.duration
              : null,
          error: null,
        });
        setActiveTab((prev) => {
          if (prev === "video-deep" && detectedType === "video") return prev;
          return detectedType;
        });
      } catch (e) {
        setUrlPreflight({
          loading: false,
          detectedType: null,
          contentType: null,
          resolvedUrl: null,
          previewTitle: null,
          previewImage: null,
          previewSiteName: null,
          previewPlatform: null,
          previewDuration: null,
          error:
            e instanceof Error
              ? e.message
              : "Unable to detect media type from this URL.",
        });
      }
    }, 450);
    return () => window.clearTimeout(timeout);
  }, [inputMode, videoUrl]);

  const effectiveActiveCost =
    activeTab === "image"
      ? effectiveCosts.image
      : activeTab === "audio"
        ? effectiveCosts.audio
        : activeTab === "video"
          ? effectiveCosts.video
          : effectiveCosts.deepVideo;
  const hasEnoughCredits = spendableBalance >= effectiveActiveCost;
  const currentDeepVideoCount =
    me?.subscription?.subscriptionDeepVideoCount ?? 0;

  const deepVideoState = useMemo(() => {
    if (me?.trial?.balance && me.trial.balance > 0)
      return {
        title: "Deep Video",
        availability: "Upgrade required",
        available: false,
      };
    if (activePlan && activePlan.deepVideo && hasSubscriptionCredits) {
      const remaining = Math.max(
        activePlan.deepVideoMonthly - currentDeepVideoCount,
        0,
      );
      return {
        title: "Deep Video",
        availability: `${remaining}/${activePlan.deepVideoMonthly} monthly left`,
        available: remaining > 0,
      };
    }
    if (me?.trial?.isPaidUser)
      return {
        title: "Deep Video",
        availability: `${effectiveCosts.deepVideo} cr · wallet`,
        available: true,
      };
    return {
      title: "Deep Video",
      availability: "Upgrade required",
      available: false,
    };
  }, [
    activePlan,
    currentDeepVideoCount,
    effectiveCosts.deepVideo,
    hasSubscriptionCredits,
    me?.trial?.balance,
    me?.trial?.isPaidUser,
  ]);

  const deepVideoBlockedMonthly = Boolean(
    activePlan &&
      activePlan.deepVideo &&
      hasSubscriptionCredits &&
      currentDeepVideoCount >= activePlan.deepVideoMonthly,
  );

  const onToggleDeep = () => {
    if (!userCanDeepVideo) return;
    if (deepVideoBlockedMonthly) return;
    setActiveTab((t) => (t === "video-deep" ? "video" : "video-deep"));
  };

  const onOverrideUploadType = (t: BaseMediaType) => {
    if (preview?.kind !== t) return; // only allow same-family override
    setActiveTab(t);
  };

  /* ───── render ───── */
  return (
    <AppPage>
      {/* Hero */}
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <span
            className="h-[7px] w-[7px] rounded-full bg-primary"
            style={{ animation: "pulse 1.6s ease-in-out infinite" }}
          />
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-dim">
            Scan workspace
          </span>
        </div>
        <AppPageHeader
          title="Analyze images, audio & video"
          description="Drop a file or paste a URL — type is detected automatically. Verdict, confidence, and generator breakdown in seconds."
        />
      </div>

      {/* 2-col on desktop, stacked mobile */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_340px]">
        {/* LEFT — input area */}
        <div className="flex flex-col gap-3">
          {/* Mode tabs */}
          <div className="flex w-fit gap-1 rounded-[12px] bg-surface p-1">
            <button
              onClick={() => {
                setInputMode("upload");
                setVideoUrl("");
                setError("");
                setReadyIfValid(selectedFile, "");
              }}
              disabled={isScanLocked}
              className={`rounded-[10px] px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                inputMode === "upload"
                  ? "bg-primary-dim text-primary"
                  : "text-text-dim hover:text-text"
              }`}
            >
              Upload
            </button>
            <button
              onClick={() => {
                setInputMode("url");
                setSelectedFile(null);
                setVideoUrl(URL_METHOD_LOCKED ? "" : videoUrl);
                setPreview((prev) => {
                  if (prev?.imageUrl) URL.revokeObjectURL(prev.imageUrl);
                  return null;
                });
                setUrlPreflight({
                  loading: false,
                  detectedType: null,
                  contentType: null,
                  resolvedUrl: null,
                  previewTitle: null,
                  previewImage: null,
                  previewSiteName: null,
                  previewPlatform: null,
                  previewDuration: null,
                  error: null,
                });
                setError("");
                if (!URL_METHOD_LOCKED) setReadyIfValid(null, videoUrl);
              }}
              disabled={isScanLocked}
              aria-disabled={URL_METHOD_LOCKED ? true : undefined}
              title={URL_METHOD_LOCKED ? "URL scanning — coming soon" : undefined}
              className={`flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                URL_METHOD_LOCKED
                  ? inputMode === "url"
                    ? "bg-warning/15 text-warning"
                    : "bg-warning/10 text-warning/90 hover:text-warning"
                  : inputMode === "url"
                    ? "bg-primary-dim text-primary"
                    : "text-text-dim hover:text-text"
              }`}
            >
              {URL_METHOD_LOCKED ? <Lock className="h-3 w-3" /> : null}
              URL
            </button>
          </div>

          {/* Upload mode */}
          {inputMode === "upload" ? (
            !selectedFile ? (
              <DropZoneV2
                onFile={(f) => void onPickFile(f)}
                disabled={isScanLocked}
                isPreparing={isPreparingFile}
              />
            ) : preview ? (
              <FilePreviewV2
                file={selectedFile}
                preview={preview}
                onClear={handleClear}
                onOverrideType={onOverrideUploadType}
                disabled={isScanLocked}
                effectiveType={activeTab}
              />
            ) : null
          ) : URL_METHOD_LOCKED ? (
            <LockedUrlPanel />
          ) : (
            <UrlInputV2
              value={videoUrl}
              onChange={(v) => {
                setVideoUrl(v);
                setSelectedFile(null);
                setPreview((prev) => {
                  if (prev?.imageUrl) URL.revokeObjectURL(prev.imageUrl);
                  return null;
                });
                setResult(null);
                setError("");
                setReadyIfValid(null, v);
              }}
              urlType={
                (urlPreflight.detectedType ??
                  (currentBaseType as BaseMediaType)) as BaseMediaType
              }
              onUrlType={(t) => {
                setActiveTab(t);
              }}
              disabled={isScanLocked}
            />
          )}

          {/* URL preview card */}
          {inputMode === "url" && hasUrlInput ? (
            <div className="overflow-hidden rounded-[18px] border border-border-subtle bg-surface">
              {urlPreflight.loading ? (
                <div className="p-4">
                  <div className="animate-pulse">
                    <div className="h-32 w-full rounded-[14px] bg-surface-hover" />
                    <div className="mt-3 h-3 w-24 rounded-full bg-surface-hover" />
                    <div className="mt-2 h-4 w-2/3 rounded-full bg-surface-hover" />
                  </div>
                  <div className="mt-3 text-sm text-text-dim">
                    Fetching preview…
                  </div>
                </div>
              ) : urlPreflight.error ? (
                <div className="px-4 py-3 text-[12px] text-danger">
                  {urlPreflight.error}
                </div>
              ) : urlPreflight.previewImage ||
                urlPreflight.previewTitle ||
                urlPreflight.resolvedUrl ? (
                <>
                  {urlPreflight.previewImage ? (
                    <img
                      src={urlPreflight.previewImage}
                      alt={urlPreflight.previewTitle || "URL preview"}
                      className="h-36 w-full object-cover"
                    />
                  ) : null}
                  <div className="p-3.5">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-text-dim">
                      {urlPreflight.previewSiteName ||
                        urlPreflight.previewPlatform ||
                        "Resolved preview"}
                    </div>
                    <div className="mt-1 text-[13px] font-semibold text-text">
                      {urlPreflight.previewTitle || "Media preview ready"}
                    </div>
                    {urlPreflight.previewPlatform ||
                    urlPreflight.previewDuration !== null ? (
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-text-dim">
                        {urlPreflight.previewPlatform ? (
                          <span className="rounded-full bg-bg px-2.5 py-1">
                            {urlPreflight.previewPlatform}
                          </span>
                        ) : null}
                        {urlPreflight.previewDuration !== null ? (
                          <span className="rounded-full bg-bg px-2.5 py-1">
                            {formatDurationLabel(urlPreflight.previewDuration)}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </>
              ) : null}
            </div>
          ) : null}

          {/* Inline error */}
          {error ? (
            <div className="flex items-center gap-2 rounded-2xl border border-danger/20 bg-danger/10 px-3.5 py-3">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-danger" />
              <span className="text-[12.5px] text-danger">{error}</span>
            </div>
          ) : null}

          {/* Scan config (only when there's input) */}
          {hasInput ? (
            <ScanConfigV2
              effectiveType={activeTab}
              cost={effectiveActiveCost}
              balance={spendableBalance}
              hasEnough={hasEnoughCredits}
              canScan={canScan}
              scanning={
                stage === "scanning" ||
                stage === "uploading" ||
                stage === "confirm"
              }
              errorLabel={error || null}
              deepVideoVisible={
                currentBaseType === "video" && (selectedFile || hasUrlInput)
                  ? true
                  : false
              }
              deepVideoActive={activeTab === "video-deep"}
              deepVideoDisabled={
                isScanLocked ||
                !userCanDeepVideo ||
                deepVideoBlockedMonthly ||
                Boolean(me?.trial?.balance && me.trial.balance > 0)
              }
              deepVideoCost={effectiveCosts.deepVideo}
              deepVideoSubtitle={deepVideoState.availability}
              onToggleDeep={onToggleDeep}
              smartButton={
                activeTab === "video-deep" && !userCanDeepVideo ? (
                  <Link
                    href="/subscription"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary/15 px-3 py-3 text-sm font-bold text-primary"
                  >
                    Deep Video requires Pro — Upgrade →
                  </Link>
                ) : (
                  <SmartButton
                    label={`Run scan — ${effectiveActiveCost} cr`}
                    confirmLabel={`Confirm? ${effectiveActiveCost} cr will be used · Tap again`}
                    loadingLabel={
                      stage === "uploading" ? "Uploading…" : "Analyzing…"
                    }
                    errorLabel="Scan failed · Tap to retry"
                    successOnResolve={false}
                    requiresConfirm
                    loading={stage === "uploading" || stage === "scanning"}
                    error={
                      stage === "error" ? error || "Scan failed" : null
                    }
                    disabled={isScanLocked || !canScan || !me}
                    className="w-full py-3"
                    onRetry={() => {
                      setStage("ready");
                      setError("");
                    }}
                    onClick={handleAnalyze}
                  />
                )
              }
            />
          ) : null}

          {isUploadedState ? (
            <button
              onClick={handleClear}
              disabled={isScanLocked}
              className="rounded-xl border border-border bg-surface px-3 py-2 text-[12px] font-semibold text-text-muted transition hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear and start over
            </button>
          ) : null}

          <input
            ref={fileInputRef}
            type="file"
            accept={FILE_ACCEPT}
            className="hidden"
            disabled={isScanLocked}
            onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {/* RIGHT — result panel */}
        <div className="lg:sticky lg:top-6">
          {stage === "idle" ? (
            <div className="rounded-2xl border border-border bg-surface px-5 py-8">
              <div className="text-center">
                <div
                  className="mx-auto mb-3 flex items-center justify-center rounded-2xl bg-primary-dim"
                  style={{ height: 52, width: 52 }}
                >
                  <Search className="h-5 w-5 text-primary" />
                </div>
                <div className="text-sm font-semibold text-text">
                  Analyze your first file
                </div>
                <div className="mt-1 text-[12px] text-text-muted">
                  Upload or paste a URL to start.
                </div>
              </div>
              <div className="mt-5 space-y-2">
                {[
                  ["Speed", "Fast perception"],
                  ["Verdict", "Authentic / AI / Mixed"],
                  ["Output", "Confidence + summary"],
                ].map(([l, v]) => (
                  <div
                    key={l}
                    className="flex items-center gap-2.5 rounded-xl border border-border-subtle bg-surface-hover px-3 py-2.5"
                  >
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary-dim">
                      <Zap className="h-3 w-3 text-primary" />
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-text">
                        {l}
                      </div>
                      <div className="text-[11px] text-text-dim">{v}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <ResultPanel
              stage={stage}
              result={result}
              activeTab={activeTab}
              upsell={resultUpsell}
              onReset={handleClear}
            />
          )}
        </div>
      </div>
    </AppPage>
  );
}
