export type ScanListItem = {
  id: string;
  mediaType: "IMAGE" | "VIDEO" | "AUDIO";
  inputType: "FILE" | "URL";
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELED";
  sourceLabel: string;
  sourceUrl: string | null;
  costCredits: number;
  verdict: string | null;
  confidence: number | null;
  errorMessage: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ScansResponse = {
  success: boolean;
  data?: ScanListItem[];
  meta?: {
    nextCursor: string | null;
    stats?: {
      total: number;
      completed: number;
      failed: number;
      credits: number;
    };
  };
  error?: string;
};

export async function fetchScans(cursor?: string | null, limit = 10): Promise<ScansResponse> {
  try {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    if (cursor) params.set("cursor", cursor);

    const response = await fetch(`/api/scans?${params.toString()}`, { cache: "no-store" });
    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      return {
        success: false,
        error: `Unexpected /api/scans response (${response.status})`,
      };
    }

    return (await response.json()) as ScansResponse;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load scans",
    };
  }
}
