import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const users = await db.user.findMany({
    take: 3,
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, isPaidUser: true, trialScanBalance: true, estimatedHiveCostCentsMonth: true },
  });

  const scans = await db.scan.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    select: { id: true, userId: true, status: true, cacheKey: true, estimatedHiveCostCents: true, mediaType: true, verdict: true },
  });

  return NextResponse.json({ users, scans });
}
