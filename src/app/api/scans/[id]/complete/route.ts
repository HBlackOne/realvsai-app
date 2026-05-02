import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { completeScanRecord, failScanRecord } from "@/lib/services/scans";
import type { ScanResult } from "@/components/universal-detector/types";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();

    if (body?.errorMessage) {
      await failScanRecord({ scanId: id, errorMessage: String(body.errorMessage) });
      return NextResponse.json({ success: true });
    }

    const result = body?.result as ScanResult | undefined;

    if (!result) {
      return NextResponse.json({ success: false, error: "Missing result payload." }, { status: 400 });
    }

    await completeScanRecord({ scanId: id, result });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to complete scan.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
