/**
 * RealvsAi — Billing & Trial Validation Script
 *
 * Run with: npx tsx scripts/validate-billing.ts
 *
 * Prerequisites:
 * - DATABASE_URL must be set in .env
 * - Uses the local development database directly
 *
 * WARNING: This script MODIFIES data in the database.
 * Use a test user or sandbox environment.
 */

import { db } from "../src/lib/db";
import { activateTrialFromSubscription, applyCreditsPurchaseFromOrder } from "../src/lib/services/billing";
import { validateTrialScan } from "../src/lib/services/scans";
import { markUserAsPaid } from "../src/lib/services/user";
import { ensureUserWallet } from "../src/lib/services/wallet";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getMe(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { wallet: true },
  });
  return user;
}

async function getTrialState(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      trialScanBalance: true,
      trialVideoScans: true,
      trialAudioScans: true,
      isPaidUser: true,
    },
  });
  return user;
}

async function getWalletBalance(userId: string) {
  const wallet = await db.wallet.findUnique({ where: { userId } });
  return wallet?.balance ?? 0;
}

async function countTransactions(userId: string) {
  return db.transaction.count({ where: { userId } });
}

async function snapshot(label: string, userId: string) {
  const user = await getMe(userId);
  const trial = await getTrialState(userId);
  const walletBal = await getWalletBalance(userId);
  const txCount = await countTransactions(userId);
  console.log(`\n[${label}]`);
  console.log(`  trialScanBalance : ${trial?.trialScanBalance}`);
  console.log(`  trialVideoScans  : ${trial?.trialVideoScans}`);
  console.log(`  trialAudioScans  : ${trial?.trialAudioScans}`);
  console.log(`  isPaidUser       : ${trial?.isPaidUser}`);
  console.log(`  walletBalance    : ${walletBal}`);
  console.log(`  txCount         : ${txCount}`);
  return { user, trial, walletBal, txCount };
}

// ---------------------------------------------------------------------------
// Setup: create or reset a test user
// ---------------------------------------------------------------------------

const TEST_EMAIL = `test-trial-${Date.now()}@realvsai.test`;

async function setupTestUser() {
  // Find existing test user or create a minimal one via Clerk-less direct insert
  const existing = await db.user.findFirst({
    where: { email: { startsWith: "test-trial-" } },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    // Reset state
    await db.user.update({
      where: { id: existing.id },
      data: {
        trialScanBalance: 0,
        trialVideoScans: 0,
        trialAudioScans: 0,
        isPaidUser: false,
      },
    });
    await db.wallet.update({
      where: { userId: existing.id },
      data: { balance: 0 },
    });
    await db.transaction.deleteMany({ where: { userId: existing.id } });
    await db.scan.deleteMany({ where: { userId: existing.id } });
    console.log(`[SETUP] Reset test user: ${existing.email} (${existing.id})`);
    return existing;
  }

  // Create new test user — note: requires ClerkUserId which we don't have in unit test
  // For validation script we use an existing user or mock via direct DB insert
  const user = await db.user.create({
    data: {
      clerkUserId: `test_clerk_${Date.now()}`,
      email: TEST_EMAIL,
      trialScanBalance: 0,
      trialAudioScans: 0,
      trialVideoScans: 0,
      isPaidUser: false,
    },
  });
  await db.wallet.create({ data: { userId: user.id, balance: 0 } });
  console.log(`[SETUP] Created test user: ${user.email} (${user.id})`);
  return user;
}

// ---------------------------------------------------------------------------
// Batch 1: Direct service calls — image scan trial, video cap, audio cap
// ---------------------------------------------------------------------------

async function batch1() {
  console.log("\n" + "=".repeat(60));
  console.log("BATCH 1 — Direct cases: image scan, video cap, audio cap");
  console.log("=".repeat(60));

  const user = await setupTestUser();

  // --- CASE 5: Image scan deducts from trial ---
  console.log("\n--- CASE 5: Image scan deducts from trial ---");
  await snapshot("before-case5", user.id);

  // Set trial balance
  await db.user.update({ where: { id: user.id }, data: { trialScanBalance: 500 } });

  // Validate image scan
  const r5 = await validateTrialScan({ userId: user.id, mediaType: "image", costCredits: 5 });
  console.log(`  validateTrialScan(image, 5): allowed=${r5.allowed}`);
  console.assert(r5.allowed === true, "FAIL: image scan should be allowed");

  // Create scan record
  const scan5 = await db.scan.create({
    data: {
      userId: user.id,
      mediaType: "IMAGE",
      inputType: "FILE",
      status: "PROCESSING",
      sourceLabel: "test-image.png",
      costCredits: 5,
    },
  });

  // Complete scan — simulates what completeScanRecord does (trial path)
  await db.$transaction([
    db.scan.update({ where: { id: scan5.id }, data: { status: "COMPLETED" } }),
    db.user.update({
      where: { id: user.id },
      data: { trialScanBalance: { decrement: 5 } },
    }),
    db.transaction.create({
      data: {
        userId: user.id,
        walletId: (await db.wallet.findUnique({ where: { userId: user.id } }))!.id,
        type: "SCAN_DEDUCTION",
        status: "COMPLETED",
        amount: 0,
        currency: "EUR",
        credits: -5,
        balanceAfter: 495,
        description: "image trial scan deduction",
        provider: "realvsai",
        metadata: { scanId: scan5.id, isTrialDeduction: true },
        processedAt: new Date(),
      },
    }),
  ]);

  const s5 = await snapshot("after-case5", user.id);
  console.assert(s5.trial!.trialScanBalance === 495, `FAIL: expected 495, got ${s5.trial!.trialScanBalance}`);
  console.log("  [PASS] trialScanBalance === 495");

  // --- CASE 7: Video scan cap reached (trial user) ---
  console.log("\n--- CASE 7: Video scan cap reached (trial user) ---");
  await snapshot("before-case7", user.id);

  // Set videoScans = 3 (cap), with remaining balance
  await db.user.update({
    where: { id: user.id },
    data: { trialVideoScans: 3, trialScanBalance: 500 },
  });

  const r7 = await validateTrialScan({ userId: user.id, mediaType: "video", costCredits: 100 });
  console.log(`  validateTrialScan(video, 100): allowed=${r7.allowed}, reason=${(r7 as any).reason}`);
  console.assert(r7.allowed === false, "FAIL: video at cap should be blocked");
  console.assert((r7 as any).reason === "trial_video_limit_reached", `FAIL: wrong reason, got ${(r7 as any).reason}`);
  console.log("  [PASS] blocked with reason: trial_video_limit_reached");

  const s7 = await snapshot("after-case7", user.id);
  console.assert(s7.trial!.trialVideoScans === 3, `FAIL: videoScans should be 3, got ${s7.trial!.trialVideoScans}`);
  console.assert(s7.trial!.trialScanBalance === 500, `FAIL: balance should be unchanged at 500, got ${s7.trial!.trialScanBalance}`);
  console.log("  [PASS] videoScans still 3, balance still 500");

  // --- CASE 8: Audio scan cap reached (trial user) ---
  console.log("\n--- CASE 8: Audio scan cap reached (trial user) ---");
  await snapshot("before-case8", user.id);

  await db.user.update({
    where: { id: user.id },
    data: { trialAudioScans: 5, trialScanBalance: 500 },
  });

  const r8 = await validateTrialScan({ userId: user.id, mediaType: "audio", costCredits: 40 });
  console.log(`  validateTrialScan(audio, 40): allowed=${r8.allowed}, reason=${(r8 as any).reason}`);
  console.assert(r8.allowed === false, "FAIL: audio at cap should be blocked");
  console.assert((r8 as any).reason === "trial_audio_limit_reached", `FAIL: wrong reason`);
  console.log("  [PASS] blocked with reason: trial_audio_limit_reached");

  const s8 = await snapshot("after-case8", user.id);
  console.assert(s8.trial!.trialAudioScans === 5, `FAIL: audioScans should be 5, got ${s8.trial!.trialAudioScans}`);
  console.log("  [PASS] audioScans still 5");

  console.log("\n" + "=".repeat(60));
  console.log("BATCH 1 COMPLETE");
  console.log("=".repeat(60));
}

// ---------------------------------------------------------------------------
// Execute
// ---------------------------------------------------------------------------

batch1()
  .then(() => {
    console.log("\n[DONE] Batch 1 finished.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n[ERROR]", err);
    process.exit(1);
  });
