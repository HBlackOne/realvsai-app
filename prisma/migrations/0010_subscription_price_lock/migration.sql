-- Add locked subscription pricing fields
ALTER TABLE "Subscription"
  ADD COLUMN "subscriptionPriceCents" INTEGER,
  ADD COLUMN "subscriptionPriceLocked" BOOLEAN NOT NULL DEFAULT false;

-- Backfill existing early-access subscribers so they keep their original pricing
UPDATE "Subscription"
SET
  "subscriptionPriceLocked" = true,
  "subscriptionPriceCents" = CASE
    WHEN "subscriptionPlanId" = 'basic' THEN 499
    WHEN "subscriptionPlanId" = 'pro' THEN 999
    ELSE "subscriptionPriceCents"
  END
WHERE "subscriptionPlanId" IN ('basic', 'pro');
