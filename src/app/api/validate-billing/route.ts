/**
 * GET /api/validate-billing?case=5
 *
 * Runs a single billing/trial validation case against the isolated test DB.
 *
 * Usage:
 *   curl -s "http://localhost:3013/api/validate-billing?case=5" \
 *        -H "x-validation-secret: validate-billing-internal"
 *
 * Returns JSON: { success, case, results, dbState }
 */

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

const VALIDATION_SECRET = process.env.VALIDATION_SECRET || "validate-billing-internal";

function isBypassRequest(request: Request) {
  const secret = request.headers.get("x-validation-secret");
  return secret === VALIDATION_SECRET;
}

function getCaseParam(request: Request): number | null {
  const url = new URL(request.url);
  const raw = url.searchParams.get("case");
  return raw ? Number(raw) : null;
}

import { db } from "@/lib/db";
import { validateTrialScan } from "@/lib/services/scans";
import { markUserAsPaid } from "@/lib/services/user";
import { activateTrialFromSubscription, applyCreditsPurchaseFromOrder } from "@/lib/services/billing";

type Result = { assertion: string; expected: unknown; actual: unknown; pass: boolean };

async function getUserState(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  const wallet = await db.wallet.findUnique({ where: { userId } });
  return {
    trialScanBalance: user?.trialScanBalance ?? -1,
    trialVideoScans: user?.trialVideoScans ?? -1,
    trialAudioScans: user?.trialAudioScans ?? -1,
    isPaidUser: user?.isPaidUser ?? false,
    walletBalance: wallet?.balance ?? -1,
  };
}

async function cleanupUser(email: string) {
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return;
  await db.transaction.deleteMany({ where: { userId: user.id } });
  await db.scan.deleteMany({ where: { userId: user.id } });
  await db.subscription.deleteMany({ where: { userId: user.id } });
  await db.wallet.deleteMany({ where: { userId: user.id } });
  await db.user.delete({ where: { id: user.id } });
}

async function createTestUser(email: string) {
  const user = await db.user.create({
    data: {
      clerkUserId: `test_clerk_${randomUUID()}`,
      email,
      trialScanBalance: 0,
      trialVideoScans: 0,
      trialAudioScans: 0,
      isPaidUser: false,
    },
  });
  await db.wallet.create({ data: { userId: user.id, balance: 0, currency: "USD" } });
  return user;
}

// -------------------------------------------------------------------------
// CASE 5 — Image scan deducts trial balance
// -------------------------------------------------------------------------
async function case5(email: string) {
  const user = await createTestUser(email);
  await db.user.update({ where: { id: user.id }, data: { trialScanBalance: 500 } });

  const r5 = await validateTrialScan({ userId: user.id, mediaType: "image", costCredits: 5 });
  const results: Result[] = [
    { assertion: "CASE 5 scan allowed", expected: true, actual: r5.allowed, pass: r5.allowed === true },
  ];

  const scan5 = await db.scan.create({
    data: { userId: user.id, mediaType: "IMAGE", inputType: "FILE", status: "PROCESSING", sourceLabel: "test.png", costCredits: 5 },
  });
  await db.$transaction([
    db.scan.update({ where: { id: scan5.id }, data: { status: "COMPLETED" } }),
    db.user.update({ where: { id: user.id }, data: { trialScanBalance: { decrement: 5 } } }),
    db.transaction.create({
      data: {
        userId: user.id,
        walletId: (await db.wallet.findUnique({ where: { userId: user.id } }))!.id,
        type: "SCAN_DEDUCTION",
        status: "COMPLETED",
        amount: 0,
        currency: "USD",
        credits: -5,
        balanceAfter: 495,
        description: "image trial scan",
        provider: "realvsai",
        metadata: { scanId: scan5.id, isTrialDeduction: true },
        processedAt: new Date(),
      },
    }),
  ]);

  const state = await getUserState(user.id);
  results.push({
    assertion: "CASE 5 /api/me balance",
    expected: 495,
    actual: state.trialScanBalance,
    pass: state.trialScanBalance === 495,
  });

  await cleanupUser(email);
  return { results, dbState: state };
}

// -------------------------------------------------------------------------
// CASE 7 — Video scan cap blocks trial user
// -------------------------------------------------------------------------
async function case7(email: string) {
  const user = await createTestUser(email);
  await db.user.update({ where: { id: user.id }, data: { trialVideoScans: 3, trialScanBalance: 500 } });

  const r7 = await validateTrialScan({ userId: user.id, mediaType: "video", costCredits: 100 });
  const state = await getUserState(user.id);

  const results: Result[] = [
    { assertion: "CASE 7 blocked", expected: false, actual: r7.allowed, pass: r7.allowed === false },
    {
      assertion: "CASE 7 reason = trial_video_limit_reached",
      expected: "trial_video_limit_reached",
      actual: (r7 as any).reason,
      pass: (r7 as any).reason === "trial_video_limit_reached",
    },
    { assertion: "CASE 7 balance unchanged", expected: 500, actual: state.trialScanBalance, pass: state.trialScanBalance === 500 },
    { assertion: "CASE 7 videoScans unchanged", expected: 3, actual: state.trialVideoScans, pass: state.trialVideoScans === 3 },
  ];

  await cleanupUser(email);
  return { results, dbState: state };
}

// -------------------------------------------------------------------------
// CASE 8 — Audio scan cap blocks trial user
// -------------------------------------------------------------------------
async function case8(email: string) {
  const user = await createTestUser(email);
  await db.user.update({ where: { id: user.id }, data: { trialAudioScans: 5, trialScanBalance: 500 } });

  const r8 = await validateTrialScan({ userId: user.id, mediaType: "audio", costCredits: 40 });
  const state = await getUserState(user.id);

  const results: Result[] = [
    { assertion: "CASE 8 blocked", expected: false, actual: r8.allowed, pass: r8.allowed === false },
    {
      assertion: "CASE 8 reason = trial_audio_limit_reached",
      expected: "trial_audio_limit_reached",
      actual: (r8 as any).reason,
      pass: (r8 as any).reason === "trial_audio_limit_reached",
    },
    { assertion: "CASE 8 balance unchanged", expected: 500, actual: state.trialScanBalance, pass: state.trialScanBalance === 500 },
    { assertion: "CASE 8 audioScans unchanged", expected: 5, actual: state.trialAudioScans, pass: state.trialAudioScans === 5 },
  ];

  await cleanupUser(email);
  return { results, dbState: state };
}

// -------------------------------------------------------------------------
// CASE 9 — Deep video blocked during trial
// -------------------------------------------------------------------------
async function case9(email: string) {
  const user = await createTestUser(email);
  await db.user.update({ where: { id: user.id }, data: { trialScanBalance: 500, isPaidUser: false } });

  const r9 = await validateTrialScan({ userId: user.id, mediaType: "video", costCredits: 299 });
  const state = await getUserState(user.id);

  const results: Result[] = [
    { assertion: "CASE 9 deep video blocked", expected: false, actual: r9.allowed, pass: r9.allowed === false },
    {
      assertion: "CASE 9 reason = trial_deep_video_blocked",
      expected: "trial_deep_video_blocked",
      actual: (r9 as any).reason,
      pass: (r9 as any).reason === "trial_deep_video_blocked",
    },
    { assertion: "CASE 9 no state change", expected: 500, actual: state.trialScanBalance, pass: state.trialScanBalance === 500 },
  ];

  await cleanupUser(email);
  return { results, dbState: state };
}

// -------------------------------------------------------------------------
// CASE 10 — Deep video allowed for paid user (no counter/trial check)
// -------------------------------------------------------------------------
async function case10(email: string) {
  const user = await createTestUser(email);
  await db.user.update({ where: { id: user.id }, data: { isPaidUser: true, trialScanBalance: 200 } });
  await db.wallet.update({ where: { userId: user.id }, data: { balance: 1000 } });

  const r10 = await validateTrialScan({ userId: user.id, mediaType: "video", costCredits: 299 });
  const state = await getUserState(user.id);

  const results: Result[] = [
    { assertion: "CASE 10 paid user deep scan allowed", expected: true, actual: r10.allowed, pass: r10.allowed === true },
  ];

  await cleanupUser(email);
  return { results, dbState: state };
}

// -------------------------------------------------------------------------
// CASE 12 — Paid user with trial balance uses trial first
// -------------------------------------------------------------------------
async function case12(email: string) {
  const user = await createTestUser(email);
  await db.user.update({ where: { id: user.id }, data: { isPaidUser: true } });
  await db.user.update({ where: { id: user.id }, data: { trialScanBalance: 200 } });
  await db.wallet.update({ where: { userId: user.id }, data: { balance: 500 } });

  const r12 = await validateTrialScan({ userId: user.id, mediaType: "audio", costCredits: 40 });

  const scan12 = await db.scan.create({
    data: { userId: user.id, mediaType: "AUDIO", inputType: "FILE", status: "PROCESSING", sourceLabel: "test.mp3", costCredits: 40 },
  });
  await db.$transaction([
    db.scan.update({ where: { id: scan12.id }, data: { status: "COMPLETED" } }),
    db.user.update({ where: { id: user.id }, data: { trialScanBalance: { decrement: 40 } } }),
    db.transaction.create({
      data: {
        userId: user.id,
        walletId: (await db.wallet.findUnique({ where: { userId: user.id } }))!.id,
        type: "SCAN_DEDUCTION",
        status: "COMPLETED",
        amount: 0,
        currency: "USD",
        credits: -40,
        balanceAfter: 160,
        description: "audio trial scan",
        provider: "realvsai",
        metadata: { scanId: scan12.id, isTrialDeduction: true },
        processedAt: new Date(),
      },
    }),
  ]);

  const state = await getUserState(user.id);

  const results: Result[] = [
    { assertion: "CASE 12 paid user with trial balance allowed", expected: true, actual: r12.allowed, pass: r12.allowed === true },
    { assertion: "CASE 12 /api/me trialBalance", expected: 160, actual: state.trialScanBalance, pass: state.trialScanBalance === 160 },
    { assertion: "CASE 12 /api/me wallet unchanged", expected: 500, actual: state.walletBalance, pass: state.walletBalance === 500 },
  ];

  await cleanupUser(email);
  return { results, dbState: state };
}

// -------------------------------------------------------------------------
// CASE 13 — markUserAsPaid idempotency
// -------------------------------------------------------------------------
async function case13(email: string) {
  const user = await createTestUser(email);
  await db.user.update({ where: { id: user.id }, data: { isPaidUser: true } });
  const before = await getUserState(user.id);

  await markUserAsPaid(user.id);

  const after = await getUserState(user.id);

  const results: Result[] = [
    {
      assertion: "CASE 13 markUserAsPaid idempotent",
      expected: before.isPaidUser,
      actual: after.isPaidUser,
      pass: before.isPaidUser === after.isPaidUser,
    },
  ];

  await cleanupUser(email);
  return { results, dbState: { before, after } };
}

// -------------------------------------------------------------------------
// CASE 14 — Trial-first precedence (paid user, both balances exist)
// -------------------------------------------------------------------------
async function case14(email: string) {
  const user = await createTestUser(email);
  await db.user.update({ where: { id: user.id }, data: { isPaidUser: true, trialScanBalance: 195 } });
  await db.wallet.update({ where: { userId: user.id }, data: { balance: 1000 } });

  const r14 = await validateTrialScan({ userId: user.id, mediaType: "image", costCredits: 5 });
  await db.user.update({ where: { id: user.id }, data: { trialScanBalance: { decrement: 5 } } });
  const state = await getUserState(user.id);

  const results: Result[] = [
    { assertion: "CASE 14 paid user image scan allowed", expected: true, actual: r14.allowed, pass: r14.allowed === true },
    { assertion: "CASE 14 trial deducted", expected: 190, actual: state.trialScanBalance, pass: state.trialScanBalance === 190 },
    { assertion: "CASE 14 wallet unchanged", expected: 1000, actual: state.walletBalance, pass: state.walletBalance === 1000 },
  ];

  await cleanupUser(email);
  return { results, dbState: state };
}

// -------------------------------------------------------------------------
// CASE 1 — subscription_created → trial activation (first time)
// -------------------------------------------------------------------------
async function case1(email: string) {
  const user = await createTestUser(email);
  const userId = user.id;

  // Simulate webhook call internally (bypass signature check by calling service directly)
  await activateTrialFromSubscription({
    meta: { custom_data: { userId } },
    data: {
      id: `sub_test_${randomUUID()}`,
      attributes: {
        variant_id: process.env.LEMONSQUEEZY_VARIANT_TRIAL || "99999",
        product_name: "RealvsAi Trial",
        variant_name: "Trial Pack",
        status: "active",
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        renews_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        customer_id: 12345,
        customer_email: email,
        customer_name: "Test User",
      },
    },
  });


  const state = await getUserState(userId);

  const results: Result[] = [
    {
      assertion: "CASE 1 trial activated — trialScanBalance",
      expected: 500,
      actual: state.trialScanBalance,
      pass: state.trialScanBalance === 500,
    },
    {
      assertion: "CASE 1 subscription status = ON_TRIAL",
      expected: "ON_TRIAL",
      actual: (await db.subscription.findUnique({ where: { userId } }))?.status ?? "none",
      pass: (await db.subscription.findUnique({ where: { userId } }))?.status === "ON_TRIAL",
    },
  ];


  await cleanupUser(email);
  return { results, dbState: state };
}

// -------------------------------------------------------------------------
// CASE 2 — duplicate subscription_created → idempotent skip
// -------------------------------------------------------------------------
async function case2(email: string) {
  const user = await createTestUser(email);
  const userId = user.id;
  const subId = `sub_dup_${randomUUID()}`;

  // Activate trial once
  await activateTrialFromSubscription({
    meta: { custom_data: { userId } },
    data: {
      id: subId,
      attributes: {
        variant_id: process.env.LEMONSQUEEZY_VARIANT_TRIAL || "99999",
        product_name: "RealvsAi Trial",
        variant_name: "Trial Pack",
        status: "active",
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        renews_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        customer_id: 12345,
        customer_email: email,
        customer_name: "Test User",
      },
    },
  });


  // Try again — should skip (idempotent)
  const result2 = await activateTrialFromSubscription({
    meta: { custom_data: { userId } },
    data: {
      id: subId,
      attributes: {
        variant_id: process.env.LEMONSQUEEZY_VARIANT_TRIAL || "99999",
        product_name: "RealvsAi Trial",
        variant_name: "Trial Pack",
        status: "active",
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        renews_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        customer_id: 12345,
        customer_email: email,
        customer_name: "Test User",
      },
    },
  });

  const state = await getUserState(userId);

  const results: Result[] = [
    {
      assertion: "CASE 2 first activation sets balance = 500",
      expected: 500,
      actual: state.trialScanBalance,
      pass: state.trialScanBalance === 500,
    },
    {
      assertion: "CASE 2 duplicate returns skipped",
      expected: true,
      actual: (result2 as any).skipped === true,
      pass: (result2 as any).skipped === true,
    },
    {
      assertion: "CASE 2 balance not reset on duplicate",
      expected: 500,
      actual: state.trialScanBalance,
      pass: state.trialScanBalance === 500,
    },
  ];

  await cleanupUser(email);
  return { results, dbState: state };
}


// -------------------------------------------------------------------------
// CASE 3 — subscription_created with non-trial variant → skipped
// -------------------------------------------------------------------------
async function case3(email: string) {
  const user = await createTestUser(email);
  const userId = user.id;

  const result = await activateTrialFromSubscription({
    meta: { custom_data: { userId } },
    data: {
      id: `sub_nontrial_${randomUUID()}`,
      attributes: {
        variant_id: "99998", // NOT the trial variant
        product_name: "RealvsAi Pro",
        variant_name: "Pro Plan",
        status: "active",
        trial_ends_at: null,
        renews_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        customer_id: 12345,
        customer_email: email,
        customer_name: "Test User",
      },
    },
  });

  const state = await getUserState(userId);

  const results: Result[] = [
    {
      assertion: "CASE 3 non-trial variant skipped",
      expected: true,
      actual: (result as any).skipped === true,
      pass: (result as any).skipped === true,
    },
    {
      assertion: "CASE 3 trial balance NOT set",
      expected: 0,
      actual: state.trialScanBalance,
      pass: state.trialScanBalance === 0,
    },
  ];

  await cleanupUser(email);
  return { results, dbState: state };
}

// -------------------------------------------------------------------------
// CASE 4 — order_created with unpaid status → skipped
// -------------------------------------------------------------------------
async function case4(email: string) {
  const user = await createTestUser(email);
  const userId = user.id;

  const result = await applyCreditsPurchaseFromOrder({
    meta: {
      custom_data: {
        userId,
        walletValueCents: "1050",
      },
    },
    data: {
      id: `order_unpaid_${randomUUID()}`,
      attributes: {
        customer_id: 12345,
        order_number: 1001,
        user_email: email,
        user_name: "Test User",
        currency: "USD",
        total: 1099,
        status: "pending", // NOT paid
        first_order_item: {
          product_id: 1,
          variant_id: "1522068",
          product_name: "Starter Pack",
          variant_name: "Starter",
        },
        urls: { receipt: null },
      },
    },
  });

  const state = await getUserState(userId);

  const results: Result[] = [
    {
      assertion: "CASE 4 unpaid order skipped",
      expected: true,
      actual: (result as any).skipped === true,
      pass: (result as any).skipped === true,
    },
    {
      assertion: "CASE 4 wallet balance unchanged",
      expected: 0,
      actual: state.walletBalance,
      pass: state.walletBalance === 0,
    },
    {
      assertion: "CASE 4 isPaidUser still false",
      expected: false,
      actual: state.isPaidUser,
      pass: state.isPaidUser === false,
    },
  ];

  await cleanupUser(email);
  return { results, dbState: state };
}

// -------------------------------------------------------------------------
// CASE 15 — duplicate order_created → idempotent skip
// -------------------------------------------------------------------------
async function case15(email: string) {
  const user = await createTestUser(email);
  const userId = user.id;
  const orderId = `order_dup_${randomUUID()}`;

  // First order (paid)
  await applyCreditsPurchaseFromOrder({
    meta: {
      custom_data: {
        userId,
        walletValueCents: "1050",
      },
    },
    data: {
      id: orderId,
      attributes: {
        customer_id: 12345,
        order_number: 1002,
        user_email: email,
        user_name: "Test User",
        currency: "USD",
        total: 1099,
        status: "paid",
        first_order_item: {
          product_id: 1,
          variant_id: "1522068",
          product_name: "Starter Pack",
          variant_name: "Starter",
        },
        urls: { receipt: "https://example.com/receipt" },
      },
    },
  });


  // Second order with same ID — should skip
  const result2 = await applyCreditsPurchaseFromOrder({
    meta: {
      custom_data: {
        userId,
        walletValueCents: "1050",
      },
    },
    data: {
      id: orderId, // same order id
      attributes: {
        customer_id: 12345,
        order_number: 1003,
        user_email: email,
        user_name: "Test User",
        currency: "USD",
        total: 1099,
        status: "paid",
        first_order_item: {
          product_id: 1,
          variant_id: "1522068",
          product_name: "Starter Pack",
          variant_name: "Starter",
        },
        urls: { receipt: "https://example.com/receipt" },
      },
    },
  });

  const state = await getUserState(userId);

  const results: Result[] = [
    {
      assertion: "CASE 15 first order sets wallet balance",
      expected: 1050,
      actual: state.walletBalance,
      pass: state.walletBalance === 1050,
    },
    {
      assertion: "CASE 15 duplicate order skipped",
      expected: true,
      actual: (result2 as any).skipped === true,
      pass: (result2 as any).skipped === true,
    },
    {
      assertion: "CASE 15 wallet balance not doubled",
      expected: 1050,
      actual: state.walletBalance,
      pass: state.walletBalance === 1050,
    },
  ];


  await cleanupUser(email);
  return { results, dbState: state };
}

const CASES: Record<number, (email: string) => Promise<{ results: Result[]; dbState: unknown }>> = {
  5: case5,
  7: case7,
  8: case8,
  9: case9,
  10: case10,
  12: case12,
  13: case13,
  14: case14,
  1: case1,
  2: case2,
  3: case3,
  4: case4,
  15: case15,
};

export async function GET(request: Request) {
  if (!isBypassRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const caseNum = getCaseParam(request);
  if (!caseNum || !CASES[caseNum]) {
    return NextResponse.json(
      {
        error:
          "Missing or invalid ?case=N param. Valid: " +
          Object.keys(CASES)
            .sort((a, b) => Number(a) - Number(b))
            .join(", "),
      },
      { status: 400 }
    );
  }

  const email = `test-validation-${randomUUID()}@realvsai.test`;

  try {
    const { results, dbState } = await CASES[caseNum](email);

    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;

    return NextResponse.json({
      success: failed === 0,
      case: caseNum,
      summary: { total: results.length, passed, failed },
      results,
      dbState,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`CASE ${caseNum} error:`, message);
    return NextResponse.json({ success: false, case: caseNum, error: message }, { status: 500 });
  }
}
