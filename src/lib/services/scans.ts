import "server-only";

import {
  PricingPhase,
  ScanInputType,
  ScanMediaType,
  ScanStatus,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";
import { db } from "@/lib/db";
import {
  ACTIVE_PRICING,
  HIVE_ESTIMATED_COSTS,
  PROTECTION_LIMITS,
  SCAN_PRICES,
  EARLY_ACCESS_PLANS,
} from "@/lib/billing/pricing.constants";
import {
  TRIAL_INTERNAL_VALUE_CENTS,
  TRIAL_MAX_AUDIO_SCANS,
  TRIAL_MAX_VIDEO_SCANS,
} from "@/lib/billing/trial.constants";
import { ensureUserWallet } from "@/lib/services/wallet";
import type {
  GeneratorScore,
  MediaType,
  ScanResult,
  VideoSource,
} from "@/components/universal-detector/types";

const DAILY_SHORT_VIDEO_SCAN_LIMIT = 10;
const DAILY_DEEP_VIDEO_SCAN_LIMIT = 5;

export type TrialBlockReason =
  | "daily_short_video_limit_reached"
  | "daily_deep_video_limit_reached"
  | "trial_deep_video_blocked"
  | "trial_video_limit_reached"
  | "trial_audio_limit_reached"
  | "trial_balance_insufficient"
  | "subscription_deep_video_limit_reached";

function getTodayStart() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function isDeepVideoCost(costCredits: number) {
  const deepVideoCosts = new Set<number>([
    SCAN_PRICES.video60,
    EARLY_ACCESS_PLANS.basic.deepVideoCost,
    EARLY_ACCESS_PLANS.pro.deepVideoCost,
  ]);
  return deepVideoCosts.has(costCredits);
}

function isDeepVideoScan(mediaType: MediaType, costCredits: number) {
  return (
    mediaType === "video-deep" ||
    (mediaType === "video" && isDeepVideoCost(costCredits))
  );
}

function resolveDeepVideoMonthlyLimit({
  subscriptionPlanId,
  pricingPhase,
}: {
  subscriptionPlanId?: string | null;
  pricingPhase?: PricingPhase | null;
}) {
  if (subscriptionPlanId === "basic") {
    return 0;
  }

  if (subscriptionPlanId === "pro") {
    if (pricingPhase === PricingPhase.SAFETY) return 20;
    if (pricingPhase === PricingPhase.TRANSITION) return 12;
    if (pricingPhase === PricingPhase.GROWTH) return 12;
    return 12;
  }

  return 0;
}

export function resolveNetRevenueCents({
  subscriptionPlanId,
  pricingPhase,
  earlyAccessEligible,
  loyaltyPhaseEligible,
}: {
  subscriptionPlanId?: string | null;
  pricingPhase?: PricingPhase | null;
  earlyAccessEligible?: boolean | null;
  loyaltyPhaseEligible?: boolean | null;
}) {
  if (subscriptionPlanId === "basic") {
    return ACTIVE_PRICING.netRevenueCents.basic;
  }

  if (subscriptionPlanId === "pro") {
    if (pricingPhase === PricingPhase.SAFETY) {
      return ACTIVE_PRICING.netRevenueCents.proNormal;
    }

    if (pricingPhase === PricingPhase.TRANSITION && loyaltyPhaseEligible) {
      return ACTIVE_PRICING.netRevenueCents.loyalty;
    }

    if (
      pricingPhase === PricingPhase.GROWTH &&
      earlyAccessEligible &&
      "proEA" in ACTIVE_PRICING.netRevenueCents
    ) {
      return ACTIVE_PRICING.netRevenueCents.proEA;
    }

    return ACTIVE_PRICING.netRevenueCents.proNormal;
  }

  return ACTIVE_PRICING.netRevenueCents.basic;
}

function addOneMonth(date: Date) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + 1);
  return next;
}

export async function checkHiveCostAlerts({
  userId,
  subscriptionId,
}: {
  userId: string;
  subscriptionId: string;
}) {
  const [user, subscription] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        costHardStopAt: true,
        costSoftAlertAt: true,
        hardStopDeepScansUntil: true,
        earlyAccessEligible: true,
        loyaltyPhaseEligible: true,
      },
    }),
    db.subscription.findUnique({
      where: { id: subscriptionId },
      select: {
        monthlyEstimatedHiveCostCents: true,
        pricingPhase: true,
        subscriptionPlanId: true,
        currentPeriodStartedAt: true,
        costSoftAlertAt: true,
        costHardStopAt: true,
      },
    }),
  ]);

  if (!user || !subscription) {
    return { skipped: true, reason: "missing_user_or_subscription" } as const;
  }

  const netRevenueCents = resolveNetRevenueCents({
    subscriptionPlanId: subscription.subscriptionPlanId,
    pricingPhase: subscription.pricingPhase,
    earlyAccessEligible: user.earlyAccessEligible,
    loyaltyPhaseEligible: user.loyaltyPhaseEligible,
  });
  const softThreshold = Math.floor(netRevenueCents * 0.8);
  const hardThreshold = Math.floor(netRevenueCents * 1.2);
  const currentCost = subscription.monthlyEstimatedHiveCostCents;
  const now = new Date();

  if (currentCost >= hardThreshold) {
    const hardStopDeepScansUntil = addOneMonth(
      subscription.currentPeriodStartedAt ?? now,
    );

    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          ...(user.costHardStopAt ? {} : { costHardStopAt: now }),
          hardStopDeepScansUntil,
        },
      });

      if (!subscription.costHardStopAt) {
        await tx.subscription.update({
          where: { id: subscriptionId },
          data: { costHardStopAt: now },
        });
      }
    });

    return {
      skipped: false,
      level: "hard" as const,
      currentCost,
      netRevenueCents,
      threshold: hardThreshold,
      hardStopDeepScansUntil,
    };
  }

  if (currentCost >= softThreshold) {
    await db.$transaction(async (tx) => {
      if (!user.costSoftAlertAt) {
        await tx.user.update({
          where: { id: userId },
          data: { costSoftAlertAt: now },
        });
      }

      if (!subscription.costSoftAlertAt) {
        await tx.subscription.update({
          where: { id: subscriptionId },
          data: { costSoftAlertAt: now },
        });
      }
    });

    return {
      skipped: false,
      level: "soft" as const,
      currentCost,
      netRevenueCents,
      threshold: softThreshold,
    };
  }

  return {
    skipped: false,
    level: "none" as const,
    currentCost,
    netRevenueCents,
    threshold: softThreshold,
  };
}

async function validateDailyVideoCap({
  userId,
  mediaType,
  costCredits,
}: {
  userId: string;
  mediaType: MediaType;
  costCredits: number;
}): Promise<{ allowed: true } | { allowed: false; reason: TrialBlockReason }> {
  if (mediaType !== "video" && mediaType !== "video-deep") {
    return { allowed: true };
  }

  const since = getTodayStart();
  const requestedDeepVideo = isDeepVideoScan(mediaType, costCredits);

  if (requestedDeepVideo) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        costHardStopAt: true,
        hardStopDeepScansUntil: true,
      },
    });
    const now = new Date();
    const hardStopActive = Boolean(
      user?.costHardStopAt &&
      user.hardStopDeepScansUntil &&
      user.hardStopDeepScansUntil > now,
    );
    const deepVideoDailyLimit = hardStopActive
      ? PROTECTION_LIMITS.hardStopDeepScansPerDay
      : DAILY_DEEP_VIDEO_SCAN_LIMIT;

    const todayDeepVideoCount = await db.scan.count({
      where: {
        userId,
        mediaType: ScanMediaType.VIDEO,
        createdAt: { gte: since },
        status: { notIn: [ScanStatus.FAILED, ScanStatus.CANCELED] },
        OR: [
          { isDeepVideo: true },
          {
            costCredits: {
              in: Array.from(
                new Set([
                  SCAN_PRICES.video60,
                  EARLY_ACCESS_PLANS.basic.deepVideoCost,
                  EARLY_ACCESS_PLANS.pro.deepVideoCost,
                ]),
              ),
            },
          },
        ],
      },
    });

    if (todayDeepVideoCount >= deepVideoDailyLimit) {
      return { allowed: false, reason: "daily_deep_video_limit_reached" };
    }

    return { allowed: true };
  }

  const todayShortVideoCount = await db.scan.count({
    where: {
      userId,
      mediaType: ScanMediaType.VIDEO,
      createdAt: { gte: since },
      status: { notIn: [ScanStatus.FAILED, ScanStatus.CANCELED] },
      isDeepVideo: false,
      costCredits: {
        notIn: Array.from(
          new Set([
            SCAN_PRICES.video60,
            EARLY_ACCESS_PLANS.basic.deepVideoCost,
            EARLY_ACCESS_PLANS.pro.deepVideoCost,
          ]),
        ),
      },
    },
  });

  if (todayShortVideoCount >= DAILY_SHORT_VIDEO_SCAN_LIMIT) {
    return { allowed: false, reason: "daily_short_video_limit_reached" };
  }

  return { allowed: true };
}

// Returns the effective cost to charge for a scan, accounting for trial/subscription/paid status.
// Also checks affordability and enforces deep video caps for subscription users.
export async function validateTrialScan({
  userId,
  mediaType,
  costCredits,
}: {
  userId: string;
  mediaType: MediaType;
  costCredits: number;
}): Promise<
  | { allowed: true; effectiveCost: number }
  | { allowed: false; reason: TrialBlockReason }
> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      isPaidUser: true,
      trialScanBalance: true,
      trialVideoScans: true,
      trialAudioScans: true,
    },
  });

  if (!user) {
    return { allowed: false, reason: "trial_balance_insufficient" };
  }

  const dailyVideoCap = await validateDailyVideoCap({
    userId,
    mediaType,
    costCredits,
  });
  if (!dailyVideoCap.allowed) {
    return dailyVideoCap;
  }

  const subscription = await db.subscription.findUnique({
    where: { userId },
    select: {
      status: true,
      subscriptionCreditBalance: true,
      subscriptionDeepVideoCount: true,
      subscriptionPlanId: true,
      pricingPhase: true,
    },
  });

  const hasActiveSubscriptionCredits =
    subscription &&
    (subscription.status === "ACTIVE" || subscription.status === "ON_TRIAL") &&
    subscription.subscriptionCreditBalance > 0;

  // --- STEP 1: Trial — checked first whenever trial balance remains ---
  if (user.trialScanBalance > 0) {
    // Deep video always blocked during trial
    if (isDeepVideoScan(mediaType, costCredits)) {
      return { allowed: false, reason: "trial_deep_video_blocked" };
    }

    if (mediaType === "image") {
      return { allowed: true, effectiveCost: costCredits };
    }

    if (mediaType === "video") {
      if (user.trialVideoScans >= TRIAL_MAX_VIDEO_SCANS) {
        return { allowed: false, reason: "trial_video_limit_reached" };
      }
      if (user.trialScanBalance < costCredits) {
        return { allowed: false, reason: "trial_balance_insufficient" };
      }
      return { allowed: true, effectiveCost: costCredits };
    }

    if (mediaType === "audio") {
      if (user.trialAudioScans >= TRIAL_MAX_AUDIO_SCANS) {
        return { allowed: false, reason: "trial_audio_limit_reached" };
      }
      if (user.trialScanBalance < costCredits) {
        return { allowed: false, reason: "trial_balance_insufficient" };
      }
      return { allowed: true, effectiveCost: costCredits };
    }

    return { allowed: true, effectiveCost: costCredits };
  }

  // --- STEP 2: Subscription credits — only after trial exhausted ---
  if (hasActiveSubscriptionCredits && subscription) {
    // Deep video: enforce per-plan monthly cap
    if (isDeepVideoScan(mediaType, costCredits)) {
      const deepVideoMonthlyLimit = resolveDeepVideoMonthlyLimit({
        subscriptionPlanId: subscription.subscriptionPlanId,
        pricingPhase: subscription.pricingPhase,
      });

      if (subscription.subscriptionDeepVideoCount >= deepVideoMonthlyLimit) {
        return {
          allowed: false,
          reason: "subscription_deep_video_limit_reached",
        };
      }

      return { allowed: true, effectiveCost: SCAN_PRICES.video60 };
    }

    // Apply plan-specific cost overrides for all media types
    const planId = subscription.subscriptionPlanId as
      | keyof typeof EARLY_ACCESS_PLANS
      | null;
    if (planId && EARLY_ACCESS_PLANS[planId]) {
      const plan = EARLY_ACCESS_PLANS[planId];
      let effectiveCost = costCredits;
      if (mediaType === "image") effectiveCost = plan.imageCost;
      if (mediaType === "audio") effectiveCost = plan.audioCost;
      if (mediaType === "video") effectiveCost = plan.videoShortCost;
      return { allowed: true, effectiveCost };
    }

    return { allowed: true, effectiveCost: costCredits };
  }

  // --- STEP 3: Wallet — paid users only ---
  if (user.isPaidUser) {
    return { allowed: true, effectiveCost: costCredits };
  }

  return { allowed: false, reason: "trial_balance_insufficient" };
}

function toScanMediaType(mediaType: MediaType): ScanMediaType {
  if (mediaType === "image") return ScanMediaType.IMAGE;
  if (mediaType === "video" || mediaType === "video-deep")
    return ScanMediaType.VIDEO;
  return ScanMediaType.AUDIO;
}

function toScanInputType(
  mediaType: MediaType,
  videoSource?: VideoSource,
): ScanInputType {
  if (
    (mediaType === "video" || mediaType === "video-deep") &&
    videoSource === "url"
  ) {
    return ScanInputType.URL;
  }

  return ScanInputType.FILE;
}

function getEstimatedHiveCostCents(scan: {
  mediaType: ScanMediaType;
  isDeepVideo: boolean;
}) {
  if (scan.mediaType === ScanMediaType.IMAGE) return HIVE_ESTIMATED_COSTS.image;
  if (scan.mediaType === ScanMediaType.AUDIO) return HIVE_ESTIMATED_COSTS.audio;
  if (scan.mediaType === ScanMediaType.VIDEO && scan.isDeepVideo)
    return HIVE_ESTIMATED_COSTS.video60;
  return HIVE_ESTIMATED_COSTS.video15;
}

export async function createScanRecord({
  userId,
  mediaType,
  videoSource,
  sourceLabel,
  sourceUrl,
  originalFilename,
  costCredits,
}: {
  userId: string;
  mediaType: MediaType;
  videoSource?: VideoSource;
  sourceLabel: string;
  sourceUrl?: string | null;
  originalFilename?: string | null;
  costCredits: number;
}) {
  return db.scan.create({
    data: {
      userId,
      mediaType: toScanMediaType(mediaType),
      inputType: toScanInputType(mediaType, videoSource),
      status: ScanStatus.PROCESSING,
      sourceLabel,
      sourceUrl: sourceUrl ?? null,
      originalFilename: originalFilename ?? null,
      costCredits,
      isDeepVideo: isDeepVideoScan(mediaType, costCredits),
    },
  });
}

export async function completeScanRecord({
  scanId,
  result,
}: {
  scanId: string;
  result: ScanResult;
}) {
  const scan = await db.scan.findUnique({
    where: { id: scanId },
  });

  if (!scan) {
    throw new Error("Scan not found.");
  }

  if (scan.status === ScanStatus.COMPLETED) {
    return scan;
  }

  const user = await db.user.findUnique({
    where: { id: scan.userId },
    select: {
      isPaidUser: true,
      trialScanBalance: true,
      trialVideoScans: true,
      trialAudioScans: true,
    },
  });

  const subscription = await db.subscription.findUnique({
    where: { userId: scan.userId },
    select: {
      status: true,
      id: true,
      subscriptionCreditBalance: true,
      subscriptionDeepVideoCount: true,
      subscriptionPlanId: true,
    },
  });

  const hasActiveSubscriptionCredits =
    subscription &&
    (subscription.status === "ACTIVE" || subscription.status === "ON_TRIAL") &&
    subscription.subscriptionCreditBalance > 0;

  const estimatedHiveCostCents = getEstimatedHiveCostCents(scan);

  // Trial: remaining trial balance (paid status does NOT consume it)
  const isTrialUser = user && user.trialScanBalance > 0;

  // Subscription: active subscription credits (only used when trial exhausted)
  // Wallet: paid user with no trial and no subscription credits
  const isPaidWalletUser =
    user && user.isPaidUser && !hasActiveSubscriptionCredits;

  const completedScan = await db.$transaction(async (tx) => {
    const updatedScan = await tx.scan.update({
      where: { id: scanId },
      data: {
        status: ScanStatus.COMPLETED,
        verdict: result.verdict,
        confidence: result.confidence,
        aiScore: result.aiScore,
        humanScore: result.humanScore,
        processingTimeMs: parseProcessingTime(result.processingTime),
        generators: result.generators as unknown as GeneratorScore[],
        rawResult: result,
        estimatedHiveCostCents,
        completedAt: new Date(),
      },
    });

    await tx.user.update({
      where: { id: scan.userId },
      data: {
        estimatedHiveCostCentsMonth: { increment: estimatedHiveCostCents },
      },
    });

    if (subscription) {
      await tx.subscription.update({
        where: { userId: scan.userId },
        data: {
          monthlyEstimatedHiveCostCents: { increment: estimatedHiveCostCents },
        },
      });
    }

    // --- STEP 1: Trial user — deduct from trial balance + counters ---
    if (isTrialUser && user) {
      const isVideo = scan.mediaType === ScanMediaType.VIDEO;
      const isAudio = scan.mediaType === ScanMediaType.AUDIO;

      const nextTrialBalance = Math.max(
        user.trialScanBalance - scan.costCredits,
        0,
      );
      const trialVideoScans = isVideo
        ? user.trialVideoScans + 1
        : user.trialVideoScans;
      const trialAudioScans = isAudio
        ? user.trialAudioScans + 1
        : user.trialAudioScans;

      await tx.user.update({
        where: { id: scan.userId },
        data: {
          trialScanBalance: nextTrialBalance,
          trialVideoScans,
          trialAudioScans,
        },
      });

      const wallet = await tx.wallet.findUnique({
        where: { userId: scan.userId },
      });
      if (wallet) {
        await tx.transaction.create({
          data: {
            userId: scan.userId,
            walletId: wallet.id,
            type: TransactionType.SCAN_DEDUCTION,
            status: TransactionStatus.COMPLETED,
            amount: 0,
            currency: "USD",
            credits: -scan.costCredits,
            balanceAfter: nextTrialBalance,
            description: `${scan.mediaType.toLowerCase()} trial scan deduction`,
            provider: "realvsai",
            metadata: {
              scanId: scan.id,
              mediaType: scan.mediaType,
              sourceLabel: scan.sourceLabel,
              isTrialDeduction: true,
            },
            processedAt: new Date(),
          },
        });
      }
    }

    // --- STEP 2: Subscription credits — deduct from subscription pool ---
    else if (hasActiveSubscriptionCredits && subscription) {
      // For deep video scans: use plan's deep video cost and increment monthly counter
      const isDeepVideo = scan.isDeepVideo;

      let costToDeduct = scan.costCredits;

      if (
        isDeepVideo &&
        subscription.subscriptionPlanId &&
        EARLY_ACCESS_PLANS[
          subscription.subscriptionPlanId as keyof typeof EARLY_ACCESS_PLANS
        ]
      ) {
        costToDeduct =
          EARLY_ACCESS_PLANS[
            subscription.subscriptionPlanId as keyof typeof EARLY_ACCESS_PLANS
          ].deepVideoCost;
      }

      const nextSubBalance = Math.max(
        subscription.subscriptionCreditBalance - costToDeduct,
        0,
      );

      await tx.subscription.update({
        where: { userId: scan.userId },
        data: {
          subscriptionCreditBalance: nextSubBalance,
          ...(isDeepVideo
            ? {
                subscriptionDeepVideoCount:
                  subscription.subscriptionDeepVideoCount + 1,
              }
            : {}),
        },
      });

      const wallet = await tx.wallet.findUnique({
        where: { userId: scan.userId },
      });
      if (wallet) {
        await tx.transaction.create({
          data: {
            userId: scan.userId,
            walletId: wallet.id,
            type: TransactionType.SUBSCRIPTION_CREDIT,
            status: TransactionStatus.COMPLETED,
            amount: 0,
            currency: "USD",
            credits: -costToDeduct,
            balanceAfter: nextSubBalance,
            description: `${scan.mediaType.toLowerCase()} scan (subscription credits)`,
            provider: "realvsai",
            metadata: {
              scanId: scan.id,
              mediaType: scan.mediaType,
              sourceLabel: scan.sourceLabel,
              isSubscriptionCreditDeduction: true,
              isDeepVideo,
            },
            processedAt: new Date(),
          },
        });
      }
    }

    // --- STEP 3: Paid user — deduct from wallet ---
    else if (isPaidWalletUser) {
      const wallet = await tx.wallet.findUnique({
        where: { userId: scan.userId },
      });
      if (wallet) {
        const nextBalance = Math.max(wallet.balance - scan.costCredits, 0);
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: nextBalance },
        });
        await tx.transaction.create({
          data: {
            userId: scan.userId,
            walletId: wallet.id,
            type: TransactionType.SCAN_DEDUCTION,
            status: TransactionStatus.COMPLETED,
            amount: 0,
            currency: wallet.currency,
            credits: -scan.costCredits,
            balanceAfter: nextBalance,
            description: `${scan.mediaType.toLowerCase()} scan deduction`,
            provider: "realvsai",
            metadata: {
              scanId: scan.id,
              mediaType: scan.mediaType,
              sourceLabel: scan.sourceLabel,
            },
            processedAt: new Date(),
          },
        });
      }
    }

    return updatedScan;
  });

  if (subscription) {
    await checkHiveCostAlerts({
      userId: scan.userId,
      subscriptionId: subscription.id,
    });
  }

  return completedScan;
}

export async function failScanRecord({
  scanId,
  errorMessage,
}: {
  scanId: string;
  errorMessage: string;
}) {
  return db.scan.update({
    where: { id: scanId },
    data: {
      status: ScanStatus.FAILED,
      errorMessage,
    },
  });
}

export async function listScansByUserId(
  userId: string,
  limit = 10,
  cursor?: string | null,
) {
  return db.scan.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
    ...(cursor
      ? {
          skip: 1,
          cursor: { id: cursor },
        }
      : {}),
  });
}

export async function getRecentScansByUserId(userId: string, limit = 4) {
  return db.scan.findMany({
    where: { userId },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
}

export async function countScansByUserId(userId: string) {
  return db.scan.count({
    where: { userId },
  });
}

export async function getScanUsageByUserId(userId: string) {
  const [imageScans, videoScans, audioScans] = await Promise.all([
    db.scan.count({
      where: {
        userId,
        mediaType: ScanMediaType.IMAGE,
        status: ScanStatus.COMPLETED,
      },
    }),
    db.scan.count({
      where: {
        userId,
        mediaType: ScanMediaType.VIDEO,
        status: ScanStatus.COMPLETED,
      },
    }),
    db.scan.count({
      where: {
        userId,
        mediaType: ScanMediaType.AUDIO,
        status: ScanStatus.COMPLETED,
      },
    }),
  ]);

  return {
    imageScans,
    videoScans,
    audioScans,
    completedScans: imageScans + videoScans + audioScans,
  };
}

export function serializeScan(
  scan: Awaited<ReturnType<typeof listScansByUserId>>[number],
) {
  return {
    id: scan.id,
    mediaType: scan.mediaType,
    inputType: scan.inputType,
    status: scan.status,
    sourceLabel: scan.sourceLabel,
    costCredits: scan.costCredits,
    verdict: scan.verdict,
    confidence: scan.confidence,
    errorMessage: scan.errorMessage,
    completedAt: scan.completedAt,
    createdAt: scan.createdAt,
    updatedAt: scan.updatedAt,
  };
}

function parseProcessingTime(value: string) {
  const seconds = Number.parseInt(value, 10);

  if (Number.isNaN(seconds)) {
    return null;
  }

  return seconds * 1000;
}
