import { NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/auth/get-or-create-user";
import { serializeMe } from "@/lib/serializers/me";
import { getLatestSuccessfulTransactionByUserId, getRecentPaymentTransactionsByUserId } from "@/lib/services/billing";
import { countUnreadMessagesByUserId } from "@/lib/services/messages";

export async function GET() {
  try {
    const user = await getOrCreateCurrentUser();
    const [latestPurchase, paymentHistory, unreadMessagesCount] = await Promise.all([
      getLatestSuccessfulTransactionByUserId(user.id),
      getRecentPaymentTransactionsByUserId(user.id, 6),
      countUnreadMessagesByUserId(user.id),
    ]);

    const response = NextResponse.json({
      success: true,
      data: serializeMe({ user: { ...user, unreadMessagesCount }, latestPurchase, paymentHistory }),
    });

    response.cookies.set("realvsai_onboarding_complete", user.onboardingComplete ? "1" : "0", {
      httpOnly: false,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
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
