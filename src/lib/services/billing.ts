import "server-only";

import {
  PricingPhase,
  SubscriptionStatus,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";
import { db } from "@/lib/db";

import {
  BILLING_CURRENCY,
  EARLY_ACCESS_PLANS,
  SUBSCRIPTION_PHASES,
  type EarlyAccessPlanId,
} from "@/lib/billing/pricing.constants";
import {
  getSubscriptionPlanByVariantId,
  SUBSCRIPTION_VARIANT_ENVS,
} from "@/lib/billing/config";
import { createPurchaseRecapMessage } from "@/lib/services/messages";
import { ensureUserWallet } from "@/lib/services/wallet";
import { markUserAsPaid } from "@/lib/services/user";

export async function getBillingCustomerByUserId(userId: string) {
  return db.billingCustomer.findUnique({
    where: { userId },
  });
}

export async function getSubscriptionByUserId(userId: string) {
  return db.subscription.findUnique({
    where: { userId },
  });
}

export async function getLatestSuccessfulTransactionByUserId(userId: string) {
  return db.transaction.findFirst({
    where: {
      userId,
      provider: "lemonsqueezy",
      status: TransactionStatus.COMPLETED,
      type: TransactionType.PURCHASE,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getRecentPaymentTransactionsByUserId(
  userId: string,
  limit = 5,
) {
  return db.transaction.findMany({
    where: {
      userId,
      provider: "lemonsqueezy",
      type: TransactionType.PURCHASE,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
}

export async function getCreditsSpentByUserId(userId: string) {
  const result = await db.transaction.aggregate({
    where: {
      userId,
      type: TransactionType.SCAN_DEDUCTION,
      status: TransactionStatus.COMPLETED,
    },
    _sum: {
      credits: true,
    },
  });

  return Math.abs(result._sum.credits ?? 0);
}

export async function upsertBillingCustomerFromOrder({
  userId,
  customerId,
  customerEmail,
  customerName,
}: {
  userId: string;
  customerId: string;
  customerEmail?: string | null;
  customerName?: string | null;
}) {
  return db.billingCustomer.upsert({
    where: { userId },
    update: {
      customerId,
      customerEmail: customerEmail ?? undefined,
      customerName: customerName ?? undefined,
      lastSyncedAt: new Date(),
    },
    create: {
      userId,
      provider: "lemonsqueezy",
      customerId,
      customerEmail: customerEmail ?? null,
      customerName: customerName ?? null,
      lastSyncedAt: new Date(),
    },
  });
}

type LemonOrderPayload = {
  meta?: {
    custom_data?: {
      userId?: string;
      user_id?: string;
      credits?: string;
      walletValueCents?: string;
      pack?: string;
      packId?: string;
    };
  };
  data?: {
    id?: string;
    attributes?: {
      customer_id?: number | string;
      order_number?: number | string;
      user_name?: string | null;
      user_email?: string | null;
      currency?: string | null;
      total?: number | null;
      status?: string | null;
      first_order_item?: {
        product_id?: number | string;
        variant_id?: number | string;
        product_name?: string | null;
        variant_name?: string | null;
      };
      urls?: {
        receipt?: string | null;
      };
    };
  };
};

export async function applyCreditsPurchaseFromOrder(
  payload: LemonOrderPayload,
) {
  const orderId = String(payload?.data?.id || "");
  const attributes = payload?.data?.attributes;
  const customData = payload?.meta?.custom_data;
  const userId = customData?.userId || customData?.user_id;

  if (!orderId) {
    throw new Error("Missing Lemon order id.");
  }

  if (!userId) {
    throw new Error("Missing RealvsAi user id in webhook custom_data.");
  }

  if (!attributes || attributes.status !== "paid") {
    return { skipped: true, reason: "Order is not paid." };
  }

  const existingTransaction = await db.transaction.findUnique({
    where: { providerOrderId: orderId },
  });

  if (existingTransaction) {
    return { skipped: true, reason: "Order already processed." };
  }

  const variantId = attributes.first_order_item?.variant_id;
  const walletValueCents = Number(
    customData?.walletValueCents || customData?.credits || 0,
  );

  if (!variantId || !walletValueCents) {
    throw new Error("Unable to resolve wallet top-up value from Lemon order.");
  }

  // First payment: mark user as paid (idempotent — safe for webhook retries)
  await markUserAsPaid(userId);

  const finalWalletCents = walletValueCents;
  const bonusCents = 0;

  const wallet = await ensureUserWallet(userId);
  const nextBalance = wallet.balance + finalWalletCents;

  await db.$transaction(async (tx) => {
    await tx.transaction.create({
      data: {
        userId,
        walletId: wallet.id,
        type: TransactionType.PURCHASE,
        status: TransactionStatus.COMPLETED,
        amount: Number(attributes.total || 0),
        currency: attributes.currency || BILLING_CURRENCY,
        credits: finalWalletCents,
        balanceAfter: nextBalance,
        description: `${walletValueCents} credit top-up`,
        provider: "lemonsqueezy",
        providerOrderId: orderId,
        providerOrderNumber: attributes.order_number
          ? String(attributes.order_number)
          : null,
        providerCustomerId: attributes.customer_id
          ? String(attributes.customer_id)
          : null,
        providerProductId: attributes.first_order_item?.product_id
          ? String(attributes.first_order_item.product_id)
          : null,
        providerVariantId: String(variantId),
        providerProductName: attributes.first_order_item?.product_name || null,
        providerVariantName: attributes.first_order_item?.variant_name || null,
        receiptUrl: attributes.urls?.receipt || null,
        metadata: payload as any,
        processedAt: new Date(),
      },
    });

    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: nextBalance,
      },
    });
  });

  if (attributes.customer_id) {
    await upsertBillingCustomerFromOrder({
      userId,
      customerId: String(attributes.customer_id),
      customerEmail: attributes.user_email,
      customerName: attributes.user_name,
    });
  }

  await createPurchaseRecapMessage({
    userId,
    orderId,
    credits: finalWalletCents,
    amount: Number(attributes.total || 0),
    currency: attributes.currency || BILLING_CURRENCY,
  });

  return {
    skipped: false,
    userId,
    orderId,
    credits: finalWalletCents,
    bonusCents,
    nextBalance,
  };
}

export function serializeBillingCustomer(
  customer: Awaited<ReturnType<typeof getBillingCustomerByUserId>>,
) {
  if (!customer) return null;

  return {
    id: customer.id,
    provider: customer.provider,
    customerId: customer.customerId,
    customerEmail: customer.customerEmail,
    customerName: customer.customerName,
    city: customer.city,
    region: customer.region,
    country: customer.country,
    status: customer.status,
    customerPortalUrl: customer.customerPortalUrl,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
}

function getPlanCurrentPriceCents(planId: EarlyAccessPlanId | null) {
  if (!planId) return null;
  return EARLY_ACCESS_PLANS[planId]?.currentPriceCents ?? null;
}

function getPlanEarlyAccessPriceCents(planId: EarlyAccessPlanId | null) {
  if (!planId) return null;
  return EARLY_ACCESS_PLANS[planId]?.earlyAccessPriceCents ?? null;
}

function parseDate(value?: string | null) {
  return value ? new Date(value) : null;
}

function isTruthy(value: unknown) {
  return value === true || value === "true";
}

function normalizeSubscriptionStatus(
  status?: string | null,
): SubscriptionStatus | null {
  switch (String(status || "").toLowerCase()) {
    case "on_trial":
      return SubscriptionStatus.ON_TRIAL;
    case "active":
      return SubscriptionStatus.ACTIVE;
    case "paused":
      return SubscriptionStatus.PAUSED;
    case "past_due":
      return SubscriptionStatus.PAST_DUE;
    case "unpaid":
      return SubscriptionStatus.UNPAID;
    case "cancelled":
    case "canceled":
      return SubscriptionStatus.CANCELED;
    case "expired":
      return SubscriptionStatus.EXPIRED;
    default:
      return null;
  }
}

type V5SubscriptionPhaseKey =
  | "basicNormal"
  | "proEarlyAccess"
  | "proLoyalty"
  | "proNormal";

function getV5SubscriptionPhaseByVariantId(
  variantId: string | null,
): V5SubscriptionPhaseKey | null {
  if (!variantId) return null;

  if (
    SUBSCRIPTION_VARIANT_ENVS.basicNormal &&
    String(SUBSCRIPTION_VARIANT_ENVS.basicNormal) === variantId
  )
    return "basicNormal";
  if (
    SUBSCRIPTION_VARIANT_ENVS.proTrialEarlyAccess &&
    String(SUBSCRIPTION_VARIANT_ENVS.proTrialEarlyAccess) === variantId
  )
    return "proEarlyAccess";
  if (
    SUBSCRIPTION_VARIANT_ENVS.proTrialNormal &&
    String(SUBSCRIPTION_VARIANT_ENVS.proTrialNormal) === variantId
  )
    return "proNormal";
  if (
    SUBSCRIPTION_VARIANT_ENVS.proLoyalty &&
    String(SUBSCRIPTION_VARIANT_ENVS.proLoyalty) === variantId
  )
    return "proLoyalty";
  if (
    SUBSCRIPTION_VARIANT_ENVS.proNormal &&
    String(SUBSCRIPTION_VARIANT_ENVS.proNormal) === variantId
  )
    return "proNormal";

  return null;
}

function getV5SubscriptionPhaseConfig(phaseKey: V5SubscriptionPhaseKey) {
  return SUBSCRIPTION_PHASES[phaseKey];
}

function isTrialSubscriptionVariant(variantId: string | null) {
  return Boolean(
    variantId &&
    ((SUBSCRIPTION_VARIANT_ENVS.proTrialEarlyAccess &&
      String(SUBSCRIPTION_VARIANT_ENVS.proTrialEarlyAccess) === variantId) ||
      (SUBSCRIPTION_VARIANT_ENVS.proTrialNormal &&
        String(SUBSCRIPTION_VARIANT_ENVS.proTrialNormal) === variantId)),
  );
}

function isEarlyAccessTrialVariant(variantId: string | null) {
  return Boolean(
    variantId &&
    SUBSCRIPTION_VARIANT_ENVS.proTrialEarlyAccess &&
    String(SUBSCRIPTION_VARIANT_ENVS.proTrialEarlyAccess) === variantId,
  );
}

function getBillingPeriodStartedAt(attributes?: {
  created_at?: string | null;
}) {
  return parseDate(attributes?.created_at) ?? new Date();
}

export function serializeSubscription(
  subscription: Awaited<ReturnType<typeof getSubscriptionByUserId>>,
) {
  if (!subscription) return null;

  return {
    id: subscription.id,
    provider: subscription.provider,
    providerSubscriptionId: subscription.providerSubscriptionId,
    providerVariantId: subscription.providerVariantId,
    productName: subscription.productName,
    variantName: subscription.variantName,
    cardBrand: subscription.cardBrand,
    cardLastFour: subscription.cardLastFour,
    paymentProcessor: subscription.paymentProcessor,
    customerPortalUrl: subscription.customerPortalUrl,
    updatePaymentMethodUrl: subscription.updatePaymentMethodUrl,
    status: subscription.status,
    trialEndsAt: subscription.trialEndsAt,
    trialVariantId: subscription.trialVariantId,
    subscriptionCreditBalance: subscription.subscriptionCreditBalance,
    subscriptionPlanId: subscription.subscriptionPlanId,
    pricingPhase: null,
    subscriptionMonthlyCredits: subscription.subscriptionMonthlyCredits,
    subscriptionDeepVideoCount: subscription.subscriptionDeepVideoCount,
    subscriptionPriceCents: subscription.subscriptionPriceCents,
    subscriptionPriceLocked: subscription.subscriptionPriceLocked,
    currentPeriodEnd: subscription.currentPeriodEnd,
    renewsAt: subscription.renewsAt,
    endsAt: subscription.endsAt,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    createdAt: subscription.createdAt,
    updatedAt: subscription.updatedAt,
  };
}

export function serializeTransaction(
  transaction: Awaited<
    ReturnType<typeof getLatestSuccessfulTransactionByUserId>
  >,
) {
  if (!transaction) return null;

  return {
    id: transaction.id,
    type: transaction.type,
    status: transaction.status,
    amount: transaction.amount,
    currency: transaction.currency,
    credits: transaction.credits,
    description: transaction.description,
    providerOrderId: transaction.providerOrderId,
    providerOrderNumber: transaction.providerOrderNumber,
    providerProductName: transaction.providerProductName,
    providerVariantName: transaction.providerVariantName,
    receiptUrl: transaction.receiptUrl,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
  };
}

type LemonSubscriptionPayload = {
  meta?: {
    custom_data?: {
      userId?: string;
      user_id?: string;
      type?: string;
      planId?: string;
      subscriptionPlan?: string;
      subscriptionPriceCents?: string | number;
      subscriptionPriceLocked?: string | boolean;
      priceCents?: string | number;
      priceLocked?: string | boolean;
    };
  };
  data?: {
    id?: string;
    attributes?: {
      variant_id?: number | string;
      product_id?: number | string;
      product_name?: string | null;
      variant_name?: string | null;
      status?: string | null;
      created_at?: string | null;
      trial_ends_at?: string | null;
      ends_at?: string | null;
      renews_at?: string | null;
      customer_id?: number | string;
      user_email?: string | null;
      user_name?: string | null;
      customer_email?: string | null;
      customer_name?: string | null;
      card_brand?: string | null;
      card_last_four?: string | null;
      payment_processor?: string | null;
      urls?: {
        customer_portal?: string | null;
        update_payment_method?: string | null;
        customer_portal_update_subscription?: string | null;
      };
    };
  };
};

export async function activateTrialFromSubscription(
  payload: LemonSubscriptionPayload,
) {
  const subscriptionId = String(payload?.data?.id || "");
  const attributes = payload?.data?.attributes;
  const customData = payload?.meta?.custom_data;
  const userId = customData?.userId || customData?.user_id;
  const variantId = attributes?.variant_id
    ? String(attributes.variant_id)
    : null;
  const normalizedStatus = normalizeSubscriptionStatus(attributes?.status);

  if (!subscriptionId) {
    throw new Error("Missing Lemon subscription id.");
  }

  if (!userId) {
    throw new Error("Missing RealvsAi user id in webhook custom_data.");
  }

  if (!isTrialSubscriptionVariant(variantId)) {
    return {
      skipped: true,
      reason: "Not a V5 Pro trial variant subscription.",
    };
  }

  if (normalizedStatus !== SubscriptionStatus.ON_TRIAL) {
    return {
      skipped: true,
      reason: `Subscription status '${attributes?.status}' is not on_trial.`,
    };
  }

  const existing = await db.subscription.findUnique({
    where: { providerSubscriptionId: subscriptionId },
  });

  if (
    existing?.status === SubscriptionStatus.ON_TRIAL ||
    existing?.status === SubscriptionStatus.ACTIVE
  ) {
    return { skipped: true, reason: "Subscription already exists." };
  }

  const earlyAccessTrial = isEarlyAccessTrialVariant(variantId);
  const trialEndsAt = parseDate(attributes?.trial_ends_at);
  const renewsAt = parseDate(attributes?.renews_at);
  const endsAt = parseDate(attributes?.ends_at);

  // TODO Step 4b: enforce PaymentFingerprint here after we can fetch
  // Stripe PaymentMethod.card.fingerprint. LemonSqueezy subscription_created
  // only exposes card_brand/card_last_four/payment_processor, which is too weak.

  const wallet = await ensureUserWallet(userId);

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        trialScanBalance: 500,
        pricingPhase: PricingPhase.GROWTH,
      },
    });

    await tx.subscription.upsert({
      where: { userId },
      update: {
        providerSubscriptionId: subscriptionId,
        providerVariantId: variantId ?? null,
        productName: attributes?.product_name ?? null,
        variantName: attributes?.variant_name ?? null,
        cardBrand: attributes?.card_brand ?? null,
        cardLastFour: attributes?.card_last_four ?? null,
        paymentProcessor: attributes?.payment_processor ?? null,
        customerPortalUrl:
          attributes?.urls?.customer_portal ??
          attributes?.urls?.customer_portal_update_subscription ??
          null,
        updatePaymentMethodUrl: attributes?.urls?.update_payment_method ?? null,
        status: SubscriptionStatus.ON_TRIAL,
        pricingPhase: PricingPhase.GROWTH,
        trialVariantId: variantId ?? null,
        trialEndsAt,
        currentPeriodEnd: trialEndsAt,
        renewsAt,
        endsAt,
        subscriptionPlanId: "pro",
        subscriptionMonthlyCredits: 0,
        subscriptionCreditBalance: 0,
        subscriptionPriceCents: earlyAccessTrial
          ? SUBSCRIPTION_PHASES.proEarlyAccess.priceCents
          : SUBSCRIPTION_PHASES.proNormal.priceCents,
        subscriptionPriceLocked: false,
        lastSyncedAt: new Date(),
      },
      create: {
        userId,
        provider: "lemonsqueezy",
        providerSubscriptionId: subscriptionId,
        providerVariantId: variantId ?? null,
        productName: attributes?.product_name ?? null,
        variantName: attributes?.variant_name ?? null,
        cardBrand: attributes?.card_brand ?? null,
        cardLastFour: attributes?.card_last_four ?? null,
        paymentProcessor: attributes?.payment_processor ?? null,
        customerPortalUrl:
          attributes?.urls?.customer_portal ??
          attributes?.urls?.customer_portal_update_subscription ??
          null,
        updatePaymentMethodUrl: attributes?.urls?.update_payment_method ?? null,
        status: SubscriptionStatus.ON_TRIAL,
        pricingPhase: PricingPhase.GROWTH,
        trialVariantId: variantId ?? null,
        trialEndsAt,
        currentPeriodEnd: trialEndsAt,
        renewsAt,
        endsAt,
        subscriptionPlanId: "pro",
        subscriptionMonthlyCredits: 0,
        subscriptionCreditBalance: 0,
        subscriptionPriceCents: earlyAccessTrial
          ? SUBSCRIPTION_PHASES.proEarlyAccess.priceCents
          : SUBSCRIPTION_PHASES.proNormal.priceCents,
        subscriptionPriceLocked: false,
        lastSyncedAt: new Date(),
      },
    });

    // Record subscription start as a transaction for history
    await tx.transaction.create({
      data: {
        userId,
        walletId: wallet.id,
        type: TransactionType.SUBSCRIPTION_CREDIT,
        status: TransactionStatus.COMPLETED,
        amount: 0,
        credits: 500,
        description: "Pro trial start — 500 credits",
        provider: "lemonsqueezy",
      },
    });
  });

  if (attributes?.customer_id) {
    await upsertBillingCustomerFromOrder({
      userId,
      customerId: String(attributes.customer_id),
      customerEmail: attributes.user_email ?? attributes.customer_email,
      customerName: attributes.user_name ?? attributes.customer_name,
    });
  }

  return {
    skipped: false,
    userId,
    subscriptionId,
    status: "ON_TRIAL",
    trialBalance: 500,
    earlyAccessTrial,
  };
}

/**
 * Allocates monthly subscription credits when a paid subscription becomes ACTIVE.
 * Called on `subscription_updated` events where status transitions to ACTIVE.
 * Also resets credit balance on renewal.
 *
 * Refill rule: ONLY resets/allocates on validated renewal state transitions.
 * - subscription_created with status=ACTIVE → first allocation
 * - subscription_updated with status=ACTIVE and pre-existing subscription → renewal refill
 */
export async function syncSubscriptionLifecycle(
  payload: LemonSubscriptionPayload,
) {
  const subscriptionId = String(payload?.data?.id || "");
  const attributes = payload?.data?.attributes;

  if (!subscriptionId) {
    throw new Error("Missing Lemon subscription id.");
  }

  const existingSub = await db.subscription.findUnique({
    where: { providerSubscriptionId: subscriptionId },
  });

  if (!existingSub) {
    return { skipped: true, reason: "Subscription not found." };
  }

  const nextStatus =
    normalizeSubscriptionStatus(attributes?.status) ?? existingSub.status;
  const shouldClearLock = new Set<SubscriptionStatus>([
    SubscriptionStatus.CANCELED,
    SubscriptionStatus.EXPIRED,
    SubscriptionStatus.UNPAID,
    SubscriptionStatus.PAST_DUE,
  ]).has(nextStatus);

  await db.subscription.update({
    where: { providerSubscriptionId: subscriptionId },
    data: {
      status: nextStatus,
      cardBrand: attributes?.card_brand ?? existingSub.cardBrand,
      cardLastFour: attributes?.card_last_four ?? existingSub.cardLastFour,
      paymentProcessor:
        attributes?.payment_processor ?? existingSub.paymentProcessor,
      customerPortalUrl:
        attributes?.urls?.customer_portal ??
        attributes?.urls?.customer_portal_update_subscription ??
        existingSub.customerPortalUrl,
      updatePaymentMethodUrl:
        attributes?.urls?.update_payment_method ??
        existingSub.updatePaymentMethodUrl,
      currentPeriodEnd:
        parseDate(attributes?.renews_at) ?? existingSub.currentPeriodEnd,
      renewsAt: parseDate(attributes?.renews_at) ?? existingSub.renewsAt,
      endsAt: parseDate(attributes?.ends_at) ?? existingSub.endsAt,
      subscriptionPriceLocked: shouldClearLock
        ? false
        : existingSub.subscriptionPriceLocked,
      lastSyncedAt: new Date(),
    },
  });

  return {
    skipped: false,
    subscriptionId,
    clearedPriceLock: shouldClearLock,
    status: nextStatus,
  };
}

export async function allocateSubscriptionCredits(
  payload: LemonSubscriptionPayload,
) {
  const subscriptionId = String(payload?.data?.id || "");
  const attributes = payload?.data?.attributes;
  const variantId = attributes?.variant_id
    ? String(attributes.variant_id)
    : null;

  if (!subscriptionId) {
    throw new Error("Missing Lemon subscription id.");
  }

  const status = normalizeSubscriptionStatus(attributes?.status);

  if (status !== SubscriptionStatus.ACTIVE) {
    return {
      skipped: true,
      reason: `Subscription status '${attributes?.status}' does not trigger credit allocation.`,
    };
  }

  const existingSub = await db.subscription.findUnique({
    where: { providerSubscriptionId: subscriptionId },
  });

  if (!existingSub) {
    return {
      skipped: true,
      reason: "Subscription not found — cannot allocate credits.",
    };
  }

  const phaseKey = getV5SubscriptionPhaseByVariantId(variantId);
  const planId = getSubscriptionPlanByVariantId(variantId ?? "");

  if (!phaseKey || !planId) {
    return {
      skipped: true,
      reason:
        "Unknown subscription variant — credit allocation skipped. Configure V5 LS variant env vars.",
    };
  }

  const phase = getV5SubscriptionPhaseConfig(phaseKey);
  const customData = payload?.meta?.custom_data;
  const requestedPriceLocked =
    isTruthy(customData?.subscriptionPriceLocked) ||
    isTruthy(customData?.priceLocked);
  const requestedPriceCents = Number(
    customData?.subscriptionPriceCents ?? customData?.priceCents ?? NaN,
  );
  const earlyAccessPaidConversion =
    phaseKey === "proEarlyAccess" && requestedPriceLocked;
  const keepExistingLock =
    existingSub.subscriptionPriceLocked &&
    existingSub.subscriptionPlanId === planId;
  const nextPriceLocked = keepExistingLock || earlyAccessPaidConversion;
  const nextPriceCents = keepExistingLock
    ? existingSub.subscriptionPriceCents
    : earlyAccessPaidConversion && Number.isFinite(requestedPriceCents)
      ? requestedPriceCents
      : phase.priceCents;
  const nextPeriodStartedAt = getBillingPeriodStartedAt(attributes);
  const isNewBillingPeriod =
    !existingSub.currentPeriodStartedAt ||
    nextPeriodStartedAt.getTime() >
      existingSub.currentPeriodStartedAt.getTime();

  await db.$transaction(async (tx) => {
    await tx.subscription.update({
      where: { providerSubscriptionId: subscriptionId },
      data: {
        subscriptionCreditBalance: isNewBillingPeriod
          ? phase.monthlyCredits
          : existingSub.subscriptionCreditBalance,
        subscriptionPlanId: planId,
        subscriptionMonthlyCredits: phase.monthlyCredits,
        subscriptionPriceCents: nextPriceCents,
        subscriptionPriceLocked: nextPriceLocked,
        subscriptionDeepVideoCount: isNewBillingPeriod
          ? 0
          : existingSub.subscriptionDeepVideoCount,
        monthlyEstimatedHiveCostCents: isNewBillingPeriod
          ? 0
          : existingSub.monthlyEstimatedHiveCostCents,
        status: SubscriptionStatus.ACTIVE,
        pricingPhase: PricingPhase.GROWTH,
        currentPeriodStartedAt: isNewBillingPeriod
          ? nextPeriodStartedAt
          : existingSub.currentPeriodStartedAt,
        currentPeriodEnd:
          parseDate(attributes?.renews_at) ?? existingSub.currentPeriodEnd,
        renewsAt: parseDate(attributes?.renews_at) ?? existingSub.renewsAt,
        endsAt: parseDate(attributes?.ends_at) ?? existingSub.endsAt,
        cardBrand: attributes?.card_brand ?? existingSub.cardBrand,
        cardLastFour: attributes?.card_last_four ?? existingSub.cardLastFour,
        paymentProcessor:
          attributes?.payment_processor ?? existingSub.paymentProcessor,
        customerPortalUrl:
          attributes?.urls?.customer_portal ??
          attributes?.urls?.customer_portal_update_subscription ??
          existingSub.customerPortalUrl,
        updatePaymentMethodUrl:
          attributes?.urls?.update_payment_method ??
          existingSub.updatePaymentMethodUrl,
        lastSyncedAt: new Date(),
      },
    });

    await tx.user.update({
      where: { id: existingSub.userId },
      data: {
        isPaidUser: true,
        pricingPhase: PricingPhase.GROWTH,
        estimatedHiveCostCentsMonth: isNewBillingPeriod ? 0 : undefined,
      },
    });


    // Record paid subscription event as a transaction for history
    const wallet = await ensureUserWallet(existingSub.userId);
    await tx.transaction.create({
      data: {
        userId: existingSub.userId,
        walletId: wallet.id,
        type: TransactionType.SUBSCRIPTION_CREDIT,
        status: TransactionStatus.COMPLETED,
        amount: existingSub.subscriptionPriceCents ?? 0,
        credits: phase.monthlyCredits,
        description: `Pro subscription ${isNewBillingPeriod ? "initial" : "renewal"} — ${phase.monthlyCredits} credits`,
        provider: "lemonsqueezy",
        providerVariantId: variantId ?? null,
      },
    });
  });

  return {
    skipped: false,
    subscriptionId,
    variantId,
    phaseKey,
    monthlyCredits: phase.monthlyCredits,
    subscriptionPriceCents: nextPriceCents,
    subscriptionPriceLocked: nextPriceLocked,
    resetMonthlyCounters: isNewBillingPeriod,
  };
}
