import "server-only";

import type { MediaType } from "@/components/universal-detector/types";

const HIVE_SYNC_ENDPOINT = "https://api.thehive.ai/api/v3/hive/ai-generated-and-deepfake-content-detection";
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

export type HiveRawResponse = unknown;

export class ScanRateLimitError extends Error {
  constructor(message = "Scan rate limit reached.") {
    super(message);
    this.name = "ScanRateLimitError";
  }
}

export class ScanRequestError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ScanRequestError";
    this.status = status;
  }
}

function getHiveApiKeys() {
  const primary = process.env.HIVE_API_KEY_PRIMARY;
  const fallback = process.env.HIVE_API_KEY_FALLBACK;

  if (!primary || !fallback) {
    throw new ScanRequestError("Scan service is not configured.");
  }

  return { primary, fallback };
}

function shouldRetryWithFallback(status: number) {
  return RETRYABLE_STATUS_CODES.has(status);
}

async function callHiveWithKey({
  apiKey,
  blobUrl,
  mediaType,
}: {
  apiKey: string;
  blobUrl: string;
  mediaType: MediaType;
}) {
  const response = await fetch(HIVE_SYNC_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      media_metadata: true,
      input: [{ media_url: blobUrl }],
    }),
  });

  if (!response.ok) {
    throw new ScanRequestError("Scan request failed.", response.status);
  }

  return (await response.json()) as HiveRawResponse;
}

export async function callHiveSync(blobUrl: string, mediaType: MediaType) {
  const { primary, fallback } = getHiveApiKeys();

  try {
    return await callHiveWithKey({ apiKey: primary, blobUrl, mediaType });
  } catch (error) {
    if (
      !(error instanceof ScanRequestError) ||
      !error.status ||
      !shouldRetryWithFallback(error.status)
    ) {
      throw error;
    }

    try {
      return await callHiveWithKey({ apiKey: fallback, blobUrl, mediaType });
    } catch (fallbackError) {
      if (
        fallbackError instanceof ScanRequestError &&
        fallbackError.status === 429
      ) {
        throw new ScanRateLimitError();
      }

      throw fallbackError;
    }
  }
}
