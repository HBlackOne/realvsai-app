import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createAppMessage } from "@/lib/services/messages";
import { completeScanRecord, failScanRecord } from "@/lib/services/scans";
import type { ScanResult } from "@/components/universal-detector/types";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const [scan, dbUser] = await Promise.all([
      db.scan.findUnique({ where: { id } }),
      db.user.findFirst({ where: { clerkUserId: userId } }),
    ]);

    if (!scan || !dbUser || scan.userId !== dbUser.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    if (body?.errorMessage) {
      await failScanRecord({ scanId: id, errorMessage: String(body.errorMessage) });
      await createAppMessage({
        userId: dbUser.id,
        type: "scan_failed",
        title: "Scan failed",
        body: `${scan.mediaType.toLowerCase()} scan failed · No credits deducted`,
        dedupeKey: `scan_failed:${scan.id}`,
        metadata: {
          scanId: scan.id,
          mediaType: scan.mediaType,
          reason: String(body.errorMessage),
        },
      });
      return NextResponse.json({ success: true });
    }

    const result = body?.result as ScanResult | undefined;

    if (!result) {
      return NextResponse.json({ success: false, error: "Missing result payload." }, { status: 400 });
    }

    await completeScanRecord({ scanId: id, result });
    await createAppMessage({
      userId: dbUser.id,
      type: "scan_complete",
      title: "Scan completed",
      body: `${scan.mediaType.toLowerCase()} scan · ${scan.costCredits} credits deducted`,
      dedupeKey: `scan_complete:${scan.id}`,
      metadata: {
        scanId: scan.id,
        mediaType: scan.mediaType,
        costCredits: scan.costCredits,
        verdict: result.verdict,
        confidence: result.confidence,
      },
    });

    const balanceState = await db.user.findUnique({
      where: { id: dbUser.id },
      select: {
        trialScanBalance: true,
        wallet: { select: { balance: true } },
        subscription: { select: { status: true, subscriptionCreditBalance: true } },
      },
    });
    const spendableBalance =
      (balanceState?.trialScanBalance ?? 0) +
      (balanceState?.wallet?.balance ?? 0) +
      (balanceState?.subscription && ["ACTIVE", "ON_TRIAL"].includes(balanceState.subscription.status)
        ? balanceState.subscription.subscriptionCreditBalance
        : 0);

    if (spendableBalance < 50) {
      const recentLowCreditMessage = await db.appMessage.findFirst({
        where: {
          userId: dbUser.id,
          type: "credits_low",
          createdAt: { gte: new Date(Date.now() - 86_400_000) },
        },
      });

      if (!recentLowCreditMessage) {
        await createAppMessage({
          userId: dbUser.id,
          type: "credits_low",
          title: "Low credits",
          body: `You have ${spendableBalance} credits remaining. Top up to keep scanning.`,
          dedupeKey: `credits_low:${dbUser.id}:${new Date().toISOString().slice(0, 10)}`,
          metadata: { balance: spendableBalance },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to complete scan.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
