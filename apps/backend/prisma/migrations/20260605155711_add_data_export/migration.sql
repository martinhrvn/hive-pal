-- CreateEnum
CREATE TYPE "AccountTransferJobType" AS ENUM ('EXPORT', 'IMPORT');

-- CreateEnum
CREATE TYPE "AccountTransferJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "AccountTransferJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AccountTransferJobType" NOT NULL,
    "status" "AccountTransferJobStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "inputStorageKey" TEXT,
    "resultStorageKey" TEXT,
    "resultExpiresAt" TIMESTAMP(3),
    "progress" TEXT,
    "errorMessage" TEXT,
    "summary" JSONB,

    CONSTRAINT "AccountTransferJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountTransferJob_userId_type_status_idx" ON "AccountTransferJob"("userId", "type", "status");

-- CreateIndex
CREATE INDEX "AccountTransferJob_status_startedAt_idx" ON "AccountTransferJob"("status", "startedAt");

-- CreateIndex
CREATE INDEX "AccountTransferJob_resultExpiresAt_idx" ON "AccountTransferJob"("resultExpiresAt");
