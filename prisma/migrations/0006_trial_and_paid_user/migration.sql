-- Add trial fields to User
ALTER TABLE "User" ADD COLUMN "trialScanBalance" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "trialVideoScans" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "trialAudioScans" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "isPaidUser" BOOLEAN NOT NULL DEFAULT false;

-- Add trial_variant_id to Subscription
ALTER TABLE "Subscription" ADD COLUMN "trialVariantId" TEXT;
