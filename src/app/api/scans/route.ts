import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateCurrentUser } from "@/lib/auth/get-or-create-user";
import { SCAN_PRICES } from "@/lib/billing/pricing.constants";
import {
  createScanRecord,
  listScansByUserId,
  serializeScan,
  validateTrialScan,
} from "@/lib/services/scans";
import type {
  MediaType,
  VideoSource,
} from "@/components/universal-detector/types";

function getServerScanCost(mediaType: MediaType) {
  if (mediaType === "image") return SCAN_PRICES.image;
  if (mediaType === "audio") return SCAN_PRICES.audio;
  if (mediaType === "video-deep") return SCAN_PRICES.video60;
  return SCAN_PRICES.video15;
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const user = await getOrCreateCurrentUser();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") || 10), 20);
    const cursor = searchParams.get("cursor");
    const scans = await listScansByUserId(user.id, limit, cursor);
    const nextCursor =
      scans.length === limit ? (scans[scans.length - 1]?.id ?? null) : null;

    return NextResponse.json({
      success: true,
      data: scans.map(
        (scan: Awaited<ReturnType<typeof listScansByUserId>>[number]) => ({
          ...serializeScan(scan),
          completedAt: scan.completedAt?.toISOString() ?? null,
          createdAt: scan.createdAt.toISOString(),
          updatedAt: scan.updatedAt.toISOString(),
        }),
      ),
      meta: {
        nextCursor,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load scans.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const mediaType = body?.mediaType as MediaType | undefined;
    const videoSource = body?.videoSource as VideoSource | undefined;
    const sourceLabel =
      typeof body?.sourceLabel === "string" ? body.sourceLabel.trim() : "";
    const sourceUrl =
      typeof body?.sourceUrl === "string" ? body.sourceUrl.trim() : undefined;
    const originalFilename =
      typeof body?.originalFilename === "string"
        ? body.originalFilename.trim()
        : undefined;

    if (
      !mediaType ||
      !["image", "video", "audio", "video-deep"].includes(mediaType)
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid media type." },
        { status: 400 },
      );
    }

    const costCredits = getServerScanCost(mediaType);

    if (!sourceLabel) {
      return NextResponse.json(
        { success: false, error: "Missing source label." },
        { status: 400 },
      );
    }

    const user = await getOrCreateCurrentUser();

    // Validate — also returns the effective cost to charge (plan-aware for subscription users)
    const validation = await validateTrialScan({
      userId: user.id,
      mediaType,
      costCredits,
    });

    if (!validation.allowed) {
      const reasonMessages: Record<string, string> = {
        daily_short_video_limit_reached:
          "Daily short video scan limit reached. Try again tomorrow.",
        daily_deep_video_limit_reached:
          "Daily deep video scan limit reached. Try again tomorrow.",
        trial_deep_video_blocked:
          "Deep video scans are not available during the trial. Upgrade to unlock.",
        trial_video_limit_reached: "Video scan limit reached during trial.",
        trial_audio_limit_reached: "Audio scan limit reached during trial.",
        trial_balance_insufficient: "Insufficient trial balance for this scan.",
        subscription_deep_video_limit_reached:
          "Monthly deep video limit reached for your subscription plan.",
      };
      return NextResponse.json(
        {
          success: false,
          error: reasonMessages[validation.reason] || "Scan not allowed.",
        },
        { status: 403 },
      );
    }

    const scan = await createScanRecord({
      userId: user.id,
      mediaType,
      videoSource,
      sourceLabel,
      sourceUrl,
      originalFilename,
      costCredits: validation.effectiveCost,
    });

    return NextResponse.json({
      success: true,
      data: {
        scanId: scan.id,
        status: scan.status,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create scan.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
