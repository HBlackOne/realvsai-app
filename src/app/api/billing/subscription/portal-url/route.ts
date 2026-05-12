import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateCurrentUser } from "@/lib/auth/get-or-create-user";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateCurrentUser();
    const sub = await db.subscription.findFirst({
      where: { userId: dbUser.id },
      orderBy: { updatedAt: "desc" },
    });

    // Note: LemonSqueezy customer portal URL does not redirect in test mode.
    // It works correctly in production; validate again when switching LS to production mode.
    const portalUrl = sub?.customerPortalUrl;
    if (!portalUrl) {
      return NextResponse.json({ error: "No billing portal available" }, { status: 404 });
    }

    return NextResponse.json({ url: portalUrl });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
