import "server-only";

import { auth } from "@clerk/nextjs/server";
import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { deleteBlob } from "@/lib/services/blob";
import { callHiveSync } from "@/lib/services/hive";
import { parseHiveResponse } from "@/lib/services/hive-parser";
import { completeScanRecord, failScanRecord } from "@/lib/services/scans";
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

function computeCacheKey(blobUrl: string, mediaType: string): string {
  return createHash("sha256")
    .update(`${blobUrl}:${mediaType}:${ACTIVE_PRICING_MODE}`)
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

  if (!blobUrl || !blobPathname || !mediaType) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (typeof mediaType !== "string" || !VALID_MEDIA_TYPES.has(mediaType)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const scan = await db.scan.findUnique({ where: { id } });

  if (!scan || scan.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cacheKey = computeCacheKey(String(blobUrl), mediaType);

  // Step D: cache check before Hive call
  const cachedScan = await db.scan.findFirst({
    where: { cacheKey, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
    select: { rawResult: true },
  });

  if (cachedScan?.rawResult) {
    // Cache hit — write cacheKey on current scan and return cached result
    await db.scan.update({ where: { id }, data: { cacheKey } });
    return NextResponse.json({ result: cachedScan.rawResult });
  }

  // Cache miss — call Hive
  const startTime = Date.now();
  let raw: unknown;

  try {
    raw = await callHiveSync(String(blobUrl), mediaType as MediaType);
  } catch (error) {
    await deleteBlob(String(blobPathname)).catch(() => {});

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

  await deleteBlob(String(blobPathname)).catch(() => {});

  const processingTimeMs = Date.now() - startTime;

  const creditsUsed =
    mediaType === "image"
      ? SCAN_PRICES.image
      : mediaType === "audio"
        ? SCAN_PRICES.audio
        : mediaType === "short_video"
          ? SCAN_PRICES.video15
          : SCAN_PRICES.video60;

  const result = parseHiveResponse(
    raw,
    mediaType as HiveParseMediaType,
    processingTimeMs,
    creditsUsed,
  );

  // Step D: store cacheKey on successful Hive response
  await db.scan.update({ where: { id }, data: { cacheKey } });

  return NextResponse.json({ result });
}
