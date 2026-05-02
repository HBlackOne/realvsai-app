import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getOrCreateCurrentUser } from "@/lib/auth/get-or-create-user";
import { getCreditPackVariantId } from "@/lib/billing/config";
import { createCheckoutUrl } from "@/lib/billing/lemonsqueezy";
import {
  parseCreditPackId,
  getWalletValueForPack,
} from "@/lib/billing/credits";
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
    const packId = parseCreditPackId(body?.packId);
    const walletValueCents = getWalletValueForPack(packId);
    const variantId = getCreditPackVariantId(packId);
    const appUser = await getOrCreateCurrentUser();
    const clerkUser = await currentUser();

    const creditsToken = await createCheckoutToken({
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
        packId: packId,
        credits: String(walletValueCents),
        walletValueCents: String(walletValueCents),
      },
      token: creditsToken,
    });

    return NextResponse.json({
      success: true,
      data: {
        checkoutUrl,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create checkout.";
    const status = message === "Unauthorized" ? 401 : 500;

    return NextResponse.json({ success: false, error: message }, { status });
  }
}
