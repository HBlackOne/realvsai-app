import type { LucideIcon } from "lucide-react";

export type MediaType = "image" | "video" | "audio" | "video-deep";
export type ScanStage = "idle" | "ready" | "confirm" | "uploading" | "scanning" | "result" | "error";
export type VideoSource = "url" | "file";

export type GeneratorScore = {
  name: string;
  score: number;
};

export type ScanResult = {
  verdict:
    | "AI Generated"
    | "Authentic"
    | "Mixed"
    | "AI Generated - Deepfake Detected"
    | "Authentic - Deepfake Detected"
    | "Mixed - Deepfake Detected";
  confidence: number;
  aiScore: number;
  humanScore: number;
  deepfakeScore?: number;
  speechScore?: number;
  explanation: string;
  generators: GeneratorScore[];
  processingTime: string;
  creditsUsed: number;
  sourceLabel: string;
};

export type DetectorTab = {
  type: MediaType;
  icon: LucideIcon;
  label: string;
  cost: number;
};
