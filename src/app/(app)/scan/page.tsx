"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  FileAudio2,
  Film,
  Link2,
  Upload,
  X,
} from "lucide-react";
import { useAppMe } from "@/hooks/use-app-me";
import { TABS } from "@/components/universal-detector/data";
import ResultPanel from "@/components/universal-detector/ResultPanel";
import { getScanUpsellState } from "@/components/universal-detector/scan-upsell";
import type {
  MediaType,
  ScanResult,
  ScanStage,
} from "@/components/universal-detector/types";
import { AppButton } from "@/components/app-shell/AppButton";
import { SmartButton } from "@/components/ui/SmartButton";
import {
  AppPage,
  AppPageHeader,
  AppSectionHeader,
} from "@/components/app-shell/AppPage";
import { formatBytes } from "@/components/universal-detector/utils";
import { PLANS } from "@/lib/billing/plans";
import { FREE_SCAN_PRICES, SCAN_PRICES } from "@/lib/billing/pricing.constants";

const FILE_ACCEPT =
  "image/png,image/jpeg,image/webp,audio/mp3,audio/wav,audio/m4a,audio/mpeg,video/mp4,video/quicktime,video/webm";
type BaseMediaType = Exclude<MediaType, "video-deep">;

const URL_MEDIA_TYPES: Array<{ type: BaseMediaType; label: string }> = [
  { type: "image", label: "Image" },
  { type: "audio", label: "Audio" },
  { type: "video", label: "Video" },
];

const SCAN_LIMITS = {
  image: {
    maxSizeMb: 10,
    accepts: ["image/png", "image/jpeg", "image/webp"],
  },
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
  const fileType = file.type.toLowerCase();
  if (fileType.startsWith("image/")) return "image";
  if (fileType.startsWith("audio/")) return "audio";
  if (fileType.startsWith("video/")) return "video";
  return null;
}

function formatDetectedTypeLabel(type: BaseMediaType) {
  if (type === "image") return "Image detected";
  if (type === "audio") return "Audio detected";
  return "Video detected";
}

function formatDurationLabel(totalSeconds: number | null) {
  if (totalSeconds === null || totalSeconds < 0) return null;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0)
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatFileSubtype(file: File) {
  const fileType = file.type.toLowerCase();
  if (fileType.includes("png")) return "PNG";
  if (fileType.includes("jpeg") || fileType.includes("jpg")) return "JPG";
  if (fileType.includes("webp")) return "WEBP";
  if (fileType.includes("mpeg") || fileType.includes("mp3")) return "MP3";
  if (fileType.includes("wav")) return "WAV";
  if (fileType.includes("m4a") || fileType.includes("mp4"))
    return fileType.startsWith("audio/") ? "M4A" : "MP4";
  if (fileType.includes("quicktime")) return "MOV";
  if (fileType.includes("webm")) return "WEBM";
  return file.type
    ? (file.type.split("/")[1]?.toUpperCase() ?? "FILE")
    : "FILE";
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const safe = Math.max(0, Math.round(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function buildLimitError(type: BaseMediaType, value: number) {
  if (type === "audio")
    return `Audio exceeds 5 min limit (currently ${formatDuration(value)}).`;
  return `Video exceeds 15 min limit (currently ${formatDuration(value)}).`;
}

async function getMediaDuration(file: File, kind: "audio" | "video") {
  const objectUrl = URL.createObjectURL(file);
  try {
    const duration = await new Promise<number>((resolve, reject) => {
      const media = document.createElement(kind);
      media.preload = "metadata";
      media.onloadedmetadata = () => resolve(media.duration || 0);
      media.onerror = () =>
        reject(new Error(`Unable to read ${kind} duration.`));
      media.src = objectUrl;
    });
    return duration;
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
        const targetTime = Math.min(1, Math.max(0, (video.duration || 0) / 4));
        video.currentTime = targetTime;
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
        } catch (error) {
          reject(
            error instanceof Error
              ? error
              : new Error("Unable to capture thumbnail."),
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
  const detectedType = detectMediaType(file);
  if (!detectedType) throw new Error("Unsupported file type.");

  const sizeMb = file.size / (1024 * 1024);
  const sizeText = formatBytes(file.size);
  const subtype = formatFileSubtype(file);
  const basePreview = {
    kind: detectedType,
    label: formatDetectedTypeLabel(detectedType),
    subtype,
    sizeText,
    valid: true,
  } as PreviewState;

  const limit = SCAN_LIMITS[detectedType];
  if (sizeMb > limit.maxSizeMb) {
    return {
      type: detectedType,
      preview: {
        ...basePreview,
        valid: false,
        validationMessage: `File too large — max ${limit.maxSizeMb}MB.`,
      },
    };
  }

  if (detectedType === "image") {
    return {
      type: detectedType,
      preview: {
        ...basePreview,
        imageUrl: URL.createObjectURL(file),
      },
    };
  }

  if (detectedType === "audio") {
    const duration = await getMediaDuration(file, "audio");
    if (duration > SCAN_LIMITS.audio.maxDurationSec) {
      return {
        type: detectedType,
        preview: {
          ...basePreview,
          valid: false,
          durationText: formatDuration(duration),
          validationMessage: buildLimitError("audio", duration),
        },
      };
    }

    return {
      type: detectedType,
      preview: {
        ...basePreview,
        durationText: formatDuration(duration),
      },
    };
  }

  const duration = await getMediaDuration(file, "video");
  const thumbnailUrl = await getVideoThumbnail(file);
  if (duration > SCAN_LIMITS.video.maxDurationSec) {
    return {
      type: detectedType,
      preview: {
        ...basePreview,
        valid: false,
        durationText: formatDuration(duration),
        thumbnailUrl,
        validationMessage: buildLimitError("video", duration),
      },
    };
  }

  return {
    type: detectedType,
    preview: {
      ...basePreview,
      durationText: formatDuration(duration),
      thumbnailUrl,
    },
  };
}

function ScanPreviewCard({
  preview,
  fileName,
  onClear,
  disabled,
}: {
  preview: PreviewState;
  fileName: string;
  onClear: () => void;
  disabled: boolean;
}) {
  return (
    <div className="mt-4 rounded-2xl bg-bg p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary-dim">
            {preview.kind === "image" && preview.imageUrl ? (
              <img
                src={preview.imageUrl}
                alt={fileName}
                className="h-full w-full object-cover"
              />
            ) : preview.kind === "video" && preview.thumbnailUrl ? (
              <img
                src={preview.thumbnailUrl}
                alt={fileName}
                className="h-full w-full object-cover"
              />
            ) : preview.kind === "audio" ? (
              <FileAudio2 className="h-6 w-6 text-primary" />
            ) : (
              <Film className="h-6 w-6 text-primary" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-text">{fileName}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
              <span>{preview.label}</span>
              <span>·</span>
              <span>{preview.subtype}</span>
              <span>·</span>
              <span>{preview.sizeText}</span>
              {preview.durationText ? (
                <>
                  <span>·</span>
                  <span>{preview.durationText}</span>
                </>
              ) : null}
            </div>
            <div
              className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] ${preview.valid ? "bg-success-dim text-success" : "bg-danger/10 text-danger"}`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {preview.valid ? "Ready to scan" : preview.validationMessage}
            </div>
          </div>
        </div>
        <button
          onClick={onClear}
          disabled={disabled}
          className="rounded-xl bg-surface p-2 text-text-muted transition hover:bg-surface-hover hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

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

  const isPaidUser = me?.trial?.isPaidUser ?? false;
  const trialBalance = me?.trial?.balance ?? 0;
  const subscriptionBalance = me?.subscription?.subscriptionCreditBalance ?? 0;
  const walletBalance = me?.wallet?.balance ?? 0;
  const spendableBalance = trialBalance + subscriptionBalance + walletBalance;

  const activeConfig = useMemo(
    () => TABS.find((tab) => tab.type === activeTab) ?? TABS[0],
    [activeTab],
  );
  const subscriptionPlanId = me?.subscription?.subscriptionPlanId ?? null;
  const activePlan = useMemo(() => {
    if (
      !me?.subscription ||
      (me.subscription.status !== "ACTIVE" &&
        me.subscription.status !== "ON_TRIAL")
    ) {
      return null;
    }
    if (subscriptionPlanId === "basic") return PLANS.basic;
    if (subscriptionPlanId === "pro_ea") return PLANS.pro_ea;
    if (subscriptionPlanId === "pro_loyalty") return PLANS.pro_loyalty;
    if (subscriptionPlanId === "pro_normal") return PLANS.pro_normal;
    if (subscriptionPlanId === "pro") {
      if (me.subscription.subscriptionPriceLocked || me.earlyAccessEligible) {
        return PLANS.pro_ea;
      }
      if (
        me.subscription.subscriptionPriceCents === PLANS.pro_loyalty.priceCents
      ) {
        return PLANS.pro_loyalty;
      }
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
    usesSubscriberRates && (me?.subscription?.subscriptionCreditBalance ?? 0) > 0,
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
  const hasInput = Boolean(selectedFile || hasUrlInput);
  const userCanDeepVideo = Boolean(activePlan?.deepVideo);
  const isScanLocked =
    stage === "confirm" || stage === "uploading" || stage === "scanning" || isPreparingFile;
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
      if (prepared.preview.valid) {
        setReadyIfValid(file, undefined, true);
      } else {
        setError(
          prepared.preview.validationMessage || "File validation failed.",
        );
        setReadyIfValid(file, undefined, false);
      }
    } catch (scanError) {
      setSelectedFile(null);
      setPreview((prev) => {
        if (prev?.imageUrl) URL.revokeObjectURL(prev.imageUrl);
        return null;
      });
      setError(
        scanError instanceof Error
          ? scanError.message
          : "Unable to process selected file.",
      );
      setStage("error");
    } finally {
      setIsPreparingFile(false);
    }
  };

  const getCurrentScanMediaType = (): MediaType => {
    if (inputMode === "upload" && selectedFile) {
      const detectedType = detectMediaType(selectedFile);
      if (detectedType === "video" && activeTab === "video-deep") {
        return "video-deep";
      }
      return detectedType ?? activeTab;
    }

    if (inputMode === "url" && urlPreflight.detectedType) {
      if (urlPreflight.detectedType === "video" && activeTab === "video-deep") {
        return "video-deep";
      }
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
    if (activeTab === "video-deep" && !userCanDeepVideo) {
      return;
    }
    if (!hasEnoughCredits) {
      return;
    }
    setError("");
    await handleConfirm();
  };

  const handleConfirm = async () => {
    const scanMediaType = getCurrentScanMediaType();
    const serverMediaType = toServerMediaType(scanMediaType);
    if (scanMediaType !== activeTab) {
      setActiveTab(scanMediaType);
    }
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
        ) {
          throw new Error(
            createPayload?.error || "Failed to create scan record.",
          );
        }

        newScanId = String(createPayload.data.scanId);
        setScanId(newScanId);

        const runRes = await fetch(`/api/scans/${newScanId}/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mediaType: serverMediaType }),
        });

        if (runRes.status === 429) {
          throw new Error("Scan limit reached. Please try again later.");
        }

        if (!runRes.ok) {
          const errPayload = await runRes.json().catch(() => ({}));
          throw new Error(errPayload?.error || "Scan failed. Please try again.");
        }

        const runPayload = await runRes.json();
        const scanResult = runPayload?.result;
        if (!scanResult) {
          throw new Error("Scan failed. Please try again.");
        }

        const completeRes = await fetch(`/api/scans/${newScanId}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ result: scanResult }),
        });
        const completePayload = await completeRes.json();

        if (!completeRes.ok || !completePayload?.success) {
          throw new Error(
            completePayload?.error || "Failed to complete scan record.",
          );
        }

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
      ) {
        throw new Error(uploadPayload?.error || "Upload failed. Please try again.");
      }

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
      ) {
        throw new Error(
          createPayload?.error || "Failed to create scan record.",
        );
      }

      newScanId = String(createPayload.data.scanId);
      setScanId(newScanId);

      const runRes = await fetch(`/api/scans/${newScanId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blobUrl, blobPathname, mediaType: serverMediaType }),
      });

      if (runRes.status === 429) {
        throw new Error("Scan limit reached. Please try again later.");
      }

      if (!runRes.ok) {
        const errPayload = await runRes.json().catch(() => ({}));
        throw new Error(errPayload?.error || "Scan failed. Please try again.");
      }

      const runPayload = await runRes.json();
      const scanResult = runPayload?.result;
      if (!scanResult) {
        throw new Error("Scan failed. Please try again.");
      }

      const completeRes = await fetch(`/api/scans/${newScanId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result: scanResult }),
      });
      const completePayload = await completeRes.json();

      if (!completeRes.ok || !completePayload?.success) {
        throw new Error(
          completePayload?.error || "Failed to complete scan record.",
        );
      }

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

  useEffect(() => {
    if (inputMode !== "url") return;
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
        const response = await fetch("/api/scans/preflight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: trimmed }),
        });
        const payload = await response.json();
        if (!response.ok || !payload?.success || !payload?.data?.detectedType) {
          throw new Error(
            payload?.error || "Unable to detect media type from this URL.",
          );
        }
        const detectedType = payload.data.detectedType as BaseMediaType;
        setUrlPreflight({
          loading: false,
          detectedType,
          contentType: payload.data.contentType ?? null,
          resolvedUrl: payload.data.resolvedUrl ?? trimmed,
          previewTitle: payload.data.preview?.title ?? null,
          previewImage: payload.data.preview?.image ?? null,
          previewSiteName: payload.data.preview?.siteName ?? null,
          previewPlatform: payload.data.preview?.platform ?? null,
          previewDuration:
            typeof payload.data.preview?.duration === "number"
              ? payload.data.preview.duration
              : null,
          error: null,
        });
        setActiveTab((prev) => {
          if (prev === "video-deep" && detectedType === "video") return prev;
          return detectedType;
        });
      } catch (preflightError) {
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
            preflightError instanceof Error
              ? preflightError.message
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
    if (me?.trial?.balance && me.trial.balance > 0) {
      return {
        title: "Deep Video",
        description: "Blocked during trial.",
        availability: "Upgrade required",
        available: false,
      };
    }

    if (activePlan && activePlan.deepVideo && hasSubscriptionCredits) {
      const remaining = Math.max(
        activePlan.deepVideoMonthly - currentDeepVideoCount,
        0,
      );
      return {
        title: "Deep Video",
        description: `${activePlan.name} plan deep scan pricing applies.`,
        availability: `${remaining}/${activePlan.deepVideoMonthly} monthly deep scans left`,
        available: remaining > 0,
      };
    }

    if (me?.trial?.isPaidUser) {
      return {
        title: "Deep Video",
        description: "Available with wallet pricing.",
        availability: `${effectiveCosts.deepVideo} credits`,
        available: true,
      };
    }

    return {
      title: "Deep Video",
      description: "Requires Pro plan.",
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

  return (
    <AppPage>
      <AppPageHeader
        title="Analyze images, audio, and video"
        description="Upload a file or paste a public media link to generate a result with verdict, confidence, and next actions."
      />

      <section className="mt-8 space-y-8">
        <div className="space-y-4 sm:space-y-5">
          <div>
            <AppSectionHeader
              title="Upload media"
              icon={
                inputMode === "upload"
                  ? "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"
                  : "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
              }
            />
            <div className="rounded-[24px] border border-border/70 bg-surface p-4 shadow-[0_0_0_1px_rgba(138,180,248,0.03)] sm:p-5">
              <div className="space-y-5">
                <div>
                  <div className="flex w-fit gap-1 rounded-[12px] bg-bg p-1">
                    <button
                      onClick={() => {
                        setInputMode("upload");
                        setVideoUrl("");
                        setError("");
                        setReadyIfValid(selectedFile, "");
                      }}
                      disabled={isScanLocked}
                      className={`rounded-[10px] px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${inputMode === "upload" ? "bg-primary-dim text-primary" : "text-text-dim hover:text-text"}`}
                    >
                      Upload
                    </button>
                    <button
                      onClick={() => {
                        setInputMode("url");
                        setSelectedFile(null);
                        setPreview((prev) => {
                          if (prev?.imageUrl)
                            URL.revokeObjectURL(prev.imageUrl);
                          return null;
                        });
                        setError("");
                        setReadyIfValid(null, videoUrl);
                      }}
                      disabled={isScanLocked}
                      className={`rounded-[10px] px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${inputMode === "url" ? "bg-primary-dim text-primary" : "text-text-dim hover:text-text"}`}
                    >
                      URL
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-text-muted">
                    {inputMode === "upload"
                      ? "One drop zone for images, audio, and video."
                      : "Paste a public media link to fetch preview details before scanning."}
                  </p>

                  {inputMode === "upload" ? (
                    !selectedFile ? (
                      <div className="mt-4 rounded-[24px] border border-dashed border-border bg-bg px-6 py-8 text-center sm:px-8 sm:py-10">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-dim">
                          <Upload className="h-5 w-5 text-primary" />
                        </div>
                        <p className="mt-4 text-sm font-medium text-text">
                          Drop your file here
                        </p>
                        <p className="mt-1 text-xs text-text-muted">
                          PNG, JPG, WEBP, MP3, WAV, M4A, MP4, MOV, WEBM
                        </p>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isScanLocked}
                          className="mt-4 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-text transition hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isPreparingFile ? "Preparing file…" : "Browse media"}
                        </button>
                      </div>
                    ) : preview ? (
                      <ScanPreviewCard
                        preview={preview}
                        fileName={selectedFile.name}
                        onClear={handleClear}
                        disabled={isScanLocked}
                      />
                    ) : null
                  ) : (
                    <div className="mt-4 rounded-[20px] border border-border/70 bg-bg p-4">
                      <div>
                        <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-text">
                          Enter URL
                        </div>
                        <div className="flex items-center gap-2 rounded-2xl bg-surface px-3">
                          <Link2 className="h-4 w-4 shrink-0 text-text-dim" />
                          <input
                            type="url"
                            value={videoUrl}
                            disabled={isScanLocked}
                            onChange={(e) => {
                              const value = e.target.value;
                              setVideoUrl(value);
                              setSelectedFile(null);
                              setPreview((prev) => {
                                if (prev?.imageUrl)
                                  URL.revokeObjectURL(prev.imageUrl);
                                return null;
                              });
                              setResult(null);
                              setError("");
                              setReadyIfValid(null, value);
                            }}
                            placeholder="https://youtube.com/... or direct media URL"
                            className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-text-dim disabled:cursor-not-allowed disabled:opacity-60"
                          />
                          {videoUrl ? (
                            <button
                              onClick={() => {
                                setVideoUrl("");
                                setError("");
                                setReadyIfValid(null, "");
                              }}
                              disabled={isScanLocked}
                              className="text-text-muted hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          ) : null}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-text-dim">
                          <span className="rounded-full bg-surface px-2.5 py-1">
                            TikTok
                          </span>
                          <span className="rounded-full bg-surface px-2.5 py-1">
                            YouTube
                          </span>
                          <span className="rounded-full bg-surface px-2.5 py-1">
                            Instagram
                          </span>
                          <span className="rounded-full bg-surface px-2.5 py-1">
                            Direct media links
                          </span>
                        </div>
                      </div>

                      {currentBaseType === "video" ? (
                        <div className="mt-4">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-text">
                              Video mode
                            </p>
                            <span className="text-[11px] text-text-dim">
                              Choose review depth
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setActiveTab("video")}
                              disabled={isScanLocked}
                              className={`rounded-[16px] border px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${activeTab === "video" ? "border-primary/20 bg-primary-dim" : "border-border-subtle bg-surface hover:bg-surface-hover"}`}
                            >
                              <div
                                className={`text-[13px] font-semibold ${activeTab === "video" ? "text-primary" : "text-text"}`}
                              >
                                Standard Video
                              </div>
                              <div className="mt-1 text-[11px] text-text-dim">
                                Fast review · {effectiveCosts.video} credits
                              </div>
                            </button>

                            <button
                              onClick={() => {
                                if (!userCanDeepVideo) return;
                                if (
                                  activePlan &&
                                  activePlan.deepVideo &&
                                  hasSubscriptionCredits &&
                                  currentDeepVideoCount >=
                                    activePlan.deepVideoMonthly
                                ) {
                                  return;
                                }
                                setActiveTab("video-deep");
                              }}
                              disabled={
                                isScanLocked ||
                                !userCanDeepVideo ||
                                (activePlan && activePlan.deepVideo && hasSubscriptionCredits
                                  ? currentDeepVideoCount >=
                                    activePlan.deepVideoMonthly
                                  : false)
                              }
                              className={`rounded-[16px] border px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${activeTab === "video-deep" ? "border-primary/20 bg-primary-dim" : "border-border-subtle bg-surface hover:bg-surface-hover"}`}
                            >
                              <div
                                className={`text-[13px] font-semibold ${activeTab === "video-deep" ? "text-primary" : "text-text"}`}
                              >
                                {deepVideoState.title}
                              </div>
                              <div className="mt-1 text-[11px] text-text-dim">
                                {effectiveCosts.deepVideo} credits ·{" "}
                                {deepVideoState.availability}
                              </div>
                            </button>
                          </div>
                        </div>
                      ) : null}

                      <div className="mt-4">
                        <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-text">
                          Video preview
                        </div>
                        {urlPreflight.loading ? (
                          <div className="overflow-hidden rounded-[18px] border border-border-subtle bg-surface p-4">
                            <div className="animate-pulse">
                              <div className="h-36 w-full rounded-[14px] bg-surface-hover" />
                              <div className="mt-4 h-3 w-24 rounded-full bg-surface-hover" />
                              <div className="mt-2 h-4 w-2/3 rounded-full bg-surface-hover" />
                              <div className="mt-3 flex gap-2">
                                <div className="h-7 w-20 rounded-full bg-surface-hover" />
                                <div className="h-7 w-16 rounded-full bg-surface-hover" />
                              </div>
                            </div>
                            <div className="mt-4 text-sm text-text-dim">
                              Fetching video preview…
                            </div>
                          </div>
                        ) : urlPreflight.previewImage ||
                          urlPreflight.previewTitle ||
                          urlPreflight.resolvedUrl ? (
                          <div className="overflow-hidden rounded-[18px] border border-border-subtle bg-surface">
                            {urlPreflight.previewImage ? (
                              <img
                                src={urlPreflight.previewImage}
                                alt={urlPreflight.previewTitle || "URL preview"}
                                className="h-40 w-full object-cover"
                              />
                            ) : null}
                            <div className="p-4">
                              <div className="text-[10px] uppercase tracking-[0.12em] text-text-dim">
                                {urlPreflight.previewSiteName ||
                                  urlPreflight.previewPlatform ||
                                  "Resolved preview"}
                              </div>
                              <div className="mt-1 text-sm font-semibold text-text">
                                {urlPreflight.previewTitle ||
                                  "Media preview ready"}
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
                                      {formatDurationLabel(
                                        urlPreflight.previewDuration,
                                      )}
                                    </span>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-[18px] border border-border-subtle bg-surface px-4 py-4 text-sm text-text-dim">
                            Paste a video URL to fetch preview details.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {inputMode === "upload" ? (
                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-text-dim">
                      Detected scan type
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {URL_MEDIA_TYPES.map((item) => {
                        const itemCost =
                          item.type === "image"
                            ? effectiveCosts.image
                            : item.type === "audio"
                              ? effectiveCosts.audio
                              : effectiveCosts.video;
                        const lockedByFileFamily = Boolean(
                          selectedFile &&
                          preview?.kind &&
                          preview.kind !== item.type,
                        );
                        return (
                          <button
                            key={item.type}
                            onClick={() => {
                              if (lockedByFileFamily) return;
                              setActiveTab(item.type);
                              setResult(null);
                              setError("");
                            }}
                            disabled={isScanLocked || lockedByFileFamily}
                            className={`rounded-[14px] border px-3 py-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${currentBaseType === item.type ? "border-primary/20 bg-primary-dim" : "border-border-subtle bg-surface hover:bg-surface-hover"}`}
                          >
                            <div
                              className={`text-[13px] font-semibold ${currentBaseType === item.type ? "text-primary" : "text-text"}`}
                            >
                              {item.label}
                            </div>
                            <div className="mt-0.5 text-[11px] text-text-dim">
                              {!me && item.type !== "video" ? (
                                <span className="balance-shimmer block h-3 w-12 rounded-full" />
                              ) : (
                                <span>{itemCost} credits</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {currentBaseType === "video" && inputMode !== "url" ? (
                  <div className="mt-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-text-dim">
                        Video mode
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setActiveTab("video")}
                        disabled={isScanLocked}
                        className={`rounded-[16px] border px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${activeTab === "video" ? "border-primary/20 bg-primary-dim" : "border-border-subtle bg-surface hover:bg-surface-hover"}`}
                      >
                        <div
                          className={`text-[13px] font-semibold ${activeTab === "video" ? "text-primary" : "text-text"}`}
                        >
                          Standard Video
                        </div>
                        <div className="mt-1 text-[11px] text-text-dim">
                          Fast review · {effectiveCosts.video} credits
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          if (!userCanDeepVideo) return;
                          if (
                            activePlan &&
                            activePlan.deepVideo &&
                            hasSubscriptionCredits &&
                            currentDeepVideoCount >=
                              activePlan.deepVideoMonthly
                          ) {
                            return;
                          }
                          setActiveTab("video-deep");
                        }}
                        disabled={
                          isScanLocked ||
                          !userCanDeepVideo ||
                          (activePlan && activePlan.deepVideo && hasSubscriptionCredits
                            ? currentDeepVideoCount >=
                              activePlan.deepVideoMonthly
                            : false)
                        }
                        className={`rounded-[16px] border px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${activeTab === "video-deep" ? "border-primary/20 bg-primary-dim" : "border-border-subtle bg-surface hover:bg-surface-hover"}`}
                      >
                        <div
                          className={`text-[13px] font-semibold ${activeTab === "video-deep" ? "text-primary" : "text-text"}`}
                        >
                          {deepVideoState.title}
                        </div>
                        <div className="mt-1 text-[11px] text-text-dim">
                          {effectiveCosts.deepVideo} credits ·{" "}
                          {deepVideoState.availability}
                        </div>
                      </button>
                    </div>
                  </div>
                ) : null}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={FILE_ACCEPT}
                  className="hidden"
                  disabled={isScanLocked}
                  onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
                />

                {error ? (
                  <div className="flex items-start gap-2 rounded-2xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
                    <span className="mt-0.5">⚠️</span>
                    {error}
                  </div>
                ) : null}

                {hasInput ? (
                  <>
                    <div className="flex items-center text-sm text-text-muted">
                      {!me ? (
                        <span className="balance-shimmer block h-4 w-20 rounded-full" />
                      ) : (
                        <span>Available: {spendableBalance.toLocaleString()}</span>
                      )}
                      <span className="px-2 text-text-dim">•</span>
                      {!me ? (
                        <span className="balance-shimmer block h-4 w-16 rounded-full" />
                      ) : (
                        <span>Cost: {effectiveActiveCost} credits</span>
                      )}
                    </div>

                    {activeTab === "video-deep" && !userCanDeepVideo ? (
                      <div className="rounded-[12px] border border-border bg-surface2 p-4 text-center">
                        <p className="text-[13px] font-semibold text-text">
                          Deep Video requires Pro plan
                        </p>
                        <p className="mt-1 text-[11px] text-text-dim">
                          15 deep video scans per month included
                        </p>
                        <Link
                          href="/subscription"
                          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1.5 text-[11px] font-semibold text-primary"
                        >
                          Upgrade to Pro →
                        </Link>
                      </div>
                    ) : !hasEnoughCredits && me ? (
                      <div className="rounded-[12px] border border-warning/30 bg-warning/10 p-3 text-center">
                        <p className="text-[12px] font-semibold text-warning">
                          Not enough credits
                        </p>
                        <p className="mt-0.5 text-[11px] text-text-dim">
                          You need {effectiveActiveCost} cr · You have {spendableBalance} cr
                        </p>
                        <Link
                          href="/credits"
                          className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1.5 text-[11px] font-semibold text-primary"
                        >
                          Top up wallet →
                        </Link>
                      </div>
                    ) : (
                      <SmartButton
                        label={`Run scan — ${effectiveActiveCost} cr`}
                        confirmLabel={`Confirm? ${effectiveActiveCost} cr will be used · Tap again`}
                        loadingLabel={stage === "uploading" ? "Uploading..." : "Analyzing..."}
                        errorLabel="Scan failed · Tap to retry"
                        successOnResolve={false}
                        requiresConfirm
                        loading={stage === "uploading" || stage === "scanning"}
                        error={stage === "error" ? error || "Scan failed" : null}
                        disabled={isScanLocked || !canScan || !me}
                        className="w-full py-3"
                        onClick={handleAnalyze}
                      />
                    )}

                    {isUploadedState ? (
                      <AppButton
                        onClick={handleClear}
                        disabled={isScanLocked}
                        variant="ghost"
                        size="md"
                        fullWidth
                      >
                        Clear and start over
                      </AppButton>
                    ) : null}
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div>
          <AppSectionHeader
            title="Result summary"
            icon="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0"
          />
          <ResultPanel
            stage={stage}
            result={result}
            activeTab={activeTab}
            upsell={resultUpsell}
            onReset={handleClear}
          />
        </div>
      </section>

    </AppPage>
  );
}
