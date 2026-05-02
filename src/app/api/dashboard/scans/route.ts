import { NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/auth/get-or-create-user";
import { getCreditsSpentByUserId } from "@/lib/services/billing";
import { countScansByUserId, getRecentScansByUserId, getScanUsageByUserId } from "@/lib/services/scans";
import { serializeScan } from "@/lib/services/scans";

export async function GET() {
  try {
    const user = await getOrCreateCurrentUser();
    const [totalScans, recentScans, usage, creditsSpent] = await Promise.all([
      countScansByUserId(user.id),
      getRecentScansByUserId(user.id, 4),
      getScanUsageByUserId(user.id),
      getCreditsSpentByUserId(user.id),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalScans,
        recentScans: recentScans.map((scan: Awaited<ReturnType<typeof getRecentScansByUserId>>[number]) => {
          const serialized = serializeScan(scan);
          return {
            ...serialized,
            completedAt: serialized.completedAt?.toISOString() ?? null,
            createdAt: serialized.createdAt.toISOString(),
            updatedAt: serialized.updatedAt.toISOString(),
          };
        }),
        usage: {
          creditsSpent,
          completedScans: usage.completedScans,
          byType: {
            image: usage.imageScans,
            video: usage.videoScans,
            audio: usage.audioScans,
          },
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.startsWith("Unauthorized") ? 401 : 500;

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status },
    );
  }
}
