import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyLemonSignature } from "@/lib/billing/lemonsqueezy";
import {
  activateTrialFromSubscription,
  applyCreditsPurchaseFromOrder,
  allocateSubscriptionCredits,
  syncSubscriptionLifecycle,
} from "@/lib/services/billing";

function getWebhookEventId(payload: any) {
  const eventName = payload?.meta?.event_name || "unknown";
  const resourceId = payload?.data?.id || "unknown";
  return `${eventName}:${resourceId}`;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  try {
    const valid = verifyLemonSignature(rawBody, signature);

    if (!valid) {
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 401 },
      );
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload?.meta?.event_name || "unknown";
    const eventId = getWebhookEventId(payload);

    await db.webhookEvent.upsert({
      where: { eventId },
      update: {
        payload,
        error: null,
      },
      create: {
        provider: "lemonsqueezy",
        eventName,
        eventId,
        payload,
        processed: false,
      },
    });

    let result: Record<string, unknown> | null = null;

    if (eventName === "subscription_created") {
      result = await activateTrialFromSubscription(payload);
    }

    // subscription_payment_success fires when trial conversion or renewal payment is confirmed.
    // This is the correct event for paid conversion, credit allocation, and monthly counter resets.
    if (eventName === "subscription_payment_success") {
      result = await allocateSubscriptionCredits(payload);
    }

    if (
      eventName === "subscription_updated" ||
      eventName === "subscription_cancelled" ||
      eventName === "subscription_expired" ||
      eventName === "subscription_paused" ||
      eventName === "subscription_unpaused" ||
      eventName === "subscription_resumed" ||
      eventName === "subscription_payment_failed" ||
      eventName === "subscription_payment_recovered"
    ) {
      result = await syncSubscriptionLifecycle(payload);
    }

    if (eventName === "order_created") {
      if (payload?.meta?.custom_data?.type === "trial_subscription") {
        result = {
          skipped: true,
          reason: "Trial subscription order; handled by subscription webhooks.",
        };
      } else {
        result = await applyCreditsPurchaseFromOrder(payload);
      }
    }

    await db.webhookEvent.update({
      where: { eventId },
      data: {
        processed: true,
        processedAt: new Date(),
        error: null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        accepted: true,
        eventName,
        eventId,
        result,
      },
    });
  } catch (error) {
    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = {};
    }
    const eventId = getWebhookEventId(payload);
    const message =
      error instanceof Error ? error.message : "Webhook handling failed.";

    if (eventId) {
      await db.webhookEvent.upsert({
        where: { eventId },
        update: {
          error: message,
        },
        create: {
          provider: "lemonsqueezy",
          eventName: payload?.meta?.event_name || "unknown",
          eventId,
          payload,
          processed: false,
          error: message,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
