-- CreateEnum
CREATE TYPE "TranscriptionStatus" AS ENUM ('NONE', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "InspectionAudio" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "duration" DOUBLE PRECISION,
    "transcription" TEXT,
    "transcriptionStatus" "TranscriptionStatus" NOT NULL DEFAULT 'NONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InspectionAudio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InspectionAudio_inspectionId_idx" ON "InspectionAudio"("inspectionId");

-- AddForeignKey
ALTER TABLE "InspectionAudio" ADD CONSTRAINT "InspectionAudio_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
