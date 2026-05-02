-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SubscriptionStatus" ADD VALUE 'ON_TRIAL';
ALTER TYPE "SubscriptionStatus" ADD VALUE 'PAUSED';
ALTER TYPE "SubscriptionStatus" ADD VALUE 'UNPAID';

-- DropIndex
DROP INDEX "Transaction_lemonsqueezyOrderId_idx";

-- AlterTable
ALTER TABLE "BillingCustomer" ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "customerPortalUrl" TEXT,
ADD COLUMN     "lastSyncedAt" TIMESTAMP(3),
ADD COLUMN     "region" TEXT,
ADD COLUMN     "status" TEXT;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "cardBrand" TEXT,
ADD COLUMN     "cardLastFour" TEXT,
ADD COLUMN     "customerPortalUrl" TEXT,
ADD COLUMN     "endsAt" TIMESTAMP(3),
ADD COLUMN     "lastSyncedAt" TIMESTAMP(3),
ADD COLUMN     "paymentProcessor" TEXT,
ADD COLUMN     "productName" TEXT,
ADD COLUMN     "renewsAt" TIMESTAMP(3),
ADD COLUMN     "updatePaymentMethodUrl" TEXT,
ADD COLUMN     "variantName" TEXT;

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "lemonsqueezyOrderId",
DROP COLUMN "lemonsqueezyProductId",
ADD COLUMN     "credits" INTEGER,
ADD COLUMN     "currency" TEXT DEFAULT 'USD',
ADD COLUMN     "processedAt" TIMESTAMP(3),
ADD COLUMN     "provider" TEXT,
ADD COLUMN     "providerCustomerId" TEXT,
ADD COLUMN     "providerOrderId" TEXT,
ADD COLUMN     "providerOrderNumber" TEXT,
ADD COLUMN     "providerProductId" TEXT,
ADD COLUMN     "providerProductName" TEXT,
ADD COLUMN     "providerVariantId" TEXT,
ADD COLUMN     "providerVariantName" TEXT,
ADD COLUMN     "receiptUrl" TEXT;

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_eventId_key" ON "WebhookEvent"("eventId");

-- CreateIndex
CREATE INDEX "WebhookEvent_provider_eventName_idx" ON "WebhookEvent"("provider", "eventName");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_providerOrderId_key" ON "Transaction"("providerOrderId");

-- CreateIndex
CREATE INDEX "Transaction_providerCustomerId_idx" ON "Transaction"("providerCustomerId");

-- CreateIndex
CREATE INDEX "Transaction_providerVariantId_idx" ON "Transaction"("providerVariantId");

