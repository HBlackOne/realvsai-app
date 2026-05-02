-- Hybrid V5 core schema fields.
-- Adds pricing phase, early-access / loyalty flags, trial payment fingerprint lock,
-- and scan/cost tracking primitives. No checkout, webhook, or scan behavior changes yet.

-- Create pricing phase enum used by user/subscription state.
CREATE TYPE "PricingPhase" AS ENUM ('GROWTH', 'TRANSITION', 'SAFETY');

-- User-level V5 eligibility and protection tracking.
ALTER TABLE "User"
  ADD COLUMN "earlyAccessEligible" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "earlyAccessGrantedAt" TIMESTAMP(3),
  ADD COLUMN "loyaltyPhaseEligible" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "loyaltyPhaseGrantedAt" TIMESTAMP(3),
  ADD COLUMN "pricingPhase" "PricingPhase" NOT NULL DEFAULT 'GROWTH',
  ADD COLUMN "estimatedHiveCostCentsMonth" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "costSoftAlertAt" TIMESTAMP(3),
  ADD COLUMN "costHardStopAt" TIMESTAMP(3),
  ADD COLUMN "hardStopDeepScansUntil" TIMESTAMP(3);

-- Subscription-level phase and monthly cost/protection tracking.
ALTER TABLE "Subscription"
  ADD COLUMN "pricingPhase" "PricingPhase" NOT NULL DEFAULT 'GROWTH',
  ADD COLUMN "monthlyEstimatedHiveCostCents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "costSoftAlertAt" TIMESTAMP(3),
  ADD COLUMN "costHardStopAt" TIMESTAMP(3),
  ADD COLUMN "currentPeriodStartedAt" TIMESTAMP(3);

-- Permanent trial payment method fingerprint lock.
-- Fingerprint is hashed provider data only; never raw card/payment details.
CREATE TABLE "PaymentFingerprint" (
  "id" TEXT NOT NULL,
  "fingerprint" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PaymentFingerprint_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentFingerprint_fingerprint_key" ON "PaymentFingerprint"("fingerprint");
CREATE INDEX "PaymentFingerprint_userId_idx" ON "PaymentFingerprint"("userId");
CREATE INDEX "PaymentFingerprint_lockedAt_idx" ON "PaymentFingerprint"("lockedAt");

ALTER TABLE "PaymentFingerprint"
  ADD CONSTRAINT "PaymentFingerprint_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Scan-level V5 protection/cache tracking.
ALTER TABLE "Scan"
  ADD COLUMN "isDeepVideo" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "estimatedHiveCostCents" INTEGER,
  ADD COLUMN "cacheKey" TEXT,
  ADD COLUMN "hiveRequestId" TEXT;

CREATE INDEX "Scan_userId_isDeepVideo_createdAt_idx" ON "Scan"("userId", "isDeepVideo", "createdAt");
CREATE INDEX "Scan_cacheKey_idx" ON "Scan"("cacheKey");
