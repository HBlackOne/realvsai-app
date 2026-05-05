import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { SubscriptionStatus } from "@prisma/client";
import { getOrCreateCurrentUser } from "@/lib/auth/get-or-create-user";
import { assertLemonConfig } from "@/lib/billing/config";
import { db } from "@/lib/db";

export async function POST() {
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
        { success: false, error: "No active subscription found" },
        { status: 404 },
      );
    }

    const config = assertLemonConfig();
    const res = await fetch(
      `https://api.lemonsqueezy.com/v1/subscriptions/${subscription.providerSubscriptionId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/vnd.api+json",
          Accept: "application/vnd.api+json",
        },
        body: JSON.stringify({
          data: {
            type: "subscriptions",
            id: String(subscription.providerSubscriptionId),
            attributes: { cancelled: true },
          },
        }),
      },
    );

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to cancel subscription" },
        { status: res.status },
      );
    }

    await db.subscription.update({
      where: { id: subscription.id },
      data: { status: SubscriptionStatus.CANCELED, cancelAtPeriodEnd: true },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}
