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

const NON_GENERATOR_CLASSES = new Set([
  "ai_generated",
  "not_ai_generated",
  "deepfake",
  "inconclusive",
  "inconclusive_video",
  "none",
  "not_ai_generated_audio",
  "ai_generated_audio",
]);

const AUDIO_ONLY_CLASSES = new Set([
  "not_ai_generated_audio",
  "ai_generated_audio",
]);

const VIDEO_GENERATORS = new Set([
  "ltx",
  "kling",
  "sora",
  "pika",
  "runway",
  "luma",
  "haiper",
  "hedra",
  "hailuo",
  "mochi",
  "hallo",
  "hunyuan",
  "liveportrait",
  "pyramidflows",
  "sadtalker",
  "cogvideos",
  "aniportrait",
  "viduq2",
  "pixverse",
  "longcat",
  "steadydancer",
  "seedance",
  "seedance2",
  "flashvideo",
  "ray3",
  "veo3",
  "personalive",
  "dreamid",
  "scail",
  "mcnet",
  "makeittalk",
  "vibe",
  "sora2",
  "cogview",
]);

const IMAGE_GENERATORS = new Set([
  "dalle",
  "stablediffusion",
  "midjourney",
  "flux",
  "ideogram",
  "recraft",
  "leonardo",
  "sdxlinpaint",
  "stablediffusioninpaint",
  "other_image_generators",
  "bingimagecreator",
  "krea",
  "qwen",
  "zimage",
  "bria",
  "blip3o",
  "ovis",
  "bagel",
  "gptimage1_5",
  "gptimage2",
  "hidream",
  "imagen",
  "adobefirefly",
  "wuerstchen",
  "kandinsky",
  "glide",
  "gemini",
  "gemini3",
  "grokimage",
  "lucid",
  "gan",
  "sana",
  "wan",
  "meta",
  "omnigen",
  "stablecascade",
  "stablediffusionxl",
  "flux2",
  "4o",
  "infinity",
  "moonvalley",
  "higgsfield",
  "imaginart",
  "ernie",
  "dmd2",
  "heygen",
  "emu3",
  "deepfloyd",
  "titan",
  "vqdiffusion",
  "lcm",
  "cosmos",
  "mai",
  "switti",
  "sanavideo",
  "janus",
  "amused",
  "transpixar",
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
  return toScore(item.value ?? item.score ?? item.confidence);
}

function collectTopLevelClasses(raw: HiveRawResponse): HiveClass[] {
  if (!raw || typeof raw !== "object") return [];
  const root = raw as Record<string, unknown>;

  // V3 response: { output: [{ classes: [...] }] }
  if (Array.isArray(root.output) && root.output.length > 0) {
    const frames = root.output as Array<{ classes?: HiveClass[] }>;

    // Find frame with highest ai_generated score
    let bestFrame = frames[0];
    let bestScore = 0;

    for (const frame of frames) {
      const classes = frame.classes ?? [];
      const aiScore = classes.reduce((max, item) => {
        if (getClassName(item) !== "ai_generated") return max;
        return Math.max(max, getClassScore(item));
      }, 0);

      if (aiScore > bestScore) {
        bestScore = aiScore;
        bestFrame = frame;
      }
    }

    return bestFrame?.classes ?? [];
  }

  // Fallback for other shapes
  const candidates = [root.classes, root.response, root.result, root.data];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as HiveClass[];
  }

  return [];
}

function collectAudioChunks(raw: HiveRawResponse): HiveAudioChunk[] {
  if (!raw || typeof raw !== "object") return [];
  const root = raw as Record<string, unknown>;

  // V3 response: { output: [{ classes: [...] }] }
  if (Array.isArray(root.output) && root.output.length > 0) {
    return (root.output as Array<{ classes?: HiveClass[] }>).map((frame) => ({
      classes: frame.classes ?? [],
    }));
  }

  // Fallback
  const candidates = [root.chunks, root.response, root.result, root.data];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as HiveAudioChunk[];
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
    .filter((item) => item.name && !NON_GENERATOR_CLASSES.has(item.name))
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
        Math.max(max, findClassScore(chunk.classes ?? [], "ai_generated_audio")),
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

  let classes = collectTopLevelClasses(raw);

  if (mediaType === "image") {
    classes = classes.filter((item) => {
      const name = getClassName(item);
      return !AUDIO_ONLY_CLASSES.has(name) && !VIDEO_GENERATORS.has(name);
    });
  } else if (mediaType === "short_video" || mediaType === "deep_video") {
    classes = classes.filter((item) => {
      const name = getClassName(item);
      return !AUDIO_ONLY_CLASSES.has(name) && !IMAGE_GENERATORS.has(name);
    });
  }

  const allClasses = collectTopLevelClasses(raw);
  const aiScore = findClassScore(classes, "ai_generated");
  const humanScore = findClassScore(classes, "not_ai_generated");
  const deepfakeScore = findClassScore(classes, "deepfake");
  const speechScore = findClassScore(allClasses, "ai_generated_audio");
  const confidence = Math.max(aiScore, humanScore);
  const verdict = resolveVerdict(aiScore, deepfakeScore);
  const generators = buildGenerators(classes);

  return {
    verdict,
    confidence: Math.round(confidence * 100),
    aiScore,
    humanScore,
    deepfakeScore,
    speechScore:
      mediaType === "short_video" || mediaType === "deep_video"
        ? Math.round(speechScore * 100)
        : undefined,
    explanation: buildExplanation(verdict, Math.round(confidence * 100)),
    generators,
    processingTime: formatProcessingTime(processingTimeMs),
    creditsUsed,
    sourceLabel:
      generators[0]?.name && generators[0].score > 0.01
        ? generators[0].name
        : mediaType === "image"
          ? "Image Analysis"
          : "Video Analysis",
  };
}
