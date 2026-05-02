export type DashboardScanItem = {
  id: string;
  mediaType: string;
  inputType: string;
  status: string;
  sourceLabel: string;
  costCredits: number;
  verdict: string | null;
  confidence: number | null;
  errorMessage: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DashboardScansResponse = {
  success: boolean;
  data?: {
    totalScans: number;
    recentScans: DashboardScanItem[];
    usage: {
      creditsSpent: number;
      completedScans: number;
      byType: {
        image: number;
        video: number;
        audio: number;
      };
    };
  };
  error?: string;
};

export async function fetchDashboardScans(): Promise<DashboardScansResponse> {
  try {
    const response = await fetch("/api/dashboard/scans", { cache: "no-store" });
    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      return {
        success: false,
        error: `Unexpected /api/dashboard/scans response (${response.status})`,
      };
    }

    return (await response.json()) as DashboardScansResponse;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load dashboard scans",
    };
  }
}
