import type { LucideIcon } from "lucide-react";

export type MediaType = "image" | "video" | "audio" | "video-deep";
export type ScanStage = "idle" | "ready" | "confirm" | "scanning" | "result" | "error";
export type VideoSource = "url" | "file";

export type GeneratorScore = {
  name: string;
  score: number;
};

export type ScanResult = {
  verdict: "AI Generated" | "Authentic" | "Mixed";
  confidence: number;
  aiScore: number;
  humanScore: number;
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
