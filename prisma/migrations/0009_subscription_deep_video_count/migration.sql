-- Add deep video monthly usage counter for subscription plans.
-- Tracks how many deep video scans a subscriber has used in the current billing period.
-- Reset to 0 on each subscription_payment_success (renewal).
ALTER TABLE "Subscription" ADD COLUMN "subscriptionDeepVideoCount" INTEGER NOT NULL DEFAULT 0;
