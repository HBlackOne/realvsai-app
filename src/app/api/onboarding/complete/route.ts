import { NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/auth/get-or-create-user";
import { serializeMe } from "@/lib/serializers/me";
import { countUnreadMessagesByUserId } from "@/lib/services/messages";
import { markUserOnboardingComplete } from "@/lib/services/user";

export async function POST() {
  try {
    const user = await getOrCreateCurrentUser();
    const updatedUser = user.onboardingComplete ? user : await markUserOnboardingComplete(user.id);
    const unreadMessagesCount = await countUnreadMessagesByUserId(user.id);

    const response = NextResponse.json({
      success: true,
      data: serializeMe({ user: { ...updatedUser, unreadMessagesCount } }),
    });

    response.cookies.set("realvsai_onboarding_complete", "1", {
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
