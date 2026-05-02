import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getOrCreateCurrentUser } from "@/lib/auth/get-or-create-user";
import { getProTrialVariantId } from "@/lib/billing/config";
import { EARLY_ACCESS_PLANS } from "@/lib/billing/pricing.constants";
import { createCheckoutUrl } from "@/lib/billing/lemonsqueezy";
import { createCheckoutToken } from "@/lib/services/checkout-token";

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
    const clerkUser = await currentUser();
    const earlyAccessEligible = appUser.earlyAccessEligible;
    const trialVariantId = getProTrialVariantId(earlyAccessEligible);
    const proPlan = EARLY_ACCESS_PLANS.pro;

    const trialToken = await createCheckoutToken({
      userId: String(appUser.id),
      variantId: trialVariantId,
    });

    const checkoutUrl = await createCheckoutUrl({
      variantId: trialVariantId,
      email: appUser.email,
      name:
        [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ||
        appUser.email,
      custom: {
        userId: String(appUser.id),
        clerkUserId: String(appUser.clerkUserId),
        type: "trial_subscription",
        planId: "pro",
        subscriptionPlan: "pro",
        trialRoute: earlyAccessEligible
          ? "pro_trial_early_access"
          : "pro_trial_normal",
        earlyAccessEligible: String(earlyAccessEligible),
        monthlyCredits: String(proPlan.monthlyCredits),
        subscriptionPriceCents: String(
          earlyAccessEligible
            ? proPlan.earlyAccessPriceCents
            : proPlan.currentPriceCents,
        ),
        subscriptionPriceLocked: String(earlyAccessEligible),
      },
      token: trialToken,
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
        : "Failed to create trial checkout.";
    const status = message === "Unauthorized" ? 401 : 500;

    return NextResponse.json({ success: false, error: message }, { status });
  }
}
