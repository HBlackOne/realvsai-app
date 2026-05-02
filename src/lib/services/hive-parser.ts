import "server-only";

import type {
  GeneratorScore,
  ScanResult,
} from "@/components/universal-detector/types";
import type { HiveRawResponse } from "@/lib/services/hive";

export type HiveParseMediaType =
  | "image"
  | "audio"
  | "short_video"
  | "deep_video";

type HiveClass = {
  class?: string;
  label?: string;
  name?: string;
  score?: number | string;
  confidence?: number | string;
  value?: number | string;
};

type HiveAudioChunk = {
  timestamp?: number | string;
  classes?: HiveClass[];
};

const NON_SOURCE_CLASSES = new Set([
  "ai_generated",
  "not_ai_generated",
  "deepfake",
]);

function normalizeClassName(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function toScore(value: unknown) {
  const score = Number(value);
  return Number.isFinite(score) ? score : 0;
}

function getClassName(item: HiveClass) {
  return normalizeClassName(item.class ?? item.label ?? item.name);
}

function getClassScore(item: HiveClass) {
  return toScore(item.score ?? item.confidence ?? item.value);
}

function collectTopLevelClasses(raw: HiveRawResponse): HiveClass[] {
  if (!raw || typeof raw !== "object") return [];

  const root = raw as Record<string, unknown>;
  const candidates = [
    root.classes,
    root.output,
    root.response,
    root.result,
    root.data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as HiveClass[];

    if (candidate && typeof candidate === "object") {
      const nested = candidate as Record<string, unknown>;
      if (Array.isArray(nested.classes)) return nested.classes as HiveClass[];
    }
  }

  return [];
}

function collectAudioChunks(raw: HiveRawResponse): HiveAudioChunk[] {
  if (!raw || typeof raw !== "object") return [];

  const root = raw as Record<string, unknown>;
  const candidates = [
    root.chunks,
    root.output,
    root.response,
    root.result,
    root.data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as HiveAudioChunk[];

    if (candidate && typeof candidate === "object") {
      const nested = candidate as Record<string, unknown>;
      if (Array.isArray(nested.chunks))
        return nested.chunks as HiveAudioChunk[];
    }
  }

  return [];
}

function findClassScore(classes: HiveClass[], className: string) {
  return classes.reduce((max, item) => {
    if (getClassName(item) !== className) return max;
    return Math.max(max, getClassScore(item));
  }, 0);
}

function resolveVerdict(
  aiScore: number,
  deepfakeScore = 0,
): ScanResult["verdict"] {
  const baseVerdict =
    aiScore >= 0.9 ? "AI Generated" : aiScore <= 0.1 ? "Authentic" : "Mixed";

  if (deepfakeScore >= 0.9) {
    return `${baseVerdict} - Deepfake Detected` as ScanResult["verdict"];
  }

  return baseVerdict;
}

function buildGenerators(classes: HiveClass[]): GeneratorScore[] {
  return classes
    .map((item) => ({ name: getClassName(item), score: getClassScore(item) }))
    .filter((item) => item.name && !NON_SOURCE_CLASSES.has(item.name))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((item) => ({ name: item.name, score: item.score }));
}

function buildExplanation(verdict: ScanResult["verdict"], confidence: number) {
  const score = confidence / 100;

  if (String(verdict).includes("AI Generated")) {
    return score >= 0.9
      ? "High confidence AI-generated content detected."
      : "AI-generated signals detected.";
  }

  if (verdict === "Authentic") {
    return "Content appears to be authentic.";
  }

  return "Mixed signals detected. Review manually.";
}

function formatProcessingTime(processingTimeMs: number) {
  return `${(processingTimeMs / 1000).toFixed(1)}s`;
}

export function parseHiveResponse(
  raw: HiveRawResponse,
  mediaType: HiveParseMediaType,
  processingTimeMs: number,
  creditsUsed: number,
): ScanResult {
  if (mediaType === "audio") {
    const chunks = collectAudioChunks(raw);
    const aiScore = chunks.reduce(
      (max, chunk) =>
        Math.max(max, findClassScore(chunk.classes ?? [], "ai_generated")),
      0,
    );
    const humanScore = Math.max(1 - aiScore, 0);
    const confidence = Math.max(aiScore, humanScore);
    const verdict = resolveVerdict(aiScore);

    return {
      verdict,
      confidence: Math.round(confidence * 100),
      aiScore,
      humanScore,
      explanation: buildExplanation(verdict, Math.round(confidence * 100)),
      generators: [],
      processingTime: formatProcessingTime(processingTimeMs),
      creditsUsed,
      sourceLabel: "Audio Analysis",
    };
  }

  const classes = collectTopLevelClasses(raw);
  const aiScore = findClassScore(classes, "ai_generated");
  const humanScore = findClassScore(classes, "not_ai_generated");
  const deepfakeScore = findClassScore(classes, "deepfake");
  const confidence = Math.max(aiScore, humanScore);
  const verdict = resolveVerdict(aiScore, deepfakeScore);
  const generators = buildGenerators(classes);

  return {
    verdict,
    confidence: Math.round(confidence * 100),
    aiScore,
    humanScore,
    explanation: buildExplanation(verdict, Math.round(confidence * 100)),
    generators,
    processingTime: formatProcessingTime(processingTimeMs),
    creditsUsed,
    sourceLabel: generators[0]?.name ?? "Unknown",
  };
}
