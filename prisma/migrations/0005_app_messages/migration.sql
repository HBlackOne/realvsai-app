-- CreateTable
CREATE TABLE "AppMessage" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "dedupeKey" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AppMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppMessage_dedupeKey_key" ON "AppMessage"("dedupeKey");
CREATE INDEX "AppMessage_userId_createdAt_idx" ON "AppMessage"("userId", "createdAt");
CREATE INDEX "AppMessage_userId_isRead_createdAt_idx" ON "AppMessage"("userId", "isRead", "createdAt");

-- AddForeignKey
ALTER TABLE "AppMessage" ADD CONSTRAINT "AppMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
