import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { SubscriptionStatus } from "@prisma/client";
import { getOrCreateCurrentUser } from "@/lib/auth/get-or-create-user";
import { assertLemonConfig } from "@/lib/billing/config";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const appUser = await getOrCreateCurrentUser();
    const subscription = await db.subscription.findFirst({
      where: {
        userId: appUser.id,
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.ON_TRIAL] },
      },
    });

    if (!subscription?.providerSubscriptionId) {
      return NextResponse.json(
        { success: false, error: "No active subscription" },
        { status: 404 },
      );
    }

    const config = assertLemonConfig();
    const res = await fetch(
      `https://api.lemonsqueezy.com/v1/subscriptions/${subscription.providerSubscriptionId}`,
      {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          Accept: "application/vnd.api+json",
        },
      },
    );

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: "Unable to get payment URL" },
        { status: res.status },
      );
    }

    const url = data?.data?.attributes?.urls?.update_payment_method;

    if (!url) {
      return NextResponse.json(
        { success: false, error: "Unable to get payment URL" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, url });
  } catch {
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}
