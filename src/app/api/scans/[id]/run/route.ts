import "server-only";

import { auth } from "@clerk/nextjs/server";
import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { deleteBlob } from "@/lib/services/blob";
import { callHiveSync } from "@/lib/services/hive";
import { parseHiveResponse } from "@/lib/services/hive-parser";
import { failScanRecord } from "@/lib/services/scans";
import {
  SCAN_PRICES,
  ACTIVE_PRICING_MODE,
} from "@/lib/billing/pricing.constants";
import { db } from "@/lib/db";
import type { MediaType } from "@/components/universal-detector/types";
import type { HiveParseMediaType } from "@/lib/services/hive-parser";

const VALID_MEDIA_TYPES = new Set([
  "image",
  "audio",
  "short_video",
  "deep_video",
]);

type ServerMediaType = "image" | "audio" | "short_video" | "deep_video";

function computeCacheKey(sourceUrl: string, mediaType: string): string {
  return createHash("sha256")
    .update(`${sourceUrl}:${mediaType}:${ACTIVE_PRICING_MODE}`)
    .digest("hex");
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  let body: { blobUrl?: unknown; blobPathname?: unknown; mediaType?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { blobUrl, blobPathname, mediaType } = body;

  if (typeof mediaType !== "string" || !VALID_MEDIA_TYPES.has(mediaType)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const scan = await db.scan.findUnique({ where: { id } });
  const dbUser = await db.user.findFirst({ where: { clerkUserId: userId } });

  if (!scan || !dbUser || scan.userId !== dbUser.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sourceUrl = blobUrl ? String(blobUrl) : scan.sourceUrl;
  if (!sourceUrl) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const serverMediaType = mediaType as ServerMediaType;
  const cacheKey = computeCacheKey(sourceUrl, serverMediaType);

  const cachedScan = await db.scan.findFirst({
    where: { cacheKey, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
    select: { rawResult: true },
  });

  if (cachedScan?.rawResult) {
    await db.scan.update({ where: { id }, data: { cacheKey } });
    return NextResponse.json({ result: cachedScan.rawResult });
  }

  const startTime = Date.now();
  let raw: unknown;

  try {
    raw = await callHiveSync(sourceUrl, serverMediaType);
  } catch (error) {
    if (blobPathname) await deleteBlob(String(blobPathname)).catch(() => {});

    if (error instanceof Error && error.name === "ScanRateLimitError") {
      await failScanRecord({ scanId: id, errorMessage: "Rate limit reached." });
      return NextResponse.json(
        { error: "Scan limit reached." },
        { status: 429 },
      );
    }

    await failScanRecord({ scanId: id, errorMessage: "Scan failed." });
    return NextResponse.json({ error: "Scan failed." }, { status: 500 });
  }

  if (blobPathname) await deleteBlob(String(blobPathname)).catch(() => {});

  const processingTimeMs = Date.now() - startTime;

  const creditsUsed =
    serverMediaType === "image"
      ? SCAN_PRICES.image
      : serverMediaType === "audio"
        ? SCAN_PRICES.audio
        : serverMediaType === "short_video"
          ? SCAN_PRICES.video15
          : SCAN_PRICES.video60;

  const result = parseHiveResponse(
    raw,
    serverMediaType as HiveParseMediaType,
    processingTimeMs,
    creditsUsed,
  );

  await db.scan.update({ where: { id }, data: { cacheKey } });

  return NextResponse.json({ result });
}
