-- Add subscription credit pool fields
-- subscriptionCreditBalance: monthly credits allocated by paid subscription
-- subscriptionPlanId: LS variant ID for the active plan (Basic/Pro/etc)
-- subscriptionMonthlyCredits: the monthly allocation amount (e.g. 500 for Basic, 1200 for Pro)

ALTER TABLE "Subscription" ADD COLUMN "subscriptionCreditBalance" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Subscription" ADD COLUMN "subscriptionPlanId" TEXT;
ALTER TABLE "Subscription" ADD COLUMN "subscriptionMonthlyCredits" INTEGER NOT NULL DEFAULT 0;
