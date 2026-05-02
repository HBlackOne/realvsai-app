import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getOrCreateCurrentUser } from "@/lib/auth/get-or-create-user";
import {
  getBasicNormalVariantId,
  getProNormalVariantId,
} from "@/lib/billing/config";
import { createCheckoutUrl } from "@/lib/billing/lemonsqueezy";
import {
  EARLY_ACCESS_PLANS,
  type EarlyAccessPlanId,
} from "@/lib/billing/pricing.constants";
import { getSubscriptionByUserId } from "@/lib/services/billing";
import { createCheckoutToken } from "@/lib/services/checkout-token";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const planId = body?.planId as EarlyAccessPlanId | undefined;

    if (!planId || !EARLY_ACCESS_PLANS[planId]) {
      return NextResponse.json(
        { success: false, error: "Invalid plan. Must be 'basic' or 'pro'." },
        { status: 400 },
      );
    }

    const plan = EARLY_ACCESS_PLANS[planId];
    const appUser = await getOrCreateCurrentUser();
    const existingSubscription = await getSubscriptionByUserId(appUser.id);
    const isUpgrade =
      !!existingSubscription?.subscriptionPlanId &&
      existingSubscription.subscriptionPlanId !== planId &&
      ["ACTIVE", "ON_TRIAL", "PAUSED", "PAST_DUE", "UNPAID"].includes(
        existingSubscription.status,
      );

    const variantId =
      planId === "basic" ? getBasicNormalVariantId() : getProNormalVariantId();
    const checkoutPriceCents = plan.currentPriceCents;
    const priceLocked = false;
    const clerkUser = await currentUser();

    const subToken = await createCheckoutToken({
      userId: String(appUser.id),
      variantId,
    });

    const checkoutUrl = await createCheckoutUrl({
      variantId,
      email: appUser.email,
      name:
        [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ||
        appUser.email,
      custom: {
        userId: String(appUser.id),
        clerkUserId: String(appUser.clerkUserId),
        planId: planId,
        subscriptionPlan: planId,
        monthlyCredits: String(plan.monthlyCredits),
        subscriptionPriceCents: String(checkoutPriceCents),
        subscriptionPriceLocked: String(priceLocked),
        isUpgrade: String(isUpgrade),
        checkoutRoute:
          planId === "basic" ? "basic_monthly_normal" : "pro_monthly_normal",
      },
      token: subToken,
    });

    return NextResponse.json({
      success: true,
      data: {
        checkoutUrl,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create subscription checkout.";
    const status = message === "Unauthorized" ? 401 : 500;

    return NextResponse.json({ success: false, error: message }, { status });
  }
}
