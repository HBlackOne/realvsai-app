import { NextRequest, NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/auth/get-or-create-user";
import { serializeMe } from "@/lib/serializers/me";
import { getLatestSuccessfulTransactionByUserId, getRecentPaymentTransactionsByUserId } from "@/lib/services/billing";
import { countUnreadMessagesByUserId } from "@/lib/services/messages";
import { updateUserProfile } from "@/lib/services/user";

function normalizeBirthday(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return /^\d{2}\/\d{2}\/\d{4}$/.test(trimmed) ? trimmed : null;
}

function normalizeOptionalText(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getOrCreateCurrentUser();
    const body = await request.json();

    const firstName = typeof body?.firstName === "string" ? body.firstName.trim() : "";
    const lastName = typeof body?.lastName === "string" ? body.lastName.trim() : "";
    const birthDate = normalizeBirthday(body?.birthDate);
    const address = normalizeOptionalText(body?.address);

    if (!firstName || !lastName) {
      return NextResponse.json({ success: false, error: "First name and last name are required." }, { status: 400 });
    }

    if (body?.birthDate && !birthDate) {
      return NextResponse.json({ success: false, error: "Birthday must use DD/MM/YYYY." }, { status: 400 });
    }

    const user = await updateUserProfile(currentUser.id, {
      firstName,
      lastName,
      birthDate,
      address,
    });

    const [latestPurchase, paymentHistory, unreadMessagesCount] = await Promise.all([
      getLatestSuccessfulTransactionByUserId(user.id),
      getRecentPaymentTransactionsByUserId(user.id, 6),
      countUnreadMessagesByUserId(user.id),
    ]);

    return NextResponse.json({
      success: true,
      data: serializeMe({ user: { ...user, unreadMessagesCount }, latestPurchase, paymentHistory }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.startsWith("Unauthorized") ? 401 : 500;

    return NextResponse.json({ success: false, error: message }, { status });
  }
}
