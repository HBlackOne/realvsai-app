import { Activity, AudioLines, BadgeCheck, Coins, FileSearch, FileVideo, ScanLine, ShieldCheck, WandSparkles } from "lucide-react";
import { SCAN_PRICES } from "@/lib/billing/pricing.constants";
import type { DetectorTab, MediaType, ScanResult } from "./types";

export const TABS: DetectorTab[] = [
  { type: "image", icon: ScanLine, label: "Image", cost: SCAN_PRICES.image },
  { type: "audio", icon: AudioLines, label: "Audio", cost: SCAN_PRICES.audio },
  { type: "video", icon: FileVideo, label: "Video", cost: SCAN_PRICES.video15 },
  { type: "video-deep", icon: FileVideo, label: "Video Deep", cost: SCAN_PRICES.video60 },
];

export const WORKFLOW_TIPS = [
  "We only deduct balance after a successful scan.",
  "Video URLs work best when public and directly accessible.",
  "Higher-quality media usually gives cleaner confidence scores.",
];

export const RESULT_PLACEHOLDER_ITEMS = [
  "Verdict summary card",
  "AI vs human confidence bars",
  "Generator fingerprint breakdown",
  "Technical metadata + scan info",
  "Raw response accordion",
];

export const STATUS_CHIP_CONFIG = [
  { key: "workspace", icon: Activity, label: "Workspace status" },
  { key: "source", icon: FileSearch, label: "Selected source" },
  { key: "charge", icon: BadgeCheck, label: "Charge rule" },
] as const;

export const HEADER_STAT_CONFIG = {
  badgeIcon: WandSparkles,
  creditsIcon: Coins,
  costIcon: ShieldCheck,
};

export const MOCK_RESULTS: Record<MediaType, ScanResult> = {
  image: {
    verdict: "AI Generated",
    confidence: 87,
    aiScore: 0.87,
    humanScore: 0.13,
    explanation: "Synthetic texture patterns and generator fingerprints were detected in the uploaded image.",
    processingTime: "8 sec",
    creditsUsed: 3,
    sourceLabel: "uploaded image",
    generators: [
      { name: "Midjourney", score: 0.72 },
      { name: "DALL·E 3", score: 0.18 },
      { name: "Stable Diffusion", score: 0.06 },
      { name: "Flux", score: 0.03 },
      { name: "Other", score: 0.01 },
    ],
  },
  video: {
    verdict: "Mixed",
    confidence: 61,
    aiScore: 0.61,
    humanScore: 0.39,
    explanation: "The video contains mixed signals, so a stronger verdict would need a deeper review.",
    processingTime: "16 sec",
    creditsUsed: 30,
    sourceLabel: "video source",
    generators: [
      { name: "FaceSwap", score: 0.33 },
      { name: "Runway", score: 0.24 },
      { name: "Synthesia", score: 0.17 },
      { name: "HeyGen", score: 0.14 },
      { name: "Other", score: 0.12 },
    ],
  },
  "video-deep": {
    verdict: "AI Generated",
    confidence: 91,
    aiScore: 0.91,
    humanScore: 0.09,
    explanation: "Deep analysis found strong synthetic patterns across facial consistency, motion, and generator traces.",
    processingTime: "32 sec",
    creditsUsed: 300,
    sourceLabel: "video source",
    generators: [
      { name: "Deepfake Studio", score: 0.61 },
      { name: "Sora", score: 0.22 },
      { name: "Runway Gen-3", score: 0.11 },
      { name: "Other", score: 0.06 },
    ],
  },
  audio: {
    verdict: "Authentic",
    confidence: 74,
    aiScore: 0.26,
    humanScore: 0.74,
    explanation: "The clip shows stronger human voice markers than synthetic generation patterns.",
    processingTime: "6 sec",
    creditsUsed: 5,
    sourceLabel: "uploaded audio",
    generators: [
      { name: "ElevenLabs", score: 0.14 },
      { name: "PlayHT", score: 0.07 },
      { name: "Bark", score: 0.03 },
      { name: "Other", score: 0.02 },
      { name: "Human voice markers", score: 0.74 },
    ],
  },
};
