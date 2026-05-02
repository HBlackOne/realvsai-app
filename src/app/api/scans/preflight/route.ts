import { NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/auth/get-or-create-user";
import { EARLY_ACCESS_PLANS, SCAN_PRICES } from "@/lib/billing/pricing.constants";
import { resolveUrlMeta } from "@/lib/url-meta/resolve-url-meta";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawUrl = typeof body?.url === "string" ? body.url.trim() : "";

    if (!rawUrl) {
      return NextResponse.json({ success: false, error: "Missing URL." }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      return NextResponse.json({ success: false, error: "Invalid URL." }, { status: 400 });
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return NextResponse.json({ success: false, error: "Only HTTP/HTTPS URLs are supported." }, { status: 400 });
    }

    const user = await getOrCreateCurrentUser();
    const meta = await resolveUrlMeta(parsed.toString());
    const detectedType = meta.detectedType;

    if (!detectedType) {
      return NextResponse.json({ success: false, error: "Unable to detect media type from this URL." }, { status: 422 });
    }

    const subscription = user.subscription;
    const subscriptionPlanId = subscription?.subscriptionPlanId as keyof typeof EARLY_ACCESS_PLANS | null;
    const activePlan = subscriptionPlanId ? EARLY_ACCESS_PLANS[subscriptionPlanId] : null;
    const hasSubscriptionCredits = Boolean(
      subscription &&
        (subscription.status === "ACTIVE" || subscription.status === "ON_TRIAL") &&
        subscription.subscriptionCreditBalance > 0,
    );

    const effectiveCosts = {
      image: activePlan && hasSubscriptionCredits ? activePlan.imageCost : SCAN_PRICES.image,
      audio: activePlan && hasSubscriptionCredits ? activePlan.audioCost : SCAN_PRICES.audio,
      video: activePlan && hasSubscriptionCredits ? activePlan.videoShortCost : SCAN_PRICES.video15,
      deepVideo: activePlan && hasSubscriptionCredits ? activePlan.deepVideoCost : SCAN_PRICES.video60,
    };

    const currentDeepVideoCount = subscription?.subscriptionDeepVideoCount ?? 0;
    const deepVideo = (() => {
      if (user.trialScanBalance > 0) {
        return {
          available: false,
          reason: "Blocked during trial",
        };
      }
      if (activePlan && hasSubscriptionCredits) {
        const remaining = Math.max(activePlan.deepVideoMonthlyLimit - currentDeepVideoCount, 0);
        return {
          available: remaining > 0,
          reason: `${remaining}/${activePlan.deepVideoMonthlyLimit} monthly deep scans left`,
        };
      }
      if (user.isPaidUser) {
        return {
          available: true,
          reason: "Available with wallet pricing",
        };
      }
      return {
        available: false,
        reason: "Upgrade required",
      };
    })();

    return NextResponse.json({
      success: true,
      data: {
        url: meta.originalUrl,
        resolvedUrl: meta.resolvedUrl,
        detectedType,
        contentType: meta.contentType,
        effectiveCost: effectiveCosts[detectedType],
        effectiveCosts,
        deepVideo,
        preview: {
          title: meta.title,
          image: meta.thumbnail,
          duration: meta.duration,
          siteName: meta.siteName,
          platform: meta.platform,
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Preflight failed.";
    const status = message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
