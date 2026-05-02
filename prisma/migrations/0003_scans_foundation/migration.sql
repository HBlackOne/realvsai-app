-- CreateEnum
CREATE TYPE "ScanMediaType" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO');

-- CreateEnum
CREATE TYPE "ScanInputType" AS ENUM ('FILE', 'URL');

-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELED');

-- CreateTable
CREATE TABLE "Scan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mediaType" "ScanMediaType" NOT NULL,
    "inputType" "ScanInputType" NOT NULL,
    "status" "ScanStatus" NOT NULL DEFAULT 'PENDING',
    "sourceLabel" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "originalFilename" TEXT,
    "costCredits" INTEGER NOT NULL,
    "verdict" TEXT,
    "confidence" INTEGER,
    "aiScore" DOUBLE PRECISION,
    "humanScore" DOUBLE PRECISION,
    "processingTimeMs" INTEGER,
    "generators" JSONB,
    "rawResult" JSONB,
    "errorMessage" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Scan_userId_createdAt_idx" ON "Scan"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Scan_status_createdAt_idx" ON "Scan"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Scan_mediaType_createdAt_idx" ON "Scan"("mediaType", "createdAt");

-- AddForeignKey
ALTER TABLE "Scan" ADD CONSTRAINT "Scan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

