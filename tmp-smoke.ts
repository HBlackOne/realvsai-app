import "server-only";
import { db } from "@/lib/db";
import { PrismaClient } from "@prisma/client";

async function main() {
  const users = await db.user.findMany({
    take: 3,
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, isPaidUser: true, trialScanBalance: true, estimatedHiveCostCentsMonth: true },
  });
  console.log("recent users:", JSON.stringify(users, null, 2));

  const scans = await db.scan.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    select: { id: true, userId: true, status: true, cacheKey: true, estimatedHiveCostCents: true, mediaType: true, verdict: true },
  });
  console.log("recent scans:", JSON.stringify(scans, null, 2));
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
