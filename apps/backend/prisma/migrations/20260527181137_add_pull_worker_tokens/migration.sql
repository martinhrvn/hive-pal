-- AlterTable
ALTER TABLE "InspectionAudio" ADD COLUMN     "analysisClaimedAt" TIMESTAMP(3),
ADD COLUMN     "analysisLeaseUntil" TIMESTAMP(3),
ADD COLUMN     "analysisRetries" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "analysisStatus" "TranscriptionStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "analysisWorkerTokenId" TEXT,
ADD COLUMN     "transcriptionClaimedAt" TIMESTAMP(3),
ADD COLUMN     "transcriptionError" TEXT,
ADD COLUMN     "transcriptionLeaseUntil" TIMESTAMP(3),
ADD COLUMN     "transcriptionRetries" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "transcriptionWorkerTokenId" TEXT;

-- CreateTable
CREATE TABLE "WorkerToken" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "WorkerToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkerToken_tokenHash_key" ON "WorkerToken"("tokenHash");

-- CreateIndex
CREATE INDEX "WorkerToken_revokedAt_idx" ON "WorkerToken"("revokedAt");

-- CreateIndex
CREATE INDEX "InspectionAudio_transcriptionStatus_idx" ON "InspectionAudio"("transcriptionStatus");

-- CreateIndex
CREATE INDEX "InspectionAudio_analysisStatus_idx" ON "InspectionAudio"("analysisStatus");

-- AddForeignKey
ALTER TABLE "WorkerToken" ADD CONSTRAINT "WorkerToken_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
